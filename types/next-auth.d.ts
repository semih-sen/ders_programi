import "next-auth";
import { DefaultSession } from "next-auth";

/**
 * Module augmentation for next-auth types
 * This extends the default session and JWT types with our custom properties
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      isActivated: boolean;
      hasCompletedOnboarding: boolean;
      isBanned?: boolean;
      banReason?: string;
    } & DefaultSession["user"];
    accessToken?: string;
    error?: string;
  }

  interface User {
    id: string;
    role?: "USER" | "ADMIN";
    isActivated?: boolean;
    hasCompletedOnboarding?: boolean;
    isBanned?: boolean;
    banReason?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: "USER" | "ADMIN";
    isActivated?: boolean;
    hasCompletedOnboarding?: boolean;
    isBanned?: boolean;
    banReason?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
