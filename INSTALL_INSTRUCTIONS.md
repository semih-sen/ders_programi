# 🚀 Installation Instructions

## Step 1: Install Dependencies

Since you're experiencing PowerShell execution policy issues, please run the installation commands in **Command Prompt (cmd)** or **Git Bash**.

### Option A: Using Command Prompt (Recommended)

1. Open **Command Prompt** (cmd)
2. Navigate to your project directory:
   ```cmd
   cd d:\Development\Projects\ders_programi
   ```
3. Run the installation:
   ```cmd
   npm install
   ```

### Option B: Using Git Bash

1. Open **Git Bash**
2. Navigate to your project directory:
   ```bash
   cd /d/Development/Projects/ders_programi
   ```
3. Run the installation:
   ```bash
   npm install
   ```

### Option C: Fix PowerShell Execution Policy (If you prefer PowerShell)

1. Open **PowerShell as Administrator**
2. Run:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```
3. Confirm with `Y`
4. Then navigate to your project and run:
   ```powershell
   npm install
   ```

## Step 2: Verify Installation

After installation completes, verify that these packages are installed:

### Dependencies (Production)
- ✅ `@auth/prisma-adapter` - For NextAuth + Prisma integration
- ✅ `@prisma/client` - Prisma database client
- ✅ `next` - Next.js framework
- ✅ `next-auth` - Authentication
- ✅ `react` - React library
- ✅ `react-dom` - React DOM rendering
- ✅ `react-markdown` - **NEW**: Markdown rendering for legal pages

### Dev Dependencies
- ✅ `@tailwindcss/typography` - **NEW**: Tailwind typography plugin
- ✅ `@types/node` - TypeScript types for Node.js
- ✅ `@types/react` - TypeScript types for React
- ✅ `@types/react-dom` - TypeScript types for React DOM
- ✅ `autoprefixer` - **NEW**: PostCSS autoprefixer
- ✅ `postcss` - **NEW**: CSS processing
- ✅ `prisma` - Prisma CLI
- ✅ `tailwindcss` - **NEW**: Tailwind CSS framework
- ✅ `typescript` - TypeScript compiler

## Step 3: Run the Development Server

```bash
npm run dev
```

Your application should now be running at http://localhost:3000

## 🎨 What's New - Frontend Features

All files have been created with:
- ✅ **Turkish language** throughout the UI
- ✅ **Tailwind CSS** for modern, dark-themed styling
- ✅ **Responsive design** for mobile, tablet, and desktop
- ✅ **Markdown support** for legal pages

## 📁 New Files Created

### Pages
- ✅ `app/page.tsx` - Landing page (Turkish, Tailwind)
- ✅ `app/privacy/page.tsx` - Privacy policy page
- ✅ `app/terms/page.tsx` - Terms of service page
- ✅ `app/auth/signin/page.tsx` - Sign-in page (updated)

### Components
- ✅ `app/components/Footer.tsx` - Reusable footer with legal links

### Styles & Config
- ✅ `app/globals.css` - Global styles with Tailwind directives
- ✅ `app/layout.tsx` - Updated with Footer and Turkish metadata
- ✅ `tailwind.config.ts` - Tailwind configuration
- ✅ `postcss.config.js` - PostCSS configuration

### Documentation
- ✅ `FRONTEND_SETUP.md` - Frontend setup guide
- ✅ `INSTALL_INSTRUCTIONS.md` - This file

## 🔍 Quick Test

After running `npm run dev`, test these pages:

1. **Landing Page**: http://localhost:3000
   - Should show Turkish hero section
   - "Google ile Giriş Yap" button

2. **Sign In**: http://localhost:3000/auth/signin
   - Modern card design
   - Turkish language

3. **Privacy**: http://localhost:3000/privacy
   - Renders `privacy_policy.md`
   - Dark theme with proper typography

4. **Terms**: http://localhost:3000/terms
   - Renders `terms_of_service.md`
   - Dark theme with proper typography

## ⚠️ Common Issues

### Issue: "Cannot find module 'react-markdown'"
**Solution**: Run `npm install` in cmd or Git Bash

### Issue: Tailwind classes not working
**Solution**: 
1. Ensure `npm install` completed successfully
2. Restart the dev server: `Ctrl+C` then `npm run dev`

### Issue: Markdown files not found
**Solution**: 
- Make sure `privacy_policy.md` and `terms_of_service.md` exist in the root directory
- If not, create them with some placeholder content

### Issue: TypeScript errors
**Solution**: These will disappear after `npm install` completes

## 📝 Next Steps After Installation

1. ✅ Complete the backend setup (see `SETUP.md`)
2. ✅ Configure `.env.local` with Google OAuth credentials
3. ✅ Set up PostgreSQL database
4. ✅ Run `npm run db:push` to create database tables
5. ✅ Test the full authentication flow
6. ✅ Customize the markdown content in legal pages
7. ✅ Add your actual branding/logo

## 🎯 Full Stack Ready!

Once installation is complete, you'll have:
- 🔐 Secure OAuth authentication with encrypted tokens
- 🎨 Beautiful Turkish UI with Tailwind CSS
- 📄 Legal pages with markdown rendering
- 🗄️ PostgreSQL + Prisma ORM
- ⚡ Next.js 14 App Router

Happy coding! 🚀
