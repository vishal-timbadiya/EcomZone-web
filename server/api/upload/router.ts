import { Router, Request, Response } from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import multer, { Multer } from 'multer';
import { mkdir } from 'fs/promises';

const router = Router();

// Extend Express Request type to include multer file
declare global {
  namespace Express {
    interface Request {
      file?: any;
      files?: any[];
    }
  }
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Configure multer with disk storage for proper file handling
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Ensure directory exists
      await mkdir(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    } catch (err: any) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file' });
    }

    // The file is already saved by multer diskStorage
    const filename = req.file.filename;
    // Return the relative URL - frontend will handle constructing full URL if needed
    const url = `/uploads/${filename}`;

    return res.json({ 
      url,
      filename,
      fullUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}${url}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
