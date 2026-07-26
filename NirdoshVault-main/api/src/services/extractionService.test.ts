import assert from 'assert';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

import {
  ExtractedDocSchema,
  BatchExtractedDocSchema,
  validateExtractionQuality,
  paddleOCR,
} from './extractionService';

import { preprocessDocument } from './preprocessingService';

async function runExtractionTests() {
  console.log(
    '--- Running Single-Request Batch Extraction & Schema Unit Tests ---'
  );

  // 1. Single-document schema validation
  const rawValidDoc = ExtractedDocSchema.parse({
    fileIndex: 0,
    docType: 'aadhaar',
    fields: [
      {
        fieldKey: 'aadhaar_no',
        label: 'Aadhaar Number',
        value: '1234 5678 9012',
        normalized: '1234 5678 9012',
        type: 'string',
        page: 1,
        confidence: 0.95,
        evidenceText: '1234 5678 9012',
      },
      {
        fieldKey: 'full_name',
        label: 'Name',
        value: 'John Doe',
        normalized: 'John Doe',
        type: 'string',
        page: 1,
        confidence: 0.9,
        evidenceText: 'John Doe',
      },
    ],
    needsReview: false,
  });

  assert.equal(rawValidDoc.docType, 'aadhaar');
  assert.equal(rawValidDoc.fields.length, 2);

  // 2. Tolerant Gemini value handling
  const tolerantDoc = ExtractedDocSchema.parse({
    fileIndex: '0',
    docType: 'aadhaar',
    fields: [
      {
        fieldKey: 'aadhaar_no',
        label: 'Aadhaar Number',
        value: '1234 5678 9012',
        page: '1',
        confidence: 95,
      },
    ],
  });

  assert.equal(tolerantDoc.fileIndex, 0);
  assert.equal(tolerantDoc.fields[0].page, 1);
  assert.equal(tolerantDoc.fields[0].confidence, 0.95);

  // 3. Multi-document batch schema validation
  const rawBatchDoc = BatchExtractedDocSchema.parse({
    documents: [
      {
        fileIndex: 0,
        docType: 'aadhaar',
        fields: [
          {
            fieldKey: 'aadhaar_no',
            label: 'Aadhaar Number',
            value: '1234 5678 9012',
            normalized: '',
            type: 'string',
            page: 1,
            confidence: 0.95,
            evidenceText: '',
          },
        ],
        needsReview: false,
      },
      {
        fileIndex: 1,
        docType: 'pan',
        fields: [
          {
            fieldKey: 'pan_no',
            label: 'PAN Number',
            value: 'ABCDE1234F',
            normalized: '',
            type: 'string',
            page: 1,
            confidence: 0.95,
            evidenceText: '',
          },
        ],
        needsReview: false,
      },
    ],
  });

  assert.equal(rawBatchDoc.documents.length, 2);
  assert.equal(rawBatchDoc.documents[0].docType, 'aadhaar');
  assert.equal(rawBatchDoc.documents[1].docType, 'pan');

  // 4. Minimum viable field quality check
  const invalidAadhaar = ExtractedDocSchema.parse({
    fileIndex: 0,
    docType: 'aadhaar',
    fields: [
      {
        fieldKey: 'gender',
        label: 'Gender',
        value: 'Male',
        normalized: '',
        type: 'string',
        page: 1,
        confidence: 0.9,
        evidenceText: '',
      },
    ],
    needsReview: false,
  });

  const qualityCheck = validateExtractionQuality(invalidAadhaar);

  assert.equal(qualityCheck.valid, false);
  assert.equal(
    qualityCheck.reason,
    'missing_aadhaar_key_fields'
  );

  // 5. Alias field quality validation
  const aliasAadhaar = ExtractedDocSchema.parse({
    fileIndex: 0,
    docType: 'aadhaar',
    fields: [
      {
        fieldKey: 'aadhaar_number',
        label: 'Aadhaar Number',
        value: '1234 5678 9012',
        confidence: 0.95,
      },
    ],
  });

  const aliasQuality = validateExtractionQuality(aliasAadhaar);

  assert.equal(aliasQuality.valid, true);

  // 6. Image preprocessing and resizing test
  const testImgPath = path.join(
    __dirname,
    'test_batch_sample.jpg'
  );

  await sharp({
    create: {
      width: 2400,
      height: 1800,
      channels: 3,
      background: {
        r: 255,
        g: 255,
        b: 255,
      },
    },
  })
    .jpeg()
    .toFile(testImgPath);

  try {
    const prepResult = await preprocessDocument(
      testImgPath,
      'image/jpeg'
    );

    assert.equal(prepResult.pageImages.length, 1);

    const meta = await sharp(
      prepResult.pageImages[0]
    ).metadata();

    // Match this value to preprocessingService.ts.
    assert.ok((meta.width ?? 0) <= 1500);
    assert.ok((meta.height ?? 0) <= 1500);

    prepResult.cleanup();
  } finally {
    try {
      fs.unlinkSync(testImgPath);
    } catch {
      // Ignore cleanup errors
    }
  }

  // 7. PaddleOCR readiness check
  // This should return safely even when PaddleOCR is not running.
  const isReady = await paddleOCR.waitForReady(1000);

  assert.strictEqual(typeof isReady, 'boolean');

  console.log(
    '✅ Single-Request Batch Extraction & Schema Unit Tests Passed!'
  );
}

runExtractionTests().catch((err) => {
  console.error('❌ Extraction Unit Test Failed:', err);
  process.exit(1);
});