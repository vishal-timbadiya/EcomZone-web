import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * Centralised JWT signing and verification.
 *
 * Every call site previously read process.env.JWT_SECRET! independently, which
 * meant a missing or default secret produced a runtime crash deep inside a
 * request instead of a startup failure - and there was no single place to change
 * the token lifetime.
 */

/** Secrets that must never be accepted, because they have appeared in the repo or docs. */
const KNOWN_WEAK_SECRETS = new Set([
  'super-secret',
  'supersecret',
  'secret',
  'changeme',
  'your-secret-key',
  'your-secret-key-change-in-production',
  'super-secret-key-change-in-production',
]);

function readSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }

  if (secret.length < 32 || KNOWN_WEAK_SECRETS.has(secret.toLowerCase())) {
    throw new Error(
      'JWT_SECRET is too weak. It must be at least 32 characters of random data and must not be a placeholder value.'
    );
  }

  return secret;
}

/**
 * Validate configuration at startup so a bad secret fails the boot rather than
 * every individual login.
 */
export function assertJwtConfigured(): void {
  readSecret();
}

export interface AuthTokenPayload {
  userId: string;
  role: string;
  isSuperAdmin: boolean;
  permissions: Record<string, boolean>;
}

/**
 * Token lifetime. The previous 15 minute expiry had no accompanying refresh
 * endpoint, so users were hard logged out mid-session with no way to renew.
 */
const TOKEN_TTL: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '7d';

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, readSecret(), { expiresIn: TOKEN_TTL });
}

/**
 * Verify a token. Returns null for any invalid, expired or malformed token
 * rather than throwing, so callers can treat it as a simple auth check.
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, readSecret());

    if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
      return null;
    }

    const { userId, role, isSuperAdmin, permissions } = decoded as Record<string, unknown>;

    if (typeof userId !== 'string' || !userId) return null;

    return {
      userId,
      role: typeof role === 'string' ? role : 'USER',
      isSuperAdmin: isSuperAdmin === true,
      permissions:
        permissions && typeof permissions === 'object'
          ? (permissions as Record<string, boolean>)
          : {},
    };
  } catch {
    return null;
  }
}

/** Extract a bearer token from an Authorization header value. */
export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}
