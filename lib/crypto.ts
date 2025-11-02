import crypto from 'crypto';

/**
 * AES-256-GCM encryption utilities using a 32-byte key from ENCRYPTION_KEY.
 * Format: iv:ciphertext:authTag (hex:hex:hex)
 * Backward-compatibility: also accepts iv:authTag:ciphertext for legacy data.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit
const TAG_LENGTH = 16; // 128-bit
const KEY_LENGTH = 32; // 256-bit

function getKeyFromEnv(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }

  // Try base64
  try {
    const b64 = Buffer.from(raw, 'base64');
    if (b64.length === KEY_LENGTH) return b64;
  } catch {}

  // Try hex
  try {
    const hex = Buffer.from(raw, 'hex');
    if (hex.length === KEY_LENGTH) return hex;
  } catch {}

  // Fallback: utf8 padded/truncated to 32 bytes (not ideal, but robust)
  const buf = Buffer.alloc(KEY_LENGTH);
  Buffer.from(raw, 'utf8').copy(buf);
  return buf;
}

export function encrypt(plain: string): string {
  if (!plain) return plain;
  try {
    const key = getKeyFromEnv();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Return iv:ciphertext:authTag (hex)
    return `${iv.toString('hex')}:${ciphertext.toString('hex')}:${tag.toString('hex')}`;
  } catch (err) {
    console.error('Encryption error:', err);
    throw new Error('Failed to encrypt value');
  }
}

export function decrypt(token: string): string {
  if (!token) return token;
  try {
    const parts = token.split(':');
    if (parts.length !== 3) {
      // Not an encrypted value (legacy/plain)
      return token;
    }

    const [p1, p2, p3] = parts;
    const iv = Buffer.from(p1, 'hex');
    // Determine which part is tag (16 bytes -> 32 hex chars)
    const isLegacyOrder = p2.length === TAG_LENGTH * 2; // iv:authTag:ciphertext
    const tagHex = isLegacyOrder ? p2 : p3;
    const ctHex = isLegacyOrder ? p3 : p2;

    const tryWithKey = (key: Buffer) => {
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(ctHex, 'hex')),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    };

    // Prefer new key
    try {
      return tryWithKey(getKeyFromEnv());
    } catch {}

    // Fallback to legacy derivation from NEXTAUTH_SECRET (for older records)
    const legacySecret = process.env.NEXTAUTH_SECRET;
    if (legacySecret) {
      const legacyKey = crypto.pbkdf2Sync(legacySecret, 'salt', 100000, KEY_LENGTH, 'sha512');
      try {
        return tryWithKey(legacyKey);
      } catch {}
    }

    throw new Error('Failed to decrypt with available keys');
  } catch (err) {
    console.error('Decryption error:', err);
    throw new Error('Failed to decrypt value');
  }
}

// Backwards-compatible helpers used elsewhere in the app
export function encryptToken(text: string): string {
  return encrypt(text);
}

export function decryptToken(encryptedText: string): string {
  return decrypt(encryptedText);
}

export function encryptAccountTokens(account: any) {
  if (account.refresh_token) account.refresh_token = encrypt(account.refresh_token);
  return account;
}

export function decryptAccountTokens(account: any) {
  if (account.refresh_token) account.refresh_token = decrypt(account.refresh_token);
  return account;
}
