# 🔐 Admin Panel & License Key System - Setup Guide

This guide explains how to set up and use the Admin Panel and License Key activation system.

## 📋 Overview

The system includes:
- **Role-based access control** (USER, ADMIN)
- **License key generation** for admins
- **Account activation** flow for users
- **Secure key validation** and one-time use enforcement

## 🗄️ Database Changes

### Step 1: Apply the Prisma Migration

After the schema has been updated, run:

```bash
npx prisma migrate dev --name init_licensing
```

Or if you prefer to push directly without migrations:

```bash
npx prisma db push
```

Then generate the Prisma client:

```bash
npx prisma generate
```

### Step 2: Create Your First Admin User

You need to manually set a user as ADMIN in the database. Use Prisma Studio:

```bash
npx prisma studio
```

1. Open Prisma Studio (usually at http://localhost:5555)
2. Navigate to the `User` table
3. Find your user account (the one you signed in with)
4. Edit the user and set:
   - `role` = `ADMIN`
5. Save changes

**Alternatively**, use SQL directly:

```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';
```

## 🎯 System Flow

### For ADMIN Users

1. **Sign in** with Google OAuth
2. Navigate to `/admin`
3. **Generate license keys** using the "Yeni Anahtar Oluştur" button
4. **View all keys** in the table with their status
5. **Share keys** with users who need to activate their accounts

### For Regular Users

1. **Sign in** with Google OAuth
2. Automatically redirected to `/dashboard`
3. If `isActivated = false`:
   - See activation form
   - Enter the license key provided by admin
   - Click "Aktifleştir"
4. If `isActivated = true`:
   - Access full application features

## 📁 File Structure

### New Files Created

```
app/
├── admin/
│   ├── page.tsx          # Admin panel UI
│   └── actions.ts        # Server actions for key generation
├── dashboard/
│   ├── page.tsx          # User dashboard with activation
│   └── actions.ts        # Server actions for activation
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── options.ts  # Updated with role & activation
prisma/
└── schema.prisma         # Updated with Role, LicenseKey model
types/
└── next-auth.d.ts        # Extended with role & isActivated
```

## 🔑 How License Keys Work

### Key Format

All license keys follow the pattern:
```
TAK-XXXXXXXX
```

Where `XXXXXXXX` is a random uppercase alphanumeric string (first 8 chars of a UUID).

### Key Properties

- **id**: The key itself (e.g., "TAK-A1B2C3D4")
- **isUsed**: Boolean indicating if the key has been used
- **activatedByUserId**: Reference to the user who used this key
- **createdAt**: Timestamp of key creation

### Key Validation

When a user tries to activate:
1. Check if key exists in database
2. Check if key is already used (`isUsed = true`)
3. If valid, update user (`isActivated = true`) and key (`isUsed = true`, link to user)
4. All in a transaction for data consistency

## 🛡️ Security Features

### Access Control

- **Admin Panel**: Only users with `role = ADMIN` can access `/admin`
- **Server Actions**: All actions re-verify admin status on the server
- **Key Usage**: Each key can only be used once

### Session Management

- `role` and `isActivated` are stored in the JWT token
- Session is updated on login and can be refreshed with `trigger: "update"`
- NextAuth callbacks fetch latest user data from database

## 🎨 UI Components

### Admin Panel (`/admin`)

Features:
- Statistics cards (Total Keys, Used, Available)
- One-click key generation button
- Comprehensive table showing all keys
- Key deletion for unused keys
- User information display

### Dashboard (`/dashboard`)

Two states:

**Not Activated**:
- Activation form with license key input
- Pattern validation (TAK-XXXXXXXX format)
- User email display
- Clear error messages

**Activated**:
- Welcome message
- Active status indicator
- Group selection (A-F)
- Calendar sync section
- Quick actions

## 📝 Usage Examples

### Creating a License Key (Admin)

```typescript
// This happens when admin clicks "Yeni Anahtar Oluştur"
const result = await createLicenseKey();
// Returns: { success: true, key: "TAK-A1B2C3D4" }
```

### Activating an Account (User)

```typescript
// User submits the form with a license key
const formData = new FormData();
formData.set('licenseKey', 'TAK-A1B2C3D4');

const result = await activateAccount(formData);
// Returns: { success: true, message: "Hesabınız başarıyla aktifleştirildi!" }
```

## 🔧 Troubleshooting

### User can't access admin panel

**Solution**: Check the database. Ensure the user's `role` field is set to `ADMIN`.

```sql
SELECT email, role FROM "User" WHERE email = 'your-email@example.com';
```

### License key activation fails

**Possible causes**:
1. Key doesn't exist - verify the key ID in the database
2. Key already used - check `isUsed` field
3. Database connection issue - check Prisma connection

### Session doesn't show role/isActivated

**Solution**: 
1. Sign out and sign back in to refresh the JWT token
2. Check that the NextAuth callbacks in `options.ts` are fetching user data
3. Verify the TypeScript types in `types/next-auth.d.ts`

### Migration fails

**Solution**:
```bash
# Reset the database (DEVELOPMENT ONLY!)
npx prisma migrate reset

# Or push schema directly
npx prisma db push --force-reset
```

## 🚀 Next Steps

After setup:

1. **Create admin accounts** for your team
2. **Generate license keys** in bulk if needed
3. **Distribute keys** to users who need access
4. **Monitor usage** in the admin panel
5. **Customize the dashboard** with your application features

## 📚 Additional Features (Optional)

You can extend the system with:

- **Bulk key generation**: Generate 10, 50, or 100 keys at once
- **Key expiration**: Add `expiresAt` field to LicenseKey model
- **Usage limits**: Track how many times a key has been used
- **Key types**: Different keys for different access levels
- **Email notifications**: Send keys via email automatically
- **Analytics**: Track activation rates and user engagement

## 🔒 Best Practices

1. **Don't share keys publicly** - Send them directly to users
2. **Rotate admin credentials** - Change admin passwords regularly
3. **Monitor key usage** - Check for suspicious activation patterns
4. **Backup the database** - License keys are valuable data
5. **Use HTTPS in production** - Protect keys in transit

## 📊 Database Schema Reference

```prisma
enum Role {
  USER
  ADMIN
}

model User {
  // ... existing fields
  role          Role      @default(USER)
  isActivated   Boolean   @default(false)
  activatedKey  LicenseKey?
}

model LicenseKey {
  id                String   @id
  createdAt         DateTime @default(now())
  isUsed            Boolean  @default(false)
  activatedByUserId String?  @unique
  activatedByUser   User?    @relation(fields: [activatedByUserId], references: [id])
}
```

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server logs (`npm run dev` output)
3. Use Prisma Studio to inspect database state
4. Review the TypeScript type errors

---

**System ready!** 🎉 Your admin panel and license activation system is now fully functional.
