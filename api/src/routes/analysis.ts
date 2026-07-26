import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { DocumentStore, AnalysisStore } from '../models/store';
import { runConsensusEngine } from '../services/consensusService';
import { buildCorrectionKit, generateGuidance } from '../services/guidanceService';
import { generateChecklist } from '../services/checklistService';
import { AuditService } from '../services/auditService';
import logger from '../services/logger';

const router = Router();

router.post('/analyze', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  
  const userDocs = DocumentStore.findByUser(req.user.id).filter(d => d.status === 'ready');
  if (userDocs.length < 2) { 
    res.status(400).json({ error: 'At least 2 processed documents are required for analysis' }); 
    return; 
  }
  
  try {
    AuditService.log(req.user.id, 'analysis.started', { documentCount: userDocs.length }, req);
    
    // 1. Run the updated Consensus Engine (Returns the new Object)
    const engineData = runConsensusEngine(userDocs);

    // 2. Create the final analysis record using the pre-computed engine data
    const analysis = AnalysisStore.create({ 
      userId: req.user.id, 
      documentIds: userDocs.map(d => d._id), 
      status: 'complete', 
      fieldResults: engineData.fieldResults, 
      summary: engineData.summary, 
      documentSpecificFields: engineData.documentSpecificFields, // Added the metadata array
      guidance: await generateGuidance(engineData.fieldResults), 
      checklist: generateChecklist(userDocs.map(d => d.docType), engineData.documentSpecificFields) 
    });
    
    AuditService.log(req.user.id, 'analysis.completed', { analysisId: analysis._id, summary: engineData.summary }, req);
    
    res.status(201).json(analysis);
  } catch (error) { 
    logger.error('Analysis failed:', { error }); 
    res.status(500).json({ error: 'Analysis failed' }); 
  }
});

router.post('/:id/correction-kit', authenticate, (req: AuthRequest, res: Response): void => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  
  const analysis = AnalysisStore.findById(req.params.id);
  if (!analysis || analysis.userId !== req.user.id) { res.status(404).json({ error: 'Analysis not found' }); return; }
  
  const { fieldKey, documentId } = req.body || {};
  const result = analysis.fieldResults.find((r: any) => r.fieldKey === fieldKey); // Look inside the nested array
  
  if (!result) { res.status(404).json({ error: 'Field result not found' }); return; }
  
  const document = documentId ? DocumentStore.findById(documentId) : undefined;
  if (document && (!analysis.documentIds.includes(document._id) || document.userId !== req.user.id)) { 
    res.status(400).json({ error: 'Selected document is not part of this analysis' }); 
    return; 
  }
  
  const kit = buildCorrectionKit(analysis._id, result, document?.docType);
  AuditService.log(req.user.id, 'correction_kit.requested', { analysisId: analysis._id, fieldKey, documentId, guideStatus: kit.guide_status }, req);
  res.json(kit);
});

router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  
  const analysis = AnalysisStore.findById(req.params.id);
  if (!analysis || analysis.userId !== req.user.id) { res.status(404).json({ error: 'Analysis not found' }); return; }
  
  res.json(analysis);
});

router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  
  res.json({ analyses: AnalysisStore.findByUser(req.user.id).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime()) });
});

export default router;