import { Request } from 'express';
import { extractBearerToken, verifyAuthToken, AuthTokenPayload } from '../../lib/jwt';

type AuthResult =
  | { user: AuthTokenPayload }
  | { error: string; status: number };

export function requireAuth(req: Request): AuthResult {
  const token = extractBearerToken(req.get('authorization'));

  if (!token) {
    return { error: 'No token provided', status: 401 };
  }

  const user = verifyAuthToken(token);

  if (!user) {
    return { error: 'Invalid or expired token', status: 401 };
  }

  return { user };
}

export function requireAdmin(req: Request): AuthResult {
  const result = requireAuth(req);

  if ('error' in result) return result;

  if (result.user.role !== 'ADMIN') {
    return { error: 'Admin access required', status: 403 };
  }

  return result;
}
