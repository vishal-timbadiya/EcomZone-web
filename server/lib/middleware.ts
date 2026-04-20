import { Request } from 'express';
import { verifyToken } from "@/lib/auth";

type AuthResult =
  | { user: any }
  | { error: string; status: number };

export function requireAuth(req: Request): AuthResult {
  const authHeader = req.get("authorization");

  if (!authHeader) {
    return { error: "No token provided", status: 401 };
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return { error: "Invalid token format", status: 401 };
  }

  try {
    const decoded = verifyToken(token);
    return { user: decoded };
  } catch {
    return { error: "Invalid or expired token", status: 401 };
  }
}

export function requireAdmin(req: Request): AuthResult {
  const result = requireAuth(req);

  if ("error" in result) return result;

  if (result.user.role !== "ADMIN") {
    return { error: "Admin access required", status: 403 };
  }

  return result;
}