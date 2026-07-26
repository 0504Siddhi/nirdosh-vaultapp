import path from 'path';
import sharp from 'sharp';
import fs from 'fs';
import { execFile } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';
import { config } from '../config';

export interface PreprocessResult {
  pageImages: string[];
  processedSizeBytes: number;
  cleanup: () => void;
}

const safeUnlink = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch { /* ignore cleanup errors */ }
};

function pythonCommand(): string {
  return process.platform === 'win32' ? 'python' : 'python3';
}

/**
 * Creates compact derivatives for extraction. Originals are never sent directly.
 * Images are rotated, capped to a configurable longest edge and JPEG compressed.
 * PDFs are rasterized only up to the configured page limit.
 */
export async function preprocessDocument(filePath: string, mimeType: string): Promise<PreprocessResult> {
  const tempFiles: string[] = [];
  let totalProcessedSize = 0;
  const cleanup = () => tempFiles.forEach(safeUnlink);

  try {
    if (mimeType === 'application/pdf') {
      const scriptPath = path.join(__dirname, 'pdf_rasterizer.py');
      const outputDir = path.dirname(filePath);
      const args = [
        scriptPath,
        filePath,
        outputDir,
        String(config.preprocessing.pdfMaxPages),
        String(config.preprocessing.maxEdge),
        String(config.preprocessing.jpegQuality),
      ];

      const rasterizeOutput = await new Promise<string>((resolve, reject) => {
        execFile(pythonCommand(), args, { timeout: 30_000 }, (err, stdout, stderr) => {
          if (err) {
            logger.warn('[Preprocessing] PDF rasterizer failed', { error: stderr || err.message });
            reject(err);
          } else resolve(stdout.trim());
        });
      });

      const parsed = JSON.parse(rasterizeOutput);
      if (parsed.error || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
        throw new Error(parsed.error || 'Failed to rasterize PDF pages');
      }

      for (const imgPath of parsed.pages) {
        tempFiles.push(imgPath);
        if (fs.existsSync(imgPath)) totalProcessedSize += fs.statSync(imgPath).size;
      }

      return { pageImages: tempFiles, processedSizeBytes: totalProcessedSize, cleanup };
    }

    const outPath = path.join(path.dirname(filePath), `prep_${uuidv4()}.jpg`);
    await sharp(filePath)
      .rotate()
      .resize(config.preprocessing.maxEdge, config.preprocessing.maxEdge, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: config.preprocessing.jpegQuality, mozjpeg: true })
      .toFile(outPath);

    tempFiles.push(outPath);
    totalProcessedSize = fs.statSync(outPath).size;
    return { pageImages: [outPath], processedSizeBytes: totalProcessedSize, cleanup };
  } catch (error) {
    cleanup();
    logger.error('[Preprocessing] Document preprocessing failed:', error);
    throw error;
  }
}
