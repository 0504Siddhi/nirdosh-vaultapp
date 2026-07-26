import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

// Add 'http' level between 'info' and 'verbose'
const levels = { error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6 };

const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'http',
  format: combine(
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? prodFormat : combine(colorize(), devFormat)
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5 MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 10,
          }),
        ]
      : []),
  ],
});

export interface ExtractionMetrics {
  docId: string;
  docType?: string;
  status: 'ready' | 'failed';
  inputSizeBytes: number;
  processedSizeBytes?: number;
  timings: {
    preprocessMs?: number;
    geminiMs?: number;
    validationMs?: number;
    paddleMs?: number;
    normalizationMs?: number;
    totalMs?: number;
  };
  fallbackReason?: string | null;
  timeoutCount?: number;
  fieldCount?: number;
}

export function logExtractionMetrics(metrics: ExtractionMetrics): void {
  logger.info('[Extraction Metrics]', {
    docId: metrics.docId,
    docType: metrics.docType ?? 'unknown',
    status: metrics.status,
    inputSizeBytes: metrics.inputSizeBytes,
    processedSizeBytes: metrics.processedSizeBytes ?? 0,
    preprocessMs: metrics.timings.preprocessMs ?? 0,
    geminiMs: metrics.timings.geminiMs ?? 0,
    validationMs: metrics.timings.validationMs ?? 0,
    paddleMs: metrics.timings.paddleMs ?? 0,
    normalizationMs: metrics.timings.normalizationMs ?? 0,
    totalMs: metrics.timings.totalMs ?? 0,
    fallbackReason: metrics.fallbackReason ?? null,
    timeoutCount: metrics.timeoutCount ?? 0,
    fieldCount: metrics.fieldCount ?? 0,
  });
}

export default logger;
