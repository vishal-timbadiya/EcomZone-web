import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { verifyAdmin } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'No file type provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let products: any[] = [];

    if (type === 'csv') {
      products = parseCSV(buffer);
    } else if (type === 'zip') {
      products = await parseZip(buffer);
    } else {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate & transform
    const validatedProducts = products.map((p, index) => validateProduct(p, index + 2)).filter(p => p.valid);

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

    if (validatedProducts.length === 0) {
      console.log('Validation issues:', detailedIssues);
      return NextResponse.json({
        error: 'No valid products found. Please check your CSV format and required fields.',
        details: detailedIssues.length > 0 ? detailedIssues.slice(0, 10) : 'No details available',
        totalRows: products.length,
        validRows: 0,
        issues: detailedIssues
      }, { status: 400 });
    }

    return NextResponse.json({
      products: validatedProducts.map(p => p.data),
      summary: {
        total: validatedProducts.length,
        skipped: products.length - validatedProducts.length
      }
    });

  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function parseCSV(buffer: Buffer): any[] {
  const csvData = buffer.toString('utf-8');
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
}

async function parseZip(buffer: Buffer): Promise<any[]> {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const products: any[] = [];

  for (const entry of entries) {
    if (entry.entryName.endsWith('.csv')) {
      const csvBuffer = entry.getData();
      const csvRecords = parseCSV(csvBuffer);
      products.push(...csvRecords);
    }
  }

  return products;
}

function validateProduct(row: any, rowNum: number): { valid: boolean; data: any; errors?: string[] } {
  const errors: string[] = [];
  const data: any = {};

  // Normalize row keys to handle different formats
  const normalizedRow: any = {};
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = String(key).trim().toLowerCase();
    normalizedRow[normalizedKey] = value;
  }

  // Required fields - Name
  const name = String(normalizedRow['name'] || normalizedRow['product name'] || '').trim();
  if (!name) {
    errors.push('Name is required');
  }
  data.name = name;

  // Required fields - Single Price
  let singlePrice = parseFloat(normalizedRow['singleprice'] || normalizedRow['price'] || '0');
  if (!normalizedRow['singleprice'] && !normalizedRow['price']) {
    errors.push('Single price is required (use column "singlePrice" or "price")');
  }
  if (isNaN(singlePrice) || singlePrice <= 0) {
    if (normalizedRow['singleprice'] || normalizedRow['price']) {
      errors.push(`Valid single price required (you entered: "${normalizedRow['singleprice'] || normalizedRow['price']}")`);
    }
  }
  data.singlePrice = singlePrice > 0 ? singlePrice : 0;

  // Product Code (optional, auto-generate if missing)
  data.productCode = String(normalizedRow['productcode'] || randomUUID().slice(0, 8)).trim();

  // Description (optional)
  data.description = String(normalizedRow['description'] || `${data.name} - Wholesale product`).trim();

  // Category (optional)
  data.category = String(normalizedRow['category'] || 'general').trim();
  data.subCategory = String(normalizedRow['subcategory'] || 'basic').trim();

  // Carton Qty
  const cartonQty = parseInt(normalizedRow['cartonqty'] || normalizedRow['ctnqty'] || '1');
  data.cartonQty = isNaN(cartonQty) || cartonQty <= 0 ? 1 : cartonQty;

  // Carton Price
  const cartonPcsPrice = parseFloat(normalizedRow['cartonpcsprice'] || normalizedRow['cartonprice'] || '0') / data.cartonQty;
  data.cartonPcsPrice = isNaN(cartonPcsPrice) ? 0 : cartonPcsPrice;
  data.cartonPrice = data.cartonPcsPrice * data.cartonQty;

  // GST Percentage
  const gstPercentage = parseFloat(normalizedRow['gstpercentage'] || normalizedRow['gst'] || '18');
  data.gstPercentage = isNaN(gstPercentage) ? 18 : Math.max(0, Math.min(40, gstPercentage));

  // HSN Code (optional)
  data.hsnCode = String(normalizedRow['hsncode'] || '').trim();
  if (data.hsnCode && ![4, 6, 8].includes(data.hsnCode.length)) {
    errors.push('HSN code must be 4, 6, or 8 digits');
  }

  // Weight (optional)
  const weight = parseFloat(normalizedRow['weight'] || '0.1');
  data.weight = isNaN(weight) || weight <= 0 ? 0.1 : weight;

  // Stock (optional)
  const stock = parseInt(normalizedRow['stock'] || '100');
  data.stock = isNaN(stock) || stock < 0 ? 100 : stock;

  // Flags (default false)
  data.isBestseller = !!(normalizedRow['isbestseller'] || normalizedRow['bestseller']);
  data.isNewArrival = !!(normalizedRow['isnewarrival'] || normalizedRow['new']);
  data.isTopRanking = !!(normalizedRow['istopranking'] || normalizedRow['top-ranking']);
  data.isActive = normalizedRow['isactive'] !== 'false' && normalizedRow['isactive'] !== '0';

  // Slug & images
  data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  data.imageUrl = String(normalizedRow['imageurl'] || '').trim();

  // Parse image URLs (handle pipe-separated or comma-separated)
  const imageUrlsStr = String(normalizedRow['imageurls'] || '').trim();
  if (imageUrlsStr) {
    const separator = imageUrlsStr.includes('|') ? '|' : ',';
    data.imageUrls = imageUrlsStr.split(separator).map((u: string) => u.trim()).filter(Boolean);
  } else {
    data.imageUrls = [];
  }

  const valid = errors.length === 0;
  return { valid, data, errors: errors.length ? errors : undefined };
}

