import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-secret-key-change-in-production";

// Check if password looks like bcrypt hash (starts with $2a$, $2b$, or $2y$)
function isBcryptHash(password: string): boolean {
  return !!(password && password.startsWith('$2'));
}

// Check if password looks like CryptoJS encrypted (has specific format)
function isCryptoJSEncrypted(password: string): boolean {
  // CryptoJS AES encryption produces base64 strings that start with specific characters
  // and are typically longer than plain passwords
  if (!password || password.length < 20) return false;
  // Simple heuristic: if it's not bcrypt and not a short plain text
  return true;
}

// Encrypt password
export function encryptPassword(password: string): string {
  try {
    return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error("Encryption error:", error);
    return password; // Return plain password if encryption fails
  }
}

// Decrypt password - handles both CryptoJS and bcrypt (returns as-is for bcrypt)
export function decryptPassword(encryptedPassword: string): string {
  try {
    if (!encryptedPassword) return "";
    
    // If it's a bcrypt hash, return as-is (we can't decrypt bcrypt)
    if (isBcryptHash(encryptedPassword)) {
      return "[Bcrypt Hash - Cannot Display]";
    }
    
    // Try CryptoJS decryption
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    // If decryption produces empty string, maybe it was stored plain
    if (!decrypted) {
      return encryptedPassword;
    }
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    // If decryption fails, return as-is (might be plain password)
    return encryptedPassword;
  }
}
