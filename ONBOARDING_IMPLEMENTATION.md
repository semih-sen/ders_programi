# Onboarding Feature Implementation Guide

## 🎯 Overview

This guide will help you complete the onboarding feature implementation. All code files have been created and updated. You now need to:

1. Install dependencies
2. Run database migrations
3. Seed the courses
4. Test the feature

---

## 📋 Step-by-Step Instructions

### Step 1: Install Zod Package

The onboarding feature requires `zod` for validation.

```bash
npm install zod
```

### Step 2: Generate Prisma Client

Before running migrations, regenerate the Prisma client with the new schema:

```bash
npx prisma generate
```

### Step 3: Run Database Migration

This will apply all the schema changes to your database:

```bash
npx prisma migrate dev --name add_onboarding_features
```

This migration adds:
- `hasCompletedOnboarding` field to User
- `uygulamaGrubu`, `anatomiGrubu`, `yemekhaneEklensin`, `classYear`, `language` fields to User
- New `Language` enum (TR, EN)
- New `Course` model
- New `UserCourseSubscription` join table

### Step 4: Seed the Courses

The seed script will populate the database with all available theoretical courses:

```bash
npx prisma db seed
```

**Note:** You need to add this to your `package.json` first:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

If you don't have `ts-node`, install it:

```bash
npm install -D ts-node
```

**Alternative:** Run the seed manually:

```bash
npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts
```

---

## 🔍 What Was Changed

### 1. Database Schema (`prisma/schema.prisma`)

**Added to User model:**
- `hasCompletedOnboarding: Boolean` - Tracks if user completed onboarding
- `uygulamaGrubu: String?` - User's application group (A, B, C, D)
- `anatomiGrubu: String?` - User's anatomy group
- `yemekhaneEklensin: Boolean` - Whether to add cafeteria to calendar
- `classYear: Int?` - Student's class year (1-6)
- `language: Language?` - User's language preference

**New Models:**
- `Course` - Stores available theoretical courses
- `UserCourseSubscription` - Join table for user course preferences

### 2. Server Actions (`app/dashboard/actions.ts`)

**New Action: `saveOnboardingPreferences`**
- Validates input with Zod schema
- Saves user preferences in a transaction
- Updates user fields and creates course subscriptions
- Marks `hasCompletedOnboarding = true`

### 3. UI Component (`app/dashboard/OnboardingForm.tsx`)

**New Client Component:**
- Form for collecting all user preferences
- Dynamic course selection with checkboxes
- Two options per course: "Add to Calendar" and "Send Notifications"
- Beautiful, responsive UI matching your existing design
- Handles form submission and displays success/error messages

### 4. Dashboard Routing (`app/dashboard/page.tsx`)

**Updated with 3-Step Flow:**
1. **Not Activated** → Show activation form (license key entry)
2. **Activated but Not Onboarded** → Show onboarding form
3. **Activated and Onboarded** → Show main application

### 5. Type Definitions (`types/next-auth.d.ts`)

**Extended NextAuth types:**
- Added `hasCompletedOnboarding` to Session and JWT

### 6. Auth Options (`app/api/auth/[...nextauth]/options.ts`)

**Updated callbacks:**
- JWT callback now fetches and includes `hasCompletedOnboarding`
- Session callback exposes this field to the client

---

## 🎨 Courses to be Seeded

The following courses will be available for selection:

1. Anatomi
2. Fizyoloji
3. Histoloji
4. Biyokimya
5. Mikrobiyoloji
6. Patoloji
7. Farmakoloji
8. Dahiliye
9. Cerrahi
10. Pediatri
11. Kadın Hastalıkları ve Doğum
12. Psikiyatri
13. Nöroloji
14. Kardiyoloji
15. Tıbbi Biyoloji
16. Tıbbi Genetik
17. Halk Sağlığı
18. Tıp Tarihi ve Etik

You can modify the list in `prisma/seed.ts` before running the seed command.

---

## 🧪 Testing the Feature

### Test Flow:

1. **Sign in** with Google
2. **Activate** with a license key → Redirects to onboarding
3. **Fill onboarding form:**
   - Select Uygulama Grubu (e.g., "A")
   - Select Anatomi Grubu (e.g., "Anatomi-1")
   - Check "Yemekhane eklensin" if desired
   - Select optional fields (Dönem, Dil)
   - Review course list - all are checked by default
   - Uncheck courses you don't want
   - Click "Kaydet ve Devam Et"
4. **Redirected to main app** → You should now see the full dashboard

### Verify in Database:

```bash
npx prisma studio
```

Check:
- User has `hasCompletedOnboarding = true`
- User preferences are saved
- `UserCourseSubscription` records exist for selected courses

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'zod'"
→ Run: `npm install zod`

### Error: "Property 'course' does not exist"
→ Run: `npx prisma generate`

### Error: "Property 'hasCompletedOnboarding' does not exist"
→ Restart your TypeScript server in VS Code
→ Command Palette (Ctrl+Shift+P) → "TypeScript: Restart TS Server"

### Courses not showing in onboarding
→ Make sure you ran the seed script
→ Check in Prisma Studio if courses exist

---

## 📝 Next Steps (Future Enhancements)

- Add ability to edit preferences after onboarding
- Add course filtering/search in onboarding
- Implement actual calendar sync based on preferences
- Add notification settings page
- Create admin interface to manage courses

---

## ✅ Summary

All code has been implemented. You just need to:

```bash
# 1. Install dependencies
npm install zod

# 2. Generate Prisma client
npx prisma generate

# 3. Run migration
npx prisma migrate dev --name add_onboarding_features

# 4. Seed courses (add seed config to package.json first, or run manually)
npx prisma db seed
# OR
npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts

# 5. Restart dev server
npm run dev
```

Then test by signing in and going through the onboarding flow!

---

**Created by GitHub Copilot** 🤖
