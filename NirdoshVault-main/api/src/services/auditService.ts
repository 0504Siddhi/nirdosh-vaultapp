import { Request } from 'express';
import { AuditStore } from '../models/store';
import logger from './logger';

export const AuditService = {
  log: (userId: string, event: string, meta: Record<string, unknown> = {}, req?: Request) => {
    const entry = AuditStore.add({
      userId,
      event,
      meta: {
        ...meta,
        ip: req?.ip || req?.headers['x-forwarded-for'] || 'unknown',
        userAgent: req?.headers['user-agent'] || 'unknown',
      },
    });
    logger.info(`[AUDIT] ${event}`, { userId, ...meta });
    return entry;
  },
};
