# 🚀 Quick Setup Guide

Follow these steps in order to get your Next.js backend up and running:

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- NextAuth.js (Auth.js v5)
- Prisma & Prisma Client
- @auth/prisma-adapter
- React & React DOM

## Step 2: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   copy .env.local.example .env.local
   ```

2. Edit `.env.local` and fill in your values:
   
   **DATABASE_URL**: Your PostgreSQL connection string
   ```
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME?schema=public"
   ```

   **NEXTAUTH_SECRET**: Generate a secure random string
   ```bash
   # On Windows with Git Bash or WSL:
   openssl rand -base64 32
   
   # Or use Node.js:
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   **Google OAuth Credentials**: Get from Google Cloud Console (see below)

## Step 3: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **Google+ API** or **Google Identity API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - Add your app name and required info
   - Add scopes: `email`, `profile`, `openid`
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret** to `.env.local`

## Step 4: Set Up PostgreSQL Database

### Option A: Local PostgreSQL
1. Install PostgreSQL if not already installed
2. Create a new database:
   ```sql
   CREATE DATABASE ders_programi;
   ```
3. Update `DATABASE_URL` in `.env.local` with your credentials

### Option B: Cloud PostgreSQL (Recommended for Production)
- **Vercel Postgres**: https://vercel.com/storage/postgres
- **Supabase**: https://supabase.com/ (free tier available)
- **Railway**: https://railway.app/ (free tier available)
- **Neon**: https://neon.tech/ (serverless PostgreSQL)

## Step 5: Initialize Database with Prisma

1. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

2. Push the schema to your database:
   ```bash
   npm run db:push
   ```

   Or use migrations (recommended for production):
   ```bash
   npm run db:migrate
   ```

3. (Optional) Open Prisma Studio to view your database:
   ```bash
   npm run db:studio
   ```

## Step 6: Run Development Server

```bash
npm run dev
```

Your application will be available at http://localhost:3000

## Step 7: Test Authentication

1. Navigate to http://localhost:3000/auth/signin
2. Click "Continue with Google"
3. Complete the OAuth flow
4. Check the database (Prisma Studio) to verify:
   - User was created
   - Account was created with encrypted tokens
   - refresh_token is stored (encrypted)

## Step 8: Test Token Retrieval

You can test the token retrieval API:

```bash
# First, sign in through the browser, then:
curl http://localhost:3000/api/n8n/trigger
```

## Verification Checklist

- [ ] Dependencies installed successfully
- [ ] `.env.local` created with all values filled
- [ ] Google OAuth credentials configured
- [ ] PostgreSQL database created and accessible
- [ ] Prisma schema pushed to database
- [ ] Development server running without errors
- [ ] Successfully signed in with Google
- [ ] User and Account records created in database
- [ ] Refresh token is encrypted in database
- [ ] Can retrieve tokens through API

## Common Issues & Solutions

### "Cannot find module '@prisma/client'"
Run: `npm run db:generate`

### "P1001: Can't reach database server"
- Verify PostgreSQL is running
- Check DATABASE_URL is correct
- Ensure database exists

### "No refresh token received"
- Ensure `prompt: "consent"` is in Google provider config
- Revoke app access in Google Account settings and try again
- Check that `access_type: "offline"` is set

### "Encryption error"
- Ensure NEXTAUTH_SECRET is set and at least 32 characters
- Don't change NEXTAUTH_SECRET after encrypting tokens

## Next Steps

1. **Add more Google scopes** if needed (e.g., Calendar, Drive)
   - Edit `app/api/auth/[...nextauth]/route.ts`
   - Add scopes to the authorization params
   - Re-authorize your Google account

2. **Implement token refresh logic**
   - Use the refresh token to get new access tokens
   - See Google OAuth 2.0 documentation

3. **Create your n8n workflow**
   - Use the `/api/n8n/trigger` route as a starting point
   - Pass the decrypted refresh token to n8n

4. **Add proper error handling and logging**
   - Consider using a logging service (e.g., Sentry, LogRocket)

5. **Deploy to production**
   - Set up production environment variables
   - Use a production PostgreSQL database
   - Update Google OAuth redirect URIs

## Security Reminders

- ✅ Never commit `.env.local` to git
- ✅ Use HTTPS in production
- ✅ Rotate NEXTAUTH_SECRET periodically
- ✅ Monitor token access and usage
- ✅ Implement rate limiting on auth endpoints
- ✅ Enable database encryption at rest
- ✅ Audit your dependencies regularly

## Need Help?

- NextAuth.js: https://next-auth.js.org/getting-started/introduction
- Prisma: https://www.prisma.io/docs/getting-started
- Google OAuth: https://developers.google.com/identity/protocols/oauth2

Happy coding! 🎉
