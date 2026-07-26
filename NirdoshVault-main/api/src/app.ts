import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import analysisRoutes from './routes/analysis';
import samplesRoutes from './routes/samples';
import centresRoutes from './routes/centres';
import { paddleOCR } from './services/extractionService';
import logger from './services/logger';

const app = express();
if (config.nodeEnv === 'production') app.set('trust proxy', 1);

// ─── Security Headers ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ─────────────────────────────────────────────────────────
app.use(cors({ origin: config.cors.origin }));

// ─── Body Parsers ─────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── HTTP Request Logging ─────────────────────────────────────────
app.use(morgan('[:date[iso]] :method :url :status :res[content-length] - :response-time ms', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─── Rate Limiters ────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached. You can upload up to 20 documents per hour.' },
});

const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Analysis limit reached. You can run up to 10 analyses per hour.' },
});


// ─── Static Uploads ───────────────────────────────────────────────
app.use('/uploads', express.static(config.upload.dir));

// ─── Healthcheck ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: config.nodeEnv });
});

// ─── System Status (OCR readiness) ───────────────────────────────
app.get('/api/v1/status', (req, res) => {
  res.json({
    geminiConfigured: Boolean(config.gemini.apiKey),
    ocrFallbackReady: paddleOCR.isReady(),
    ocrFallbackMode: config.extraction.paddleWarmupOnStart ? 'warm' : 'lazy',
    environment: config.nodeEnv,
  });
});

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/documents', uploadLimiter, documentRoutes);
app.use('/api/v1/analysis', analysisLimiter, analysisRoutes);
app.use('/api/v1/samples', samplesRoutes);
app.use('/api/v1/centres', centresRoutes);

// ─── Error Handler ────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`${err.message}`, { stack: err.stack, path: req.path });
  if (err.message && (err.message.startsWith('Invalid file type') || err.message.includes('accepted'))) {
    res.status(400).json({ error: err.message });
  } else if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'File too large. Maximum file size is 10 MB.' });
  } else {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export { uploadLimiter, analysisLimiter };
export default app;
