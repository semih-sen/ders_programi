import { prisma } from "./prisma";
import { decryptToken } from "./crypto";

/**
 * Retrieves and decrypts the refresh token for a user
 * This is useful when you need to pass the token to external services like n8n
 * 
 * @param userId - The user's ID
 * @param provider - The OAuth provider (default: "google")
 * @returns The decrypted refresh token or null if not found
 */
export async function getRefreshToken(
  userId: string,
  provider: string = "google"
): Promise<string | null> {
  try {
    // Find the account for this user and provider
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: provider,
      },
      select: {
        refresh_token: true,
        access_token: true,
        expires_at: true,
      },
    });

    if (!account) {
      console.log(`No account found for user ${userId} with provider ${provider}`);
      return null;
    }

    if (!account.refresh_token) {
      console.log(`No refresh token found for user ${userId}`);
      return null;
    }

    // Decrypt the refresh token
    const decryptedToken = decryptToken(account.refresh_token);
    
    return decryptedToken;
  } catch (error) {
    console.error('Error retrieving refresh token:', error);
    throw error;
  }
}

/**
 * Example: Get both access and refresh tokens for a user
 * 
 * @param userId - The user's ID
 * @param provider - The OAuth provider (default: "google")
 */
export async function getUserTokens(
  userId: string,
  provider: string = "google"
) {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: provider,
      },
      select: {
        refresh_token: true,
        access_token: true,
        expires_at: true,
        token_type: true,
        scope: true,
      },
    });

    if (!account) {
      return null;
    }

    return {
      refreshToken: account.refresh_token ? decryptToken(account.refresh_token) : null,
      accessToken: account.access_token ? decryptToken(account.access_token) : null,
      expiresAt: account.expires_at,
      tokenType: account.token_type,
      scope: account.scope,
    };
  } catch (error) {
    console.error('Error retrieving user tokens:', error);
    throw error;
  }
}
