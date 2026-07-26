import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest } from '../middleware/auth';
import { DocumentStore } from '../models/store';
import { config } from '../config';
import { checkDocumentQuality } from '../services/qualityService';
import { preprocessDocument } from '../services/preprocessingService';
import { extractBatchDocumentFields, FileBatchItem } from '../services/extractionService';
import { normalizeField, canonicalFieldKey } from '../services/normalizationService';
import { AuditService } from '../services/auditService';
import logger, { logExtractionMetrics } from '../services/logger';

const router = Router();
fs.mkdirSync(config.upload.dir, { recursive: true });
const allowed = new Map([['.png','image/png'], ['.jpg','image/jpeg'], ['.jpeg','image/jpeg'], ['.pdf','application/pdf']]);

const upload = multer({
  storage: multer.diskStorage({
    destination: config.upload.dir,
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: config.upload.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, allowed.get(path.extname(file.originalname).toLowerCase()) === file.mimetype),
});

const safeDelete = (filePath: string) => { try { fs.unlinkSync(filePath); } catch { /* ignore */ } };

function magicMatches(filePath: string, mime: string): boolean {
  try {
    const b = fs.readFileSync(filePath).subarray(0, 8);
    const png = b.equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
    const jpeg = b.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff]));
    const pdf = b.subarray(0,5).toString() === '%PDF-';
    return (mime === 'image/png' && png) || (mime === 'image/jpeg' && jpeg) || (mime === 'application/pdf' && pdf);
  } catch { return false; }
}

function safeDocument(doc: any) {
  if (!doc) return null;
  return {
    ...doc,
    extractedFields: (doc.extractedFields || []).map((f: any) => ({
      ...f,
      value: /(?:aadhaar|pan)_number/.test(canonicalFieldKey(f.fieldKey)) ? `••••${String(f.value).replace(/\s/g, '').slice(-4)}` : f.value,
      evidenceText: undefined,
    })),
  };
}

// POST /documents — Single Request Batch Document Upload & Extraction
router.post('/', authenticate, upload.array('documents', config.upload.maxFiles), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (req.header('x-processing-consent') !== 'true') { res.status(400).json({ error: 'Explicit processing consent is required.' }); return; }

  const files = req.files as Express.Multer.File[];
  if (!files?.length) { res.status(400).json({ error: 'No documents uploaded' }); return; }

  const batchStart = Date.now();
  const validFiles: { file: Express.Multer.File; index: number }[] = [];
  const responseDocs: unknown[] = [];
  const preprocessResults: { index: number; pageImages: string[]; cleanup: () => void; processedSizeBytes: number }[] = [];

  // 1. Content Verification
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!magicMatches(file.path, file.mimetype)) {
      safeDelete(file.path);
      responseDocs.push({ error: `${file.originalname} failed content verification.` });
    } else {
      validFiles.push({ file, index: i });
    }
  }

  if (validFiles.length === 0) {
    res.status(400).json({ documents: responseDocs });
    return;
  }

  try {
    // 2. Parallel Image & PDF Preprocessing
    await Promise.all(
      validFiles.map(async ({ file, index }) => {
        const prep = await preprocessDocument(file.path, file.mimetype);
        preprocessResults.push({ index, pageImages: prep.pageImages, cleanup: prep.cleanup, processedSizeBytes: prep.processedSizeBytes });
      })
    );

    // Build batch payload for single-request Gemini call
    const fileBatchItems: FileBatchItem[] = preprocessResults.map(p => ({
      fileIndex: p.index,
      pageImages: p.pageImages,
    }));

    // 3. Single-Request Gemini Batch Extraction
    const extractionMap = await extractBatchDocumentFields(fileBatchItems);

    // 4. Document Store Update & Normalization
    for (const { file, index } of validFiles) {
      const prepInfo = preprocessResults.find(p => p.index === index);
      const extraction = extractionMap.get(index);
      const doc = DocumentStore.create({
        userId: req.user.id,
        docType: 'unknown',
        title: file.originalname,
        status: 'processing',
        originalFilename: file.originalname,
        storedFilename: file.filename,
        contentType: file.mimetype,
        size: file.size,
        needsReview: false,
      });

      if (!extraction || !prepInfo) {
        DocumentStore.update(doc._id, { status: 'failed', needsReview: true });
        responseDocs.push(safeDocument(DocumentStore.findById(doc._id)));
        continue;
      }

      // Quality Check on first preprocessed page
      const quality = await checkDocumentQuality(prepInfo.pageImages[0], 'image/jpeg');
      if (quality.status === 'fail') {
        DocumentStore.update(doc._id, { quality, status: 'failed', needsReview: true });
        logExtractionMetrics({
          docId: doc._id,
          status: 'failed',
          inputSizeBytes: file.size,
          timings: { totalMs: Date.now() - batchStart },
          fallbackReason: 'quality_check_failed',
        });
        responseDocs.push(safeDocument(DocumentStore.findById(doc._id)));
        continue;
      }

      // Normalize fields
      const normalizedFields = extraction.fields.map(f => {
        const fieldKey = canonicalFieldKey(f.fieldKey);
        const normal = normalizeField(fieldKey, f.value);
        return {
          ...f,
          fieldKey,
          normalized: normal.normalized,
          incomplete: normal.incomplete,
          invalidReason: f.confidence < 0.6 || !normal.normalized ? 'low_confidence_or_invalid_value' : null,
        };
      });

      const totalMs = Date.now() - batchStart;

      DocumentStore.update(doc._id, {
        quality,
        docType: extraction.docType,
        title: extraction.docType === 'unknown' ? doc.title : extraction.docType.replace(/_/g, ' ').toUpperCase(),
        status: 'ready',
        extractedFields: normalizedFields,
        needsReview: extraction.needsReview || quality.status === 'warn',
      });

      AuditService.log(req.user.id, 'document.extracted', {
        docId: doc._id,
        docType: extraction.docType,
        fieldCount: normalizedFields.length,
        usedFallback: extraction.usedFallback,
        totalMs,
      });

      logExtractionMetrics({
        docId: doc._id,
        docType: extraction.docType,
        status: 'ready',
        inputSizeBytes: file.size,
        processedSizeBytes: prepInfo.processedSizeBytes,
        timings: {
          geminiMs: extraction.geminiMs,
          validationMs: extraction.validationMs,
          paddleMs: extraction.paddleMs,
          totalMs,
        },
        fallbackReason: extraction.fallbackReason,
        fieldCount: normalizedFields.length,
      });

      responseDocs.push(safeDocument(DocumentStore.findById(doc._id)));
    }

  } catch (error) {
    logger.error('[Documents API] Batch document extraction error:', error);
  } finally {
    // Safe Cleanup of temporary derivative files & original upload files
    for (const p of preprocessResults) {
      p.cleanup();
    }
    for (const { file } of validFiles) {
      safeDelete(file.path);
    }
  }

  res.status(201).json({ documents: responseDocs });
});

router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  res.json({ documents: DocumentStore.findByUser(req.user.id).map(safeDocument) });
});

router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const doc = DocumentStore.findById(req.params.id);
  if (!doc || doc.userId !== req.user.id) { res.status(404).json({ error: 'Document not found' }); return; }
  res.json({ document: safeDocument(doc) });
});

router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const doc = DocumentStore.findById(req.params.id);
  if (!doc || doc.userId !== req.user.id) { res.status(404).json({ error: 'Document not found' }); return; }
  safeDelete(path.join(config.upload.dir, doc.storedFilename));
  DocumentStore.delete(doc._id);
  AuditService.log(req.user.id, 'document.deleted', { docId: doc._id });
  res.status(204).send();
});

export default router;
