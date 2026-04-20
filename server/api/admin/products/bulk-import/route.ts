import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';

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

// Setup multer for file uploads - configure to handle both file and form fields
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max file size
});

// Multer error handler middleware
const handleMulterError = (err: any, req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err.message);
    return res.status(400).json({ 
      error: `File upload error: ${err.message}`,
      code: err.code 
    });
  } else if (err) {
    console.error('Upload middleware error:', err.message);
    return res.status(error.status || 500).json({ 
      error: 'File upload failed',
      message: err.message 
    });
  }
  next();
};

// Helper functions
function parseCSV(buffer: Buffer): any[] {
  try {
    console.log('parseCSV: Starting to parse buffer, size:', buffer.length);
    const csvString = buffer.toString('utf-8');
    console.log('parseCSV: Buffer converted to string, length:', csvString.length);
    console.log('parseCSV: First 200 chars:', csvString.substring(0, 200));
    
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log('parseCSV: Successfully parsed, records:', records.length);
    return records;
  } catch (error: any) {
    console.error('parseCSV: Error parsing CSV:',  error.message);
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
}

function validateProduct(product: any, rowIndex: number): { valid: boolean; data?: any; errors?: string[] } {
  const errors: string[] = [];

  if (!product.name || product.name.trim().length === 0) {
    errors.push('Product name is required');
  }

  // Make singlePrice optional - default to 0 if not provided
  const singlePrice = product.singlePrice ? parseFloat(product.singlePrice) : 0;
  if (product.singlePrice && (isNaN(singlePrice) || singlePrice < 0)) {
    errors.push('Single price must be a valid positive number');
  }

  // cartonPcsPrice comes from CSV; cartonPrice is always auto-calculated
  const cartonQtyVal = parseInt(product.cartonQty) || 1;
  const resolvedCartonPcsPrice = product.cartonPcsPrice ? parseFloat(product.cartonPcsPrice) : (singlePrice || 0);
  const resolvedCartonPrice = resolvedCartonPcsPrice * cartonQtyVal;

  if (isNaN(resolvedCartonPcsPrice) || resolvedCartonPcsPrice < 0) {
    errors.push('Carton piece price must be a valid positive number');
  }

  // Make stock optional - default to 0 if not provided
  const stock = product.stock ? parseInt(product.stock) : 0;
  if (product.stock && (isNaN(stock) || stock < 0)) {
    errors.push('Stock must be a valid non-negative number');
  }

  // Category is optional - can be empty
  const category = product.category ? product.category.trim() : '';

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: product.name.trim(),
      slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
      description: product.description || '',
      category: category || 'Uncategorized',
      subCategory: product.subCategory || '',
      productCode: product.productCode || '',
      imageUrl: product.imageUrl || product.image1 || '',
      imageUrls: (() => {
        try {
          // Try to parse imageUrls JSON if provided
          if (product.imageUrls) {
            return JSON.parse(product.imageUrls);
          }
          // Otherwise, collect image1, image2, image3, etc. fields
          const images = [];
          for (let i = 1; i <= 7; i++) {
            const imageField = `image${i}`;
            if (product[imageField] && product[imageField].trim()) {
              images.push(product[imageField].trim());
            }
          }
          return images;
        } catch (e) {
          console.warn('Failed to parse imageUrls, collecting individual image fields');
          // Fallback to individual image fields
          const images = [];
          for (let i = 1; i <= 7; i++) {
            const imageField = `image${i}`;
            if (product[imageField] && product[imageField].trim()) {
              images.push(product[imageField].trim());
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
      gstPercentage: parseFloat(product.gstPercentage) || 5,
      hsnCode: product.hsnCode || '',
      weight: product.weight ? parseFloat(product.weight) : 0,
      isBestseller: product.isBestseller?.toLowerCase() === 'true' || product.isBestseller === '1' || false,
      isNewArrival: product.isNewArrival?.toLowerCase() === 'true' || product.isNewArrival === '1' || false,
      isTopRanking: product.isTopRanking?.toLowerCase() === 'true' || product.isTopRanking === '1' || false,
      isActive: product.isActive?.toLowerCase() !== 'false' && product.isActive?.toLowerCase() !== '0'
    }
  };
}

router.post('/', upload.single('file'), handleMulterError, async (req: Request, res: Response) => {
  try {
    console.log('=== BULK IMPORT ROUTE START ===');
    
    await verifyAdmin(req);
    console.log('✓ Admin verified');

    // Check if file exists in request
    if (!req.file) {
      console.error('❌ No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    console.log('✓ File received:', { name: file.originalname, size: file.size });
    
    // Get file type from multiple sources (form field, query, or file extension)
    let fileType = req.body?.type || (req.query?.type as string) || '';
    
    console.log('File type detection:', { fromBody: req.body?.type, fromQuery: req.query?.type });
    
    // If type not provided, infer from file extension
    if (!fileType) {
      if (file.originalname?.toLowerCase().endsWith('.csv')) {
        fileType = 'csv';
      } else if (file.originalname?.toLowerCase().endsWith('.zip')) {
        fileType = 'zip';
      }
    }

    console.log('✓ Final file type:', fileType);

    if (!fileType) {
      console.error('❌ No file type');
      return res.status(400).json({ error: 'No file type provided and cannot infer from filename' });
    }

    const buffer = file.buffer;
    let products: any[] = [];

    if (fileType === 'csv') {
      console.log('→ Parsing CSV...');
      products = parseCSV(buffer);
      console.log('✓ CSV parsing complete');
    } else {
      console.error('❌ Invalid file type:', fileType);
      return res.status(400).json({ error: 'Only CSV files are supported in bulk-import. Use bulk-folder-import for ZIP files.' });
    }

    console.log('→ Validating products...');
    // Validate & transform
    const validatedProducts = products
      .map((p, index) => validateProduct(p, index + 2))
      .filter(p => p.valid);

    // Collect detailed error info
    const detailedIssues = products
      .map((p, index) => {
        const validated = validateProduct(p, index + 2);
        if (!validated.valid) {
          return {
            row: index + 2,
            productName: p.name || '(No name)',
            errors: validated.errors || []
          };
        }
        return null;
      })
      .filter(Boolean);

    console.log('✓ Validation complete:', { valid: validatedProducts.length, invalid: detailedIssues.length });

    if (validatedProducts.length === 0) {
      console.log('⚠ No valid products found');
      return res.status(400).json({
        error: 'No valid products found. Please check your CSV format and required fields.',
        details: detailedIssues.length > 0 ? detailedIssues.slice(0, 10) : 'No details available',
        totalRows: products.length,
        validRows: 0,
        issues: detailedIssues
      });
    }

    console.log('✓ Returning preview with', validatedProducts.length, 'valid products');

    const response = {
      products: validatedProducts.map((p: any) => p.data),
      summary: {
        total: validatedProducts.length,
        skipped: products.length - validatedProducts.length
      }
    };
    
    console.log('=== BULK IMPORT ROUTE SUCCESS ===');
    return res.json(response);

  } catch (error: any) {
    console.error('=== BULK IMPORT ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(error.status || 500).json({ 
      error: error.message || 'Bulk import failed',
      type: error.constructor.name,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
