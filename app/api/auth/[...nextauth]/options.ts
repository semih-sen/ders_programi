import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      
      authorization: {
        params: {
          // Request offline access to get refresh token
          access_type: "offline",
          
          // Force consent screen to always get refresh token
          // Without this, refresh_token is only provided on first authorization
          prompt: "consent",
          
          // Request necessary scopes
          scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            // Add additional Google scopes as needed, for example:
            // "https://www.googleapis.com/auth/calendar",
            // "https://www.googleapis.com/auth/drive.file",
          ].join(" "),
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/signin',
    // signOut: '/auth/signout',
    // error: '/auth/error',
  },

  callbacks: {
    /**
     * This callback is called whenever a JWT is created or updated
     */
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          userId: user.id,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to refresh it
      // Note: You would implement token refresh logic here if needed
      return token;
    },

    /**
     * This callback is called whenever session is checked
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.accessToken = token.accessToken as string;
        session.error = token.error as string | undefined;
      }
      
      return session;
    },

    /**
     * CRITICAL: This callback encrypts the refresh token before saving to database
     * This runs after the adapter's linkAccount but before the data is persisted
     */
    async signIn({ user, account, profile }) {
      if (account) {
        // Encrypt the refresh token before it gets saved to the database
        if (account.refresh_token) {
          try {
            account.refresh_token = encryptToken(account.refresh_token);
            console.log('✅ Refresh token encrypted successfully');
          } catch (error) {
            console.error('❌ Failed to encrypt refresh token:', error);
            // Decide: should we allow sign-in to proceed or fail?
            // For security, you might want to return false here
            return false;
          }
        }

        // Also encrypt access token if you want (optional but recommended)
        if (account.access_token) {
          try {
            account.access_token = encryptToken(account.access_token);
            console.log('✅ Access token encrypted successfully');
          } catch (error) {
            console.error('❌ Failed to encrypt access token:', error);
          }
        }

        // Log the account data being saved (for debugging)
        console.log('📝 Saving account with encrypted tokens:', {
          provider: account.provider,
          userId: user.id,
          hasRefreshToken: !!account.refresh_token,
          hasAccessToken: !!account.access_token,
          expiresAt: account.expires_at,
        });
      }

      return true;
    },
  },

  events: {
    /**
     * Log successful sign ins
     */
    async signIn({ user, account, profile, isNewUser }) {
      console.log('🔐 User signed in:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });
    },
  },

  debug: process.env.NODE_ENV === 'development',

  secret: process.env.NEXTAUTH_SECRET,
};

