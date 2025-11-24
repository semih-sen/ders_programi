import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import type { Adapter } from "next-auth/adapters";
import { tr } from "zod/locales";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions:{
        timeout:5000
      },
      allowDangerousEmailAccountLinking:true,
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
            "https://www.googleapis.com/auth/calendar.events.owned"
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
  async jwt({ token, account, user, trigger }) {
      // Initial sign in
      if (account && user) {
        // Fetch the full user data including role and isActivated
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, isActivated: true, hasCompletedOnboarding: true, isBanned: true, banReason: true }
        });

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          userId: user.id,
          role: dbUser?.role || "USER",
          isActivated: dbUser?.isActivated || false,
          hasCompletedOnboarding: dbUser?.hasCompletedOnboarding || false,
          isBanned: dbUser?.isBanned || false,
          banReason: dbUser?.banReason || null,
        };
      }

      // Always refresh role/activation from DB for consistency after activation changes
      if (token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { role: true, isActivated: true, hasCompletedOnboarding: true, isBanned: true, banReason: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.isActivated = dbUser.isActivated;
          token.hasCompletedOnboarding = dbUser.hasCompletedOnboarding;
          token.isBanned = dbUser.isBanned;
          token.banReason = dbUser.banReason;
        }
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
        session.user.role = (token.role as "USER" | "ADMIN") || "USER";
        session.user.isActivated = token.isActivated || false;
        session.user.hasCompletedOnboarding = token.hasCompletedOnboarding || false;
        session.user.isBanned = token.isBanned || false;
        session.user.banReason = token.banReason || undefined;
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
      // Allow sign in; encryption handled in events.linkAccount after adapter persistence
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

    /**
     * Encrypt refresh_token after adapter saves the Account (clean approach)
     */
    async linkAccount({ user, account }) {
      try {
        if (!account) return;
        // Find the adapter Account by its unique composite key
        const dbAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          select: { id: true, refresh_token: true },
        });

        if (!dbAccount || !dbAccount.refresh_token) return;

        // Skip if looks already encrypted (three colon-separated parts)
        if (dbAccount.refresh_token.includes(':') && dbAccount.refresh_token.split(':').length === 3) {
          return;
        }

        const encryptedToken = encrypt(dbAccount.refresh_token);
        await prisma.account.update({
          where: { id: dbAccount.id },
          data: { refresh_token: encryptedToken },
        });
        console.log('✅ Refresh token encrypted via linkAccount event');
      } catch (err) {
        console.error('❌ linkAccount encryption error:', err);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',

  secret: process.env.NEXTAUTH_SECRET,
};

