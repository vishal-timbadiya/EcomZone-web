import os from 'os';
import path from 'path';
import { statfs, readdir, stat } from 'fs/promises';
import { Router, Request, Response } from 'express';
import { verifyAdmin } from '../../../lib/adminAuth';

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function mb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}

/** Total bytes held in the uploads directory, one level deep. */
async function uploadsUsage(): Promise<{ files: number; bytes: number }> {
  let files = 0;
  let bytes = 0;

  try {
    const entries = await readdir(UPLOAD_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      try {
        const info = await stat(path.join(UPLOAD_DIR, entry.name));
        files++;
        bytes += info.size;
      } catch {
        // A file removed mid-scan is not an error worth failing the report for.
      }
    }
  } catch {
    // Directory may not exist yet on a fresh container.
  }

  return { files, bytes };
}

/**
 * Operational report: how much disk and memory the container actually has.
 *
 * Bulk import is bounded by these numbers, so having them visible turns
 * "it failed" into an answerable question.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    await verifyAdmin(req);

    let disk: Record<string, number | string> = { error: 'unavailable' };

    try {
      const fs = await statfs(process.cwd());
      const totalBytes = fs.blocks * fs.bsize;
      const freeBytes = fs.bavail * fs.bsize;

      disk = {
        totalMB: mb(totalBytes),
        freeMB: mb(freeBytes),
        usedMB: mb(totalBytes - freeBytes),
        usedPercent: totalBytes > 0 ? Math.round(((totalBytes - freeBytes) / totalBytes) * 100) : 0,
      };
    } catch {
      // statfs is unavailable on some platforms; leave the error marker.
    }

    const uploads = await uploadsUsage();
    const mem = process.memoryUsage();

    const maxZipBytes = Number(process.env.BULK_IMPORT_MAX_BYTES || 2 * 1024 * 1024 * 1024);

    return res.json({
      disk,
      uploads: {
        path: '/uploads',
        files: uploads.files,
        totalMB: mb(uploads.bytes),
        persistent: Boolean(process.env.RENDER_DISK_MOUNTED === 'true'),
        note: 'Without a mounted persistent disk these files are lost on every deploy or restart.',
      },
      memory: {
        rssMB: mb(mem.rss),
        heapUsedMB: mb(mem.heapUsed),
        heapTotalMB: mb(mem.heapTotal),
        systemTotalMB: mb(os.totalmem()),
        systemFreeMB: mb(os.freemem()),
      },
      bulkImport: {
        maxZipMB: mb(maxZipBytes),
        maxEntries: Number(process.env.BULK_IMPORT_MAX_ENTRIES || 20000),
        note: 'A reverse proxy in front of this app may enforce a lower limit. Render fronts services with Cloudflare, which rejects bodies over roughly 100 MB before they reach the app.',
      },
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
    });
  } catch (error: any) {
    return res
      .status(error?.status || 500)
      .json({ message: error?.status ? error.message : 'Error reading system info' });
  }
});

export default router;
