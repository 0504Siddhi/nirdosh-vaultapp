import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

// ─── Environment Schema ───────────────────────────────────────────
const EnvSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  JWT_SECRET: z.string().default('dev-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  MONGODB_URI: z.string().optional(),
  HMAC_PEPPER: z.string().default('dev-pepper-change-in-production'),
  MASTER_KEY: z.string().default('dev-master-key-change-in-production'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MAX_FILE_SIZE_MB: z.string().default('10'),
  MAX_FILES_PER_REQUEST: z.string().default('5'),
  LOG_LEVEL: z.string().default('info'),
  RETENTION_MINUTES: z.string().default('30'),
  GEMINI_TIMEOUT_MS: z.string().default('45000'),
  EXTRACTION_CACHE_TTL_MINUTES: z.string().default('30'),
  EXTRACTION_CACHE_MAX_ITEMS: z.string().default('100'),
  PREPROCESS_MAX_EDGE: z.string().default('1500'),
  PREPROCESS_JPEG_QUALITY: z.string().default('78'),
  PDF_MAX_PAGES: z.string().default('3'),
  PADDLE_WARMUP_ON_START: z.enum(['true', 'false']).default('false'),
});

// Validate and warn on startup
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[CONFIG] ❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  port: parseInt(env.PORT, 10),
  nodeEnv: env.NODE_ENV,

  gemini: {
    apiKey: env.GEMINI_API_KEY || '',
    model: env.GEMINI_MODEL,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },

  mongodb: {
    uri: env.MONGODB_URI || '',
  },

  security: {
    hmacPepper: env.HMAC_PEPPER,
    masterKey: env.MASTER_KEY,
  },

  cors: {
    origin: env.CORS_ORIGIN,
  },

  upload: {
    maxFileSizeMb: parseInt(env.MAX_FILE_SIZE_MB, 10),
    maxFiles: parseInt(env.MAX_FILES_PER_REQUEST, 10),
    dir: 'uploads',
  },

  logging: {
    level: env.LOG_LEVEL,
  },
  retentionMinutes: parseInt(env.RETENTION_MINUTES, 10),
  extraction: {
    geminiTimeoutMs: parseInt(env.GEMINI_TIMEOUT_MS, 10),
    cacheTtlMinutes: parseInt(env.EXTRACTION_CACHE_TTL_MINUTES, 10),
    cacheMaxItems: parseInt(env.EXTRACTION_CACHE_MAX_ITEMS, 10),
    paddleWarmupOnStart: env.PADDLE_WARMUP_ON_START === 'true',
  },
  preprocessing: {
    maxEdge: parseInt(env.PREPROCESS_MAX_EDGE, 10),
    jpegQuality: parseInt(env.PREPROCESS_JPEG_QUALITY, 10),
    pdfMaxPages: parseInt(env.PDF_MAX_PAGES, 10),
  },
} as const;

// ─── Production Warnings ──────────────────────────────────────────
if (config.nodeEnv === 'production') {
  if (!config.gemini.apiKey) console.warn('[CONFIG] ⚠️  GEMINI_API_KEY is not set — extraction will rely on PaddleOCR');
  if (!config.mongodb.uri) console.warn('[CONFIG] ⚠️  MONGODB_URI is not set — using in-memory store (data will not persist)');
  if (config.jwt.secret === 'dev-secret-change-in-production') console.warn('[CONFIG] ⚠️  JWT_SECRET is using the default dev value — this is insecure in production!');
  if (config.security.masterKey === 'dev-master-key-change-in-production') console.warn('[CONFIG] ⚠️  MASTER_KEY is using the default dev value');
}
