# 🚀 Quick Start Commands

## Step 1: Install Dependencies (if not done)

Use **Command Prompt (cmd)** to avoid PowerShell restrictions:

```cmd
npm install
```

## Step 2: Apply Database Changes

Run the Prisma migration to create the new tables:

```cmd
npx prisma migrate dev --name init_licensing
```

Or push directly without migrations:

```cmd
npx prisma db push
```

Then generate the Prisma client:

```cmd
npx prisma generate
```

## Step 3: Create Your First Admin User

Open Prisma Studio:

```cmd
npx prisma studio
```

1. Navigate to http://localhost:5555
2. Go to the `User` table
3. Find your user (the one you logged in with)
4. Edit and set `role` to `ADMIN`
5. Save changes

**Or use SQL directly in your database:**

```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';
```

## Step 4: Run the Development Server

```cmd
npm run dev
```

## Step 5: Test the System

1. **Sign in** at http://localhost:3000
2. **Admin Panel**: Visit http://localhost:3000/admin
3. **Generate a license key**
4. **Sign out** and sign in with a different Google account
5. **Dashboard**: You'll see the activation form at http://localhost:3000/dashboard
6. **Enter the license key** and activate

## 📋 Useful Commands

### Database Management

```cmd
# View database in GUI
npx prisma studio

# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes without migrations
npx prisma db push

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database (DEVELOPMENT ONLY!)
npx prisma migrate reset
```

### Development

```cmd
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run TypeScript type checking
npx tsc --noEmit
```

### Database Queries (Examples)

```sql
-- Check all users
SELECT id, email, role, "isActivated" FROM "User";

-- Check all license keys
SELECT id, "isUsed", "createdAt", "activatedByUserId" FROM "LicenseKey";

-- Set a user as admin
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';

-- Activate a user manually (if needed)
UPDATE "User" SET "isActivated" = true WHERE email = 'user@example.com';
```

## 🔍 Testing Checklist

- [ ] Database migration applied successfully
- [ ] At least one ADMIN user created
- [ ] Can access `/admin` panel
- [ ] Can generate license keys
- [ ] Keys appear in the admin table
- [ ] Can sign in with a non-admin account
- [ ] Dashboard shows activation form
- [ ] Can successfully activate with a valid key
- [ ] Activated user sees the main dashboard
- [ ] Key is marked as used in admin panel

## 🚨 Common Issues

### "Cannot find module '@prisma/client'"

```cmd
npx prisma generate
```

### "Table does not exist"

```cmd
npx prisma db push
```

### "Access denied to /admin"

Make sure your user's `role` is set to `ADMIN` in the database.

### TypeScript errors about 'Role' type

```cmd
npx prisma generate
npm run dev
```

Restart the dev server after generating Prisma client.

## 📁 Important Files

- `prisma/schema.prisma` - Database schema
- `app/admin/page.tsx` - Admin panel UI
- `app/admin/actions.ts` - Admin server actions
- `app/dashboard/page.tsx` - User dashboard UI
- `app/dashboard/actions.ts` - User activation actions
- `app/api/auth/[...nextauth]/options.ts` - NextAuth config
- `types/next-auth.d.ts` - TypeScript types

## 🎯 Quick Test Flow

1. **Terminal 1**: Run dev server
   ```cmd
   npm run dev
   ```

2. **Terminal 2**: Open Prisma Studio
   ```cmd
   npx prisma studio
   ```

3. **Browser**: Test the flow
   - Sign in → Admin panel → Generate key → Sign out
   - Sign in (different account) → Dashboard → Activate → Success!

---

**You're all set!** 🎉
