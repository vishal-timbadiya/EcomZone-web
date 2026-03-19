import { NextRequest, NextResponse } from 'next/server';
import { csvStorage } from '@/lib/csvStorage';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const csvPath = csvStorage.get(sessionId);

    if (!csvPath) {
      return NextResponse.json({ error: 'CSV not found or expired' }, { status: 404 });
    }

    if (!existsSync(csvPath)) {
      csvStorage.delete(sessionId);
      return NextResponse.json({ error: 'CSV file not found' }, { status: 404 });
    }

    // Read the CSV file
    const csvContent = await readFile(csvPath, 'utf-8');

    // Return as downloadable CSV
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': 'attachment; filename="products-template.csv"',
      },
    });
  } catch (error: any) {
    console.error('CSV download error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
