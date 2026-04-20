import { prisma } from '@/lib/prisma';
import { encryptPassword } from '@/lib/encryption';
import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
      const { name, email, mobile, password } = req.body;
  
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { mobile }],
        },
      });
  
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
  
      // Store password as encrypted (for security + admin can decrypt)
      const encryptedPassword = encryptPassword(password);
  
      const user = await prisma.user.create({
        data: {
          name,
          email,
          mobile,
          password: encryptedPassword,
        },
      });
  
      return res.json({ message: "User created", user });
    } catch (error: any) {
    console.error("Signup Error:", error);
    return res.status(500).json({ message: "Error creating user", error: error.message });
  }
  });

export default router;
