import { verifyAdmin } from '@/lib/adminAuth';
import { writeFile, mkdir, readdir, unlink, readFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { csvStorage } from '@/lib/csvStorage';
import { Router, Request, Response } from 'express';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import multer from 'multer';

const router = Router();

// Setup multer for file uploads
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const upload = multer({ 
  storage: multer.memoryStorage()  // Store file in memory for processing
});

// Helper function to extract ZIP
async function extractZip(zipPath: string, targetDir: string): Promise<void> {
  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(targetDir, true);
  } catch (error: any) {
    throw new Error(`ZIP extraction failed: ${error.message}`);
  }
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

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    await verifyAdmin(req);

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const file = req.file;
    
    if (!file.originalname.toLowerCase().endsWith(".zip")) {
      return res.status(400).json({ success: false, message: "Please upload a ZIP file" });
    }

    const timestamp = Date.now();
    const tempDir = path.join(process.cwd(), "public/uploads", `bulk-${timestamp}`);
    
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    const buffer = file.buffer;
    const zipPath = path.join(tempDir, "upload.zip");
    await writeFile(zipPath, buffer);
    
    await extractZip(zipPath, tempDir);
    await unlink(zipPath);

    const folders = await readdir(tempDir, { withFileTypes: true });
    const products: any[] = [];
    
    for (const folder of folders) {
      if (folder.isDirectory()) {
        const folderName = folder.name;
        const folderPath = path.join(tempDir, folderName);
        
        const files = await readdir(folderPath);
        const imageFiles = files
          .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
          .sort();
          
        if (imageFiles.length > 0) {
          const imageUrls: string[] = [];
          
          for (const imageFile of imageFiles) {
            const imagePath = path.join(folderPath, imageFile);
            const imageBuffer = await readFile(imagePath);
            
            const ext = path.extname(imageFile);
            const newFilename = `${folderName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
            const uploadDir = path.join(process.cwd(), "public/uploads");
            const uploadPath = path.join(uploadDir, newFilename);
            
            await writeFile(uploadPath, imageBuffer);
            
            const imageUrl = `/uploads/${newFilename}`;
            imageUrls.push(imageUrl);
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
      }
    }

    // Cleanup temp directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error("Error cleaning up temp dir:", e);
    }

    if (products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No product folders with images found in ZIP file" 
      });
    }

    // Generate CSV with blank name and description
    const headers = [
      "productCode", "name", "description", "singlePrice", "cartonPcsPrice", "cartonQty", 
      "gstPercentage", "hsnCode", "weight", "stock", "category", "subCategory", 
      "isBestseller", "isNewArrival", "isTopRanking", "imageUrl", "imageUrls"
    ];
    
    const maxImages = Math.max(...products.map(p => p.imageUrls.length));
    
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
      console.error("Bulk folder import error:", error);
      return res.status(error.status || 500).json({ success: false, message: error.message || "Error processing ZIP file" });
    }
  });

export default router;
