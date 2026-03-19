import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { writeFile, mkdir, readdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import fs from "fs";
import { csvStorage } from "@/lib/csvStorage";

// ZIP extraction using adm-zip package
async function extractZip(zipPath: string, extractDir: string): Promise<string[]> {
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractDir, true);
  
  const files: string[] = [];
  const entries = zip.getEntries();
  
  for (const entry of entries) {
    if (!entry.isDirectory) {
      files.push(entry.entryName);
    }
  }
  
  return files;
}

export async function POST(req: Request) {
  try {
    await verifyAdmin(req);

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json({ success: false, message: "Please upload a ZIP file" }, { status: 400 });
    }

    const timestamp = Date.now();
    const tempDir = path.join(process.cwd(), "public/uploads", `bulk-${timestamp}`);
    
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
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
            const imageBuffer = fs.readFileSync(imagePath);
            
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
            name: "", // Keep blank - admin will fill
            description: "",
            primaryImage: imageUrls[0] || "",
            imageUrls: imageUrls,
            totalImages: imageUrls.length,
          });
        }
      }
    }

    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error("Error cleaning up temp dir:", e);
    }

    if (products.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "No product folders with images found in ZIP file" 
      }, { status: 400 });
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
        product.name, // Blank - admin fills
        product.description, // Blank - admin fills
        "", // singlePrice
        "", // cartonPcsPrice
        "", // cartonQty
        "", // gstPercentage
        "", // hsnCode
        "", // weight
        "", // stock
        "", // category
        "basic", // subCategory
        "false", // isBestseller
        "false", // isNewArrival
        "false", // isTopRanking
        product.primaryImage,
        product.imageUrls.join("|"),
      ];
      
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

    return NextResponse.json({
      success: true,
      products,
      csvSessionId: sessionId,
      csvDownloadUrl: `/api/admin/products/download-csv?sessionId=${sessionId}`,
      count: products.length,
      message: "ZIP processed successfully. Download the CSV template, fill in the details, then upload the completed CSV."
    });

  } catch (error: any) {
    console.error("Bulk folder import error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error processing ZIP file" },
      { status: 500 }
    );
  }
}
