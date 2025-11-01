import crypto from 'crypto';

/**
 * Encryption utilities for securing sensitive tokens in the database
 * Uses AES-256-GCM encryption which provides both confidentiality and authenticity
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derives an encryption key from the NEXTAUTH_SECRET
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not defined in environment variables');
  }

  // Derive a proper encryption key from the secret
  return crypto.pbkdf2Sync(secret, 'salt', ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypts a refresh token before storing it in the database
 * @param text - The refresh token to encrypt
 * @returns Encrypted string in format: iv:authTag:encrypted
 */
export function encryptToken(text: string): string {
  if (!text) return text;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypts a refresh token when reading from the database
 * @param encryptedText - The encrypted token in format: iv:authTag:encrypted
 * @returns Decrypted refresh token
 */
export function decryptToken(encryptedText: string): string {
  if (!encryptedText) return encryptedText;

  try {
    const parts = encryptedText.split(':');
    
    // If it doesn't have the expected format, it might be unencrypted (legacy data)
    if (parts.length !== 3) {
      console.warn('Token is not in encrypted format, returning as-is');
      return encryptedText;
    }

    const [ivHex, authTagHex, encrypted] = parts;
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Helper function to safely encrypt tokens in Account data
 */
export function encryptAccountTokens(account: any) {
  if (account.refresh_token) {
    account.refresh_token = encryptToken(account.refresh_token);
  }
  return account;
}

/**
 * Helper function to safely decrypt tokens from Account data
 */
export function decryptAccountTokens(account: any) {
  if (account.refresh_token) {
    account.refresh_token = decryptToken(account.refresh_token);
  }
  return account;
}
