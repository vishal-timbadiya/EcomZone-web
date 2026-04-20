import { csvStorage } from '@/lib/csvStorage';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
      const sessionId = req.query.sessionId as string;
  
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }
  
      const csvPath = csvStorage.get(sessionId);
  
      if (!csvPath) {
        return res.status(404).json({ error: 'CSV not found or expired' });
      }
  
      if (!existsSync(csvPath)) {
        csvStorage.delete(sessionId);
        return res.status(404).json({ error: 'CSV file not found' });
      }
  
      // Read the CSV file
      const csvContent = await readFile(csvPath, 'utf-8');
  
      // Return as downloadable CSV
      res.set({
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': 'attachment; filename="products-template.csv"',
      });
      return res.send(csvContent);
    } catch (error: any) {
      console.error('CSV download error:', error);
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

export default router;
