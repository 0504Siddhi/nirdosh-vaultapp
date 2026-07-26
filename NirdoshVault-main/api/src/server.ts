import fs from 'fs';
import path from 'path';
import app from './app';
import { config } from './config';
import { paddleOCR } from './services/extractionService';
import logger from './services/logger';
import { purgeExpiredUserData } from './models/store';

async function cleanupStaleUploads() {
  const uploadDir = config.upload.dir;
  if (!fs.existsSync(uploadDir)) return;
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const files = fs.readdirSync(uploadDir);
  let cleaned = 0;
  for (const file of files) {
    const filePath = path.join(uploadDir, file);
    try {
      const { mtimeMs } = fs.statSync(filePath);
      if (mtimeMs < twoHoursAgo) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    } catch { /* ignore */ }
  }
  if (cleaned > 0) logger.info(`[Cleanup] Removed ${cleaned} stale upload file(s) older than 2 hours`);
}

async function startServer() {
  try {
    if (config.mongodb.uri) {
      logger.info('MongoDB connection would go here (stubbed for prototype)');
    } else {
      logger.info('Using in-memory store (MongoDB fallback)');
    }

    // Clean up any files left from a prior crashed process
    await cleanupStaleUploads();

    app.listen(config.port, () => {
      logger.info(`Nirdosh Vault API listening at http://localhost:${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);

      // Gemini is primary. On small deployments PaddleOCR loads lazily only after a Gemini failure.
      if (config.extraction.paddleWarmupOnStart) {
        logger.info('[PaddleOCR] Starting optional background warm-up...');
        paddleOCR.warmUp().then(() => {
          logger.info(paddleOCR.isReady()
            ? '[PaddleOCR] OCR fallback is ready.'
            : '[PaddleOCR] OCR fallback is unavailable; Gemini remains primary.');
        });
      } else {
        logger.info('[PaddleOCR] Lazy fallback mode enabled (no startup warm-up).');
      }
      setInterval(() => {
        const deleted = purgeExpiredUserData(config.retentionMinutes);
        if (deleted.documents || deleted.analyses) logger.info('[Cleanup] Purged expired in-memory processing data', deleted);
      }, 60_000).unref();
    });
  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
}

startServer();
