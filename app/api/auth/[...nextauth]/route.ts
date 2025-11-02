import NextAuth from "next-auth";

import {authOptions} from "./options"
/**
 * NextAuth.js v5 Configuration
 * 
 * This configuration handles:
 * - Google OAuth with offline access (to get refresh tokens)
 * - Encrypted storage of refresh tokens in the database
 * - Proper token management and persistence
 */


const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
