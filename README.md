# Next.js 14+ Backend with Secure OAuth

This project implements a robust Next.js backend with PostgreSQL, Prisma ORM, and NextAuth.js with encrypted token storage.

## 🔐 Security Features

- **Encrypted Refresh Tokens**: All refresh tokens are encrypted using AES-256-GCM before being stored in the database
- **Secure Token Management**: Access tokens are also encrypted for additional security
- **Offline Access**: Configured to always request refresh tokens from Google OAuth

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Google Cloud Console project with OAuth 2.0 credentials

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
copy .env.local.example .env.local
```

Then fill in the required values:

- **DATABASE_URL**: Your PostgreSQL connection string
- **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`
- **GOOGLE_CLIENT_ID**: From Google Cloud Console
- **GOOGLE_CLIENT_SECRET**: From Google Cloud Console

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env.local`

### 4. Initialize Database

Run Prisma migrations to create the database schema:

```bash
npm run db:push
```

Or if you want to use migrations:

```bash
npm run db:migrate
```

### 5. Generate Prisma Client

```bash
npm run db:generate
```

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## 🗄️ Database Schema

The Prisma schema includes:

- **User**: User accounts
- **Account**: OAuth provider accounts (with encrypted tokens)
- **Session**: User sessions
- **VerificationToken**: Email verification tokens

## 🔑 Token Encryption

### How It Works

1. **On Sign In**: When a user signs in with Google, the `signIn` callback in NextAuth intercepts the tokens
2. **Encryption**: The `refresh_token` and `access_token` are encrypted using AES-256-GCM
3. **Storage**: Encrypted tokens are stored in the database
4. **Retrieval**: When you need to use the tokens (e.g., for n8n workflows), use the `getRefreshToken()` helper to decrypt them

### Using Encrypted Tokens

```typescript
import { getRefreshToken, getUserTokens } from '@/lib/get-refresh-token';

// Get just the refresh token
const refreshToken = await getRefreshToken(userId);

// Or get all tokens
const tokens = await getUserTokens(userId);
console.log(tokens.refreshToken);
console.log(tokens.accessToken);
```

## 📁 Project Structure

```
├── app/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts          # NextAuth configuration
├── lib/
│   ├── prisma.ts                      # Prisma client singleton
│   ├── crypto.ts                      # Encryption/decryption utilities
│   └── get-refresh-token.ts           # Helper to retrieve tokens
├── prisma/
│   └── schema.prisma                  # Database schema
├── types/
│   └── next-auth.d.ts                 # TypeScript type extensions
├── .env.local.example                 # Environment variables template
└── package.json
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create a new migration
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:generate` - Generate Prisma Client

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - It contains sensitive credentials
2. **Rotate secrets regularly** - Change `NEXTAUTH_SECRET` periodically
3. **Use HTTPS in production** - Always use secure connections
4. **Database encryption at rest** - Consider enabling PostgreSQL encryption
5. **Audit token access** - Log when tokens are decrypted and used
6. **Implement rate limiting** - Protect your auth endpoints

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

## ⚠️ Important Notes

### Refresh Token Behavior

- Google only provides a refresh token on the **first authorization**
- Using `prompt: "consent"` forces Google to show the consent screen every time, ensuring you always get a refresh token
- If you remove `prompt: "consent"`, you'll only get a refresh token the first time a user signs in
- To test refresh token flow, revoke access in Google Account settings between tests

### Token Expiration

- Access tokens typically expire after 1 hour
- Refresh tokens can be used to obtain new access tokens
- Implement token refresh logic in the `jwt` callback if needed

## 🐛 Troubleshooting

### "No refresh token received"

- Ensure `prompt: "consent"` is set in the Google provider configuration
- Revoke app access in your Google Account settings and try again
- Check that `access_type: "offline"` is included

### Database connection errors

- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check that the database specified in the URL exists

### Encryption errors

- Ensure `NEXTAUTH_SECRET` is set and is at least 32 characters
- Don't change `NEXTAUTH_SECRET` after encrypting tokens (they won't decrypt)
