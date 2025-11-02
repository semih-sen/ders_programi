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
    } & DefaultSession["user"];
    accessToken?: string;
    error?: string;
  }

  interface User {
    id: string;
    role?: "USER" | "ADMIN";
    isActivated?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: "USER" | "ADMIN";
    isActivated?: boolean;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
