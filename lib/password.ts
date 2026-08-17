import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

/**
 * Password hashing and verification.
 *
 * Historically passwords were stored as reversible AES ciphertext so that the
 * admin panel could display them. That is not recoverable security: anyone with
 * a database dump and the encryption key (which defaulted to a literal string
 * committed in the source) could read every password.
 *
 * All writes now produce a bcrypt hash. Reads still accept the legacy AES format
 * so existing accounts keep working, and verifyPassword reports when a stored
 * credential needs upgrading so the caller can transparently re-hash it on the
 * next successful login.
 */

const BCRYPT_ROUNDS = 12;

/** Legacy key, only ever used to READ pre-migration credentials. */
const LEGACY_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

export function isBcryptHash(value: string): boolean {
  return typeof value === 'string' && /^\$2[aby]\$/.test(value);
}

/** Hash a password for storage. This is the only function that should write to User.password. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Decrypt a legacy AES-encrypted password. Returns null when the value cannot be
 * decrypted, rather than falling back to returning the input - the old
 * implementation returned the ciphertext on failure, which meant a malformed
 * record could be "matched" by submitting the ciphertext itself.
 */
function decryptLegacyPassword(stored: string): string | null {
  if (!LEGACY_ENCRYPTION_KEY) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(stored, LEGACY_ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch {
    return null;
  }
}

export interface VerifyResult {
  /** Whether the supplied password matches the stored credential. */
  valid: boolean;
  /**
   * True when the credential verified through the legacy AES path and should be
   * re-hashed with bcrypt by the caller.
   */
  needsRehash: boolean;
}

/**
 * Verify a plaintext password against a stored credential in either format.
 */
export async function verifyPassword(password: string, stored: string): Promise<VerifyResult> {
  if (!password || !stored) {
    return { valid: false, needsRehash: false };
  }

  if (isBcryptHash(stored)) {
    return { valid: await bcrypt.compare(password, stored), needsRehash: false };
  }

  const legacy = decryptLegacyPassword(stored);

  if (legacy === null) {
    return { valid: false, needsRehash: false };
  }

  // Length-independent comparison is unnecessary here (both values are already
  // in memory and the attacker controls one of them), but the match must be exact.
  const valid = legacy === password;

  return { valid, needsRehash: valid };
}
