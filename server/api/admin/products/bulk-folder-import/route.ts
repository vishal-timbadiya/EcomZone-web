import { verifyAdmin } from '../../../../lib/adminAuth';
import { writeFile, mkdir, unlink, rm, rename, copyFile, statfs } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { csvStorage } from '../../../../lib/csvStorage';
import { logger } from '../../../../lib/logger';
import { extractZipStreaming } from '../../../../lib/zip';
import { Router, Request, Response, NextFunction } from 'express';
import { parse } from 'csv-parse/sync';
import multer from 'multer';

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const TMP_DIR = path.join(process.cwd(), 'tmp', 'bulk-import');

// Default 2 GB. The archive is streamed to disk and then read entry by entry,
// so this ceiling is bounded by disk space and upload time, not by RAM.
//
// Measured on the current deployment: 400 MB uploads and extracts successfully
// in about 160 s with flat memory. The practical limit is how long the client
// is willing to hold the request open, not a proxy body cap.
const MAX_ZIP_BYTES = Number(process.env.BULK_IMPORT_MAX_BYTES || 2 * 1024 * 1024 * 1024);
const MAX_UNCOMPRESSED_BYTES = Number(
  process.env.BULK_IMPORT_MAX_UNCOMPRESSED_BYTES || MAX_ZIP_BYTES * 5
);
const MAX_ZIP_ENTRIES = Number(process.env.BULK_IMPORT_MAX_ENTRIES || 20000);
const IMAGE_PATTERN = /\.(jpg|jpeg|png|gif|webp|avif)$/i;

// Refuse to start an import that would fill the disk. Needs room for the
// uploaded archive plus its extracted contents plus the final copies.
const DISK_HEADROOM_MULTIPLIER = 3;

/**
 * Disk-backed upload. memoryStorage buffered the entire archive in RAM, which
 * combined with adm-zip's own full-file buffer to OOM-kill the container
 * (512 MiB on this plan) on archives approaching 100 MB.
 */
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      mkdir(TMP_DIR, { recursive: true })
        .then(() => cb(null, TMP_DIR))
        .catch((err) => cb(err, TMP_DIR));
    },
    filename: (_req, _file, cb) => cb(null, `upload-${Date.now()}-${randomUUID()}.zip`),
  }),
  limits: { fileSize: MAX_ZIP_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.zip')) {
      cb(new Error('Please upload a ZIP file'));
      return;
    }
    cb(null, true);
  },
});

/** Free bytes on the filesystem holding the uploads directory. */
async function freeDiskBytes(): Promise<number | null> {
  try {
    const stats = await statfs(process.cwd());
    return stats.bavail * stats.bsize;
  } catch {
    return null;
  }
}

/**
 * Translate multer's errors into real status codes. Without this, exceeding the
 * size limit surfaced as a dead connection and the browser reported only
 * "Network error".
 */
function handleUpload(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: any) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      const gb = (MAX_ZIP_BYTES / (1024 * 1024 * 1024)).toFixed(2);
      return res.status(413).json({
        success: false,
        message: `ZIP is too large. The maximum accepted size is ${gb} GB.`,
      });
    }

    logger.warn({ event: 'bulk_import_upload_rejected', message: err.message });
    return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
  });
}

// Helper function to validate product data
function validateProduct(data: any, rowIndex: number): { valid: boolean; data?: any; errors?: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Product name is required');
  }

  // Make singlePrice optional - default to 0 if not provided
  const singlePrice = data.singlePrice ? parseFloat(data.singlePrice) : 0;
  if (data.singlePrice && (isNaN(singlePrice) || singlePrice < 0)) {
    errors.push('Single price must be a valid positive number');
  }

  // cartonPcsPrice comes from CSV; cartonPrice is always auto-calculated
  const cartonQtyVal = parseInt(data.cartonQty) || 1;
  const resolvedCartonPcsPrice = data.cartonPcsPrice ? parseFloat(data.cartonPcsPrice) : (singlePrice || 0);
  const resolvedCartonPrice = resolvedCartonPcsPrice * cartonQtyVal;

  if (isNaN(resolvedCartonPcsPrice) || resolvedCartonPcsPrice < 0) {
    errors.push('Carton piece price must be a valid positive number');
  }

  // Make stock optional - default to 0 if not provided
  const stock = data.stock ? parseInt(data.stock) : 0;
  if (data.stock && (isNaN(stock) || stock < 0)) {
    errors.push('Stock must be a valid non-negative number');
  }

  // Category is optional - can be empty
  const category = data.category ? data.category.trim() : '';

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: data.name.trim(),
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      description: data.description || '',
      category: category || 'Uncategorized',
      subCategory: data.subCategory || '',
      productCode: data.productCode || '',
      imageUrl: data.imageUrl || data.image1 || '',
      imageUrls: (() => {
        try {
          // Try to parse imageUrls JSON if provided
          if (data.imageUrls) {
            return JSON.parse(data.imageUrls);
          }
          // Otherwise, collect image1, image2, image3, etc. fields
          const images = [];
          for (let i = 1; i <= 7; i++) {
            const imageField = `image${i}`;
            if (data[imageField] && data[imageField].trim()) {
              images.push(data[imageField].trim());
            }
          }
          return images;
        } catch (e) {
          console.warn('Failed to parse imageUrls, collecting individual image fields');
          // Fallback to individual image fields
          const images = [];
          for (let i = 1; i <= 7; i++) {
            const imageField = `image${i}`;
            if (data[imageField] && data[imageField].trim()) {
              images.push(data[imageField].trim());
            }
          }
          return images;
        }
      })(),
      singlePrice,
      cartonPrice: resolvedCartonPrice,
      cartonPcsPrice: resolvedCartonPcsPrice,
      cartonQty: cartonQtyVal,
      stock,
      gstPercentage: parseFloat(data.gstPercentage) || 5,
      hsnCode: data.hsnCode || '',
      weight: data.weight ? parseFloat(data.weight) : 0,
      isBestseller: data.isBestseller?.toLowerCase() === 'true' || data.isBestseller === '1' || false,
      isNewArrival: data.isNewArrival?.toLowerCase() === 'true' || data.isNewArrival === '1' || false,
      isTopRanking: data.isTopRanking?.toLowerCase() === 'true' || data.isTopRanking === '1' || false,
      isActive: data.isActive?.toLowerCase() !== 'false' && data.isActive?.toLowerCase() !== '0'
    }
  };
}

router.post('/', handleUpload, async (req: Request, res: Response) => {
  let zipPath: string | undefined;
  let workDir: string | undefined;

  try {
    await verifyAdmin(req);

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    zipPath = req.file.path;
    const zipSize = req.file.size;

    // Extraction plus the final copies need several times the archive size.
    const free = await freeDiskBytes();

    if (free !== null && free < zipSize * DISK_HEADROOM_MULTIPLIER) {
      const needMb = Math.ceil((zipSize * DISK_HEADROOM_MULTIPLIER) / (1024 * 1024));
      const freeMb = Math.floor(free / (1024 * 1024));
      return res.status(507).json({
        success: false,
        message: `Not enough disk space to process this archive. Needs about ${needMb} MB free, only ${freeMb} MB available.`,
      });
    }

    workDir = path.join(TMP_DIR, `work-${Date.now()}-${randomUUID()}`);
    await mkdir(workDir, { recursive: true });
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Streamed entry by entry - memory stays flat regardless of archive size.
    const extracted = await extractZipStreaming(zipPath, workDir, {
      maxEntries: MAX_ZIP_ENTRIES,
      maxUncompressedBytes: MAX_UNCOMPRESSED_BYTES,
      allowedExtensions: IMAGE_PATTERN,
    });

    // The archive is no longer needed once extracted.
    await unlink(zipPath).catch(() => {});
    zipPath = undefined;

    logger.info({
      event: 'bulk_import_extracted',
      zipBytes: zipSize,
      entries: extracted.entriesSeen,
      images: extracted.files.length,
      uncompressedBytes: extracted.totalBytes,
    });

    // Group images by their top-level folder, which is the product code.
    const byFolder = new Map<string, string[]>();

    for (const file of extracted.files) {
      if (!byFolder.has(file.folder)) byFolder.set(file.folder, []);
      byFolder.get(file.folder)!.push(file.absolutePath);
    }

    const products: any[] = [];

    for (const [folderName, imagePaths] of [...byFolder.entries()].sort()) {
      imagePaths.sort();
      const imageUrls: string[] = [];

      for (const sourcePath of imagePaths) {
        const ext = path.extname(sourcePath).toLowerCase();
        const newFilename = `${folderName}-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
        const uploadPath = path.join(UPLOAD_DIR, newFilename);

        // Move rather than read-into-memory-and-write. rename is instant and
        // allocation-free on the same filesystem; copyFile streams if not.
        try {
          await rename(sourcePath, uploadPath);
        } catch {
          await copyFile(sourcePath, uploadPath);
        }

        imageUrls.push(`/uploads/${newFilename}`);
      }

      products.push({
        productCode: folderName,
        name: "",
        description: "",
        primaryImage: imageUrls[0] || "",
        imageUrls: imageUrls,
        totalImages: imageUrls.length,
      });
    }

    // Cleanup work directory
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
    workDir = undefined;

    if (products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No product folders with images found in the ZIP. Each product needs its own folder containing image files.",
      });
    }

    // Generate CSV with blank name and description
    const headers = [
      "productCode", "name", "description", "singlePrice", "cartonPcsPrice", "cartonQty", 
      "gstPercentage", "hsnCode", "weight", "stock", "category", "subCategory", 
      "isBestseller", "isNewArrival", "isTopRanking", "imageUrl", "imageUrls"
    ];
    
    const maxImages = products.reduce((max, p) => Math.max(max, p.imageUrls.length), 0);
    
    for (let i = 1; i <= maxImages; i++) {
      headers.push(`image${i}`);
    }
    
    const csvRows: string[] = [headers.join(",")];
    
    for (const product of products) {
      const row: string[] = [
        product.productCode,
        product.name,
        product.description,
        "",        // singlePrice (empty for user to fill)
        "",        // cartonPcsPrice (per piece, empty for user to fill)
        "",        // cartonQty
        "",        // gstPercentage
        "",        // hsnCode
        "",        // weight
        "",        // stock
        "",        // category
        "",        // subCategory
        "false",   // isBestseller
        "false",   // isNewArrival
        "false",   // isTopRanking
        product.primaryImage,     // imageUrl (first image)
        product.imageUrls.slice(1).join("|"),  // imageUrls (additional images, excluding first)
      ];
      
      // Add individual image columns
      for (let i = 0; i < maxImages; i++) {
        row.push(product.imageUrls[i] || "");
      }
      
      const escapedRow = row.map(val => {
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      
      csvRows.push(escapedRow.join(","));
      }
      
      const csvContent = csvRows.join("\n");
  
      // Generate a unique session ID for the CSV content
      const sessionId = `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
      // Store the CSV in memory (fast) and on disk (persistent across server restarts)
      const csvDir = path.join(process.cwd(), "public", "uploads", "bulk-csv");
      if (!existsSync(csvDir)) {
        await mkdir(csvDir, { recursive: true });
      }
  
      const csvFilename = `${sessionId}.csv`;
      const csvPath = path.join(csvDir, csvFilename);
  
      await writeFile(csvPath, csvContent, "utf8");
      csvStorage.set(sessionId, csvPath);
  
      // Clean up old entries (memory + disk) after 1 hour
      setTimeout(async () => {
        csvStorage.delete(sessionId);
        try {
          if (existsSync(csvPath)) {
            await unlink(csvPath);
          }
        } catch (e) {
          console.error("Error cleaning up CSV file:", e);
        }
      }, 60 * 60 * 1000);
  
      return res.json({
        success: true,
        products,
        csvSessionId: sessionId,
        csvDownloadUrl: `/api/admin/products/download-csv?sessionId=${sessionId}`,
        count: products.length,
        message: "ZIP processed successfully. Download the CSV template, fill in the details, then upload the completed CSV."
      });
  
    } catch (error: any) {
      logger.error({ event: 'bulk_import_failed', message: error?.message });

      const status = error?.status || 400;

      return res.status(status).json({
        success: false,
        message: error?.message || "Error processing ZIP file",
      });
    } finally {
      // Always reclaim disk, on success and on failure alike. Leaked archives
      // and half-extracted folders would otherwise fill the volume.
      if (zipPath) await unlink(zipPath).catch(() => {});
      if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  });

export default router;

