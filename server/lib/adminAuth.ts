import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { Request } from "express";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function verifyAdmin(request: Request) {
  const authHeader = request.get("authorization") || request.headers.authorization as string;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error: any = new Error("No token provided");
    error.status = 401;
    throw error;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== "ADMIN") {
      const error: any = new Error("Not authorized");
      error.status = 403;
      throw error;
    }

    return user;
  } catch (error: any) {
    error.status = error.status || 401;
    throw error;
  }
}
