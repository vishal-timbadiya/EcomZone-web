import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
      const authHeader = req.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
  
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          gstNumber: true
        }
      });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      return res.json({ user });
    } catch (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

router.put('/', async (req: Request, res: Response) => {
  try {
      const authHeader = req.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
  
      const body = req.body;
      const { name, email, phone, address, gstNumber } = body;
  
      const updatedUser = await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          name,
          mobile: phone,
          gstNumber
        }
      });
  
      return res.json({ user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        gstNumber: updatedUser.gstNumber
      } });
    } catch (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

export default router;
