import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { mkdirSync } from 'fs';
import { verifyAdmin } from '../../lib/adminAuth';
import { logger } from '../../lib/logger';

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

const MAX_FILE_SIZE = Number(process.env.UPLOAD_MAX_BYTES || 10 * 1024 * 1024); // 10 MB

/**
 * Only image types are accepted, and the stored extension is derived from the
 * MIME type rather than the client-supplied filename. Previously any extension
 * was preserved verbatim, so an attacker could upload .html or .svg and have it
 * served as active content from the application's own origin.
 */
const ALLOWED_TYPES = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/avif', '.avif'],
]);

mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = ALLOWED_TYPES.get(file.mimetype) || '.bin';
    cb(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 10,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WebP, GIF and AVIF images may be uploaded'));
      return;
    }
    cb(null, true);
  },
});

/**
 * Require an authenticated admin before multer writes anything to disk. The
 * endpoint was previously open to anonymous callers with no size cap, which was
 * both a stored-XSS vector and a way to fill the server's disk.
 */
async function requireAdminUpload(req: Request, res: Response, next: NextFunction) {
  try {
    await verifyAdmin(req);
    next();
  } catch (error: any) {
    res.status(error?.status || 401).json({ error: error?.message || 'Unauthorized' });
  }
}

router.post('/', requireAdminUpload, (req: Request, res: Response) => {
  upload.single('file')(req, res, (uploadError: any) => {
    if (uploadError) {
      const isTooLarge = uploadError.code === 'LIMIT_FILE_SIZE';

      logger.warn({ event: 'upload_rejected', message: uploadError.message });

      return res.status(isTooLarge ? 413 : 400).json({
        error: isTooLarge
          ? `File is too large. Maximum size is ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))} MB.`
          : uploadError.message || 'Upload failed',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file' });
    }

    const filename = req.file.filename;
    const url = `/uploads/${filename}`;

    logger.info({ event: 'upload_stored', filename });

    return res.json({
      url,
      filename,
      fullUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}${url}`,
    });
  });
});

export default router;
