import { Request } from 'express';
import { prisma } from './prisma';
import { extractBearerToken, verifyAuthToken, AuthTokenPayload } from '../../lib/jwt';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  permissions: Record<string, boolean>;
}

function httpError(message: string, status: number): Error & { status: number } {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}

/**
 * Verify that the request carries a valid token belonging to an active admin.
 *
 * The user is re-read from the database on every call rather than trusted from
 * the token, so revoking an admin (deactivating them or dropping their role)
 * takes effect immediately instead of when their existing token expires.
 */
export async function verifyAdmin(request: Request): Promise<AdminUser> {
  const token = extractBearerToken(request.get('authorization'));

  if (!token) {
    throw httpError('No token provided', 401);
  }

  const decoded = verifyAuthToken(token);

  if (!decoded) {
    throw httpError('Invalid or expired token', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSuperAdmin: true,
      isActive: true,
      permissions: true,
    },
  });

  if (!user || user.role !== 'ADMIN') {
    throw httpError('Not authorized', 403);
  }

  if (!user.isActive) {
    throw httpError('Account is disabled', 403);
  }

  return {
    ...user,
    permissions: (user.permissions as Record<string, boolean>) || {},
  };
}

/**
 * Verify admin access and additionally require a specific permission.
 * Super admins implicitly hold every permission.
 */
export async function verifyAdminPermission(
  request: Request,
  permission: 'manageProducts' | 'manageOrders' | 'manageUsers' | 'systemSettings'
): Promise<AdminUser> {
  const admin = await verifyAdmin(request);

  if (!admin.isSuperAdmin && !admin.permissions?.[permission]) {
    throw httpError(`Missing required permission: ${permission}`, 403);
  }

  return admin;
}

export type { AuthTokenPayload };
