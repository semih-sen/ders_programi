# 🔐 Token Security & Encryption Guide

This document explains the security implementation for storing OAuth refresh tokens in your Next.js application.

## Why Encrypt Refresh Tokens?

### The Problem
OAuth refresh tokens are highly sensitive credentials that:
- **Never expire** (in most cases)
- Can be used to **generate new access tokens indefinitely**
- Provide **full access** to a user's account
- Are **as powerful as the user's password**

If an attacker gains access to your database and refresh tokens are stored in plain text, they can:
- Access all user data
- Impersonate users indefinitely
- Make API calls on behalf of users
- Even if you rotate database passwords, the tokens remain valid

### The Solution
We implement **AES-256-GCM encryption** to protect refresh tokens:
- Tokens are encrypted **before** being stored in the database
- Tokens are decrypted **only when needed** (e.g., to pass to n8n)
- Even if the database is compromised, tokens are useless without the encryption key

## How It Works

### 1. Encryption Algorithm
We use **AES-256-GCM** (Galois/Counter Mode) which provides:
- **Confidentiality**: Data is encrypted
- **Authenticity**: Data hasn't been tampered with
- **Industry standard**: Used by TLS, VPNs, etc.

### 2. Key Derivation
The encryption key is derived from `NEXTAUTH_SECRET` using **PBKDF2**:
```typescript
crypto.pbkdf2Sync(secret, 'salt', 100000, 32, 'sha512')
```

This means:
- Your `NEXTAUTH_SECRET` must remain constant
- If you change the secret, old tokens cannot be decrypted
- The secret should be at least 32 characters

### 3. Encryption Process

When a user signs in with Google:

```
1. Google sends: access_token + refresh_token
2. NextAuth signIn callback intercepts
3. Tokens are encrypted using encryptToken()
4. Encrypted tokens saved to database
5. User session created
```

### 4. Decryption Process

When you need to use the token (e.g., for n8n):

```
1. Query database for user's Account
2. Retrieve encrypted refresh_token
3. Decrypt using decryptToken()
4. Use token for API calls
5. Never store decrypted token
```

## File Structure

### `/lib/crypto.ts`
Core encryption/decryption functions:
- `encryptToken(text)` - Encrypts a string
- `decryptToken(encryptedText)` - Decrypts a string
- `encryptAccountTokens(account)` - Helper for Account objects
- `decryptAccountTokens(account)` - Helper for Account objects

### `/lib/get-refresh-token.ts`
Secure token retrieval:
- `getRefreshToken(userId, provider)` - Get decrypted refresh token
- `getUserTokens(userId, provider)` - Get all tokens for a user

### `/app/api/auth/[...nextauth]/route.ts`
NextAuth configuration with encryption:
- `signIn` callback - Encrypts tokens before database save
- `jwt` callback - Manages token in session
- `session` callback - Adds token to session object

## Usage Examples

### Example 1: Get Refresh Token for n8n Workflow

```typescript
import { getRefreshToken } from '@/lib/get-refresh-token';

async function triggerN8nWorkflow(userId: string) {
  // Securely retrieve and decrypt the refresh token
  const refreshToken = await getRefreshToken(userId, 'google');
  
  if (!refreshToken) {
    throw new Error('No refresh token found');
  }

  // Send to n8n workflow
  const response = await fetch('https://your-n8n.com/webhook/workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      refreshToken, // Decrypted, ready to use
    }),
  });

  return response.json();
}
```

### Example 2: Refresh an Access Token

```typescript
import { getUserTokens } from '@/lib/get-refresh-token';

async function refreshAccessToken(userId: string) {
  const tokens = await getUserTokens(userId, 'google');
  
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token available');
  }

  // Use the refresh token to get a new access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const newTokens = await response.json();
  
  // newTokens.access_token is your fresh access token
  return newTokens;
}
```

### Example 3: API Route with Token

```typescript
// app/api/google/calendar/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserTokens } from '@/lib/get-refresh-token';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get decrypted tokens
  const tokens = await getUserTokens(session.user.id);
  
  if (!tokens?.accessToken) {
    return new Response('No access token', { status: 400 });
  }

  // Use access token to call Google Calendar API
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    }
  );

  const events = await response.json();
  return Response.json(events);
}
```

## Security Best Practices

### ✅ DO's

1. **Keep NEXTAUTH_SECRET secure**
   - Store in environment variables only
   - Never commit to version control
   - Use different secrets for dev/staging/prod
   - Rotate periodically (with migration plan)

2. **Minimize token exposure**
   - Only decrypt when absolutely necessary
   - Never log decrypted tokens
   - Don't include in client-side code
   - Use secure HTTPS connections

3. **Audit token usage**
   ```typescript
   // Log when tokens are accessed
   console.log(`Token accessed by user ${userId} at ${new Date()}`);
   ```

4. **Implement rate limiting**
   - Limit token retrieval requests
   - Prevent brute force attacks
   - Monitor suspicious patterns

5. **Use database encryption at rest**
   - Enable PostgreSQL encryption
   - Use encrypted backups
   - Consider AWS RDS encryption, etc.

### ❌ DON'Ts

1. **Never return decrypted tokens to client**
   ```typescript
   // ❌ BAD
   return { refreshToken: decryptedToken };
   
   // ✅ GOOD
   return { hasRefreshToken: !!decryptedToken };
   ```

2. **Don't store decrypted tokens**
   ```typescript
   // ❌ BAD
   const token = decryptToken(encrypted);
   await redis.set('token', token);
   
   // ✅ GOOD
   const token = decryptToken(encrypted);
   // Use immediately, don't store
   await useToken(token);
   ```

3. **Don't skip encryption**
   ```typescript
   // ❌ BAD
   account.refresh_token = plainToken; // Stored unencrypted!
   
   // ✅ GOOD
   account.refresh_token = encryptToken(plainToken);
   ```

4. **Don't change NEXTAUTH_SECRET carelessly**
   - All encrypted tokens become unreadable
   - Implement a migration strategy first
   - Consider token re-encryption process

## Encryption Format

Encrypted tokens are stored in this format:
```
iv:authTag:encryptedData
```

Example:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6:q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2:g3h4i5j6k7l8m9n0...
```

- **IV (Initialization Vector)**: 16 bytes, hex encoded
- **Auth Tag**: 16 bytes, hex encoded (GCM authentication)
- **Encrypted Data**: Variable length, hex encoded

## Key Rotation Strategy

If you need to rotate your `NEXTAUTH_SECRET`:

1. **Prepare migration**
   ```typescript
   // Store both old and new secrets temporarily
   const OLD_SECRET = process.env.NEXTAUTH_SECRET_OLD;
   const NEW_SECRET = process.env.NEXTAUTH_SECRET;
   ```

2. **Create re-encryption script**
   ```typescript
   async function reencryptTokens() {
     const accounts = await prisma.account.findMany({
       where: { refresh_token: { not: null } },
     });

     for (const account of accounts) {
       // Decrypt with old secret
       const decrypted = decryptTokenWithSecret(
         account.refresh_token,
         OLD_SECRET
       );
       
       // Encrypt with new secret
       const reencrypted = encryptTokenWithSecret(
         decrypted,
         NEW_SECRET
       );

       // Update database
       await prisma.account.update({
         where: { id: account.id },
         data: { refresh_token: reencrypted },
       });
     }
   }
   ```

3. **Execute migration during maintenance window**

## Compliance Considerations

This encryption implementation helps with:

- **GDPR**: Protects user data with encryption
- **HIPAA**: If handling health data, add additional layers
- **SOC 2**: Demonstrates data protection controls
- **PCI DSS**: If integrating payment systems

## Additional Security Layers

Consider adding:

1. **Database-level encryption**
   - PostgreSQL pgcrypto extension
   - AWS RDS encryption
   - Azure SQL Transparent Data Encryption

2. **Secrets management**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

3. **Token rotation**
   - Automatically refresh tokens periodically
   - Invalidate old tokens
   - Re-encrypt with new keys

4. **Audit logging**
   - Log all token access
   - Monitor for anomalies
   - Alert on suspicious activity

## Testing Encryption

Test your encryption implementation:

```typescript
import { encryptToken, decryptToken } from '@/lib/crypto';

describe('Token Encryption', () => {
  it('should encrypt and decrypt correctly', () => {
    const original = 'my-secret-refresh-token';
    const encrypted = encryptToken(original);
    const decrypted = decryptToken(encrypted);
    
    expect(encrypted).not.toBe(original);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertexts for same input', () => {
    const token = 'same-token';
    const encrypted1 = encryptToken(token);
    const encrypted2 = encryptToken(token);
    
    // Different IVs = different ciphertexts
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both decrypt to same value
    expect(decryptToken(encrypted1)).toBe(token);
    expect(decryptToken(encrypted2)).toBe(token);
  });
});
```

## Resources

- [NIST Encryption Standards](https://csrc.nist.gov/projects/block-cipher-techniques/bcm/current-modes)
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Google OAuth 2.0 Security](https://developers.google.com/identity/protocols/oauth2#scenarios)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)

## Questions & Support

If you have questions about the encryption implementation:
1. Check if the encryption key (NEXTAUTH_SECRET) is properly set
2. Verify tokens are being encrypted in the `signIn` callback
3. Test with a simple encrypt/decrypt cycle
4. Review the logs for encryption errors
5. Ensure you haven't changed NEXTAUTH_SECRET after encrypting tokens

Remember: **Security is a process, not a product.** Regularly review and update your security practices.
