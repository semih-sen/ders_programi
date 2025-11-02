# 🎨 Frontend Setup Instructions

This document provides instructions for setting up the Turkish-language frontend with Tailwind CSS.

## 📦 Required Dependencies

You need to install the following dependencies. Due to PowerShell execution policy restrictions, you may need to run these commands in **Command Prompt (cmd)** or **Git Bash**:

### Install All Dependencies at Once

```bash
npm install react-markdown
npm install -D tailwindcss postcss autoprefixer @tailwindcss/typography
```

Or if the above doesn't work, try running npm install without any parameters to install from package.json:

```bash
npm install
```

## 🗂️ Files Created

### 1. **Landing Page** (`app/page.tsx`)
- Turkish hero section with headline: "Ders Programın, Sen Uğraşma, Takvimine Gelsin."
- Subheadline explaining the service
- CTA button: "Google ile Giriş Yap"
- Feature cards with icons
- Dark theme with gradient background
- Responsive design

### 2. **Footer Component** (`app/components/Footer.tsx`)
- Links to Privacy Policy (Gizlilik Politikası)
- Links to Terms of Service (Hizmet Şartları)
- Copyright notice
- Responsive layout

### 3. **Privacy Page** (`app/privacy/page.tsx`)
- Reads from `privacy_policy.md`
- Renders markdown content with custom styling
- Tailwind prose typography
- Dark theme optimized
- Navigation back to home

### 4. **Terms Page** (`app/terms/page.tsx`)
- Reads from `terms_of_service.md`
- Renders markdown content with custom styling
- Tailwind prose typography
- Dark theme optimized
- Navigation back to home

### 5. **Sign In Page** (`app/auth/signin/page.tsx`)
- Updated with Turkish language
- Modern card design
- Google sign-in button
- Links to legal pages
- Feature icons

### 6. **Configuration Files**
- `tailwind.config.ts` - Tailwind CSS configuration with typography plugin
- `postcss.config.js` - PostCSS configuration
- `app/globals.css` - Global styles with Tailwind directives
- `app/layout.tsx` - Updated with Footer component and Turkish metadata

## 🚀 How to Run

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Make sure your `.env.local` is configured** with Google OAuth credentials

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Visit** http://localhost:3000

## 🎨 Design Features

### Color Scheme
- **Background**: Dark gradient (slate-900 to slate-800)
- **Primary**: Blue-600 to Purple-600 gradient
- **Text**: White and slate-300/400
- **Accents**: Blue, purple, and green for features

### Typography
- **Headings**: Bold, large, white
- **Body**: Slate-300/400 for readability
- **Links**: Blue-400 with hover effects

### Components
- **Cards**: Semi-transparent slate-800 with backdrop blur
- **Buttons**: Gradient with hover scale effects
- **Borders**: Subtle slate-700 borders
- **Shadows**: Layered shadows for depth

## 📝 Markdown Rendering

The legal pages use `react-markdown` with custom component styling:
- Headers styled with proper hierarchy
- Lists with bullet points
- Links with blue accent color
- Code blocks with dark background
- Proper spacing and line height

## 🌐 Turkish Language

All user-facing text is in Turkish:
- **Ana Sayfa**: Home page
- **Giriş Yap**: Sign in
- **Çıkış Yap**: Sign out
- **Gizlilik Politikası**: Privacy Policy
- **Hizmet Şartları**: Terms of Service
- **Takvime Aktar**: Export to Calendar

## 🔧 Troubleshooting

### If Tailwind classes are not working:
1. Ensure you ran `npm install` to install all dependencies
2. Check that `tailwind.config.ts` exists
3. Verify `app/globals.css` has the `@tailwind` directives
4. Restart the dev server

### If markdown pages show errors:
1. Ensure `privacy_policy.md` and `terms_of_service.md` exist in the root directory
2. Install `react-markdown`: `npm install react-markdown`
3. Check file paths in the page components

### If PowerShell blocks npm commands:
1. Open **Command Prompt (cmd)** instead
2. Or use **Git Bash**
3. Or run: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` in PowerShell (admin)

## 📱 Responsive Design

All pages are fully responsive:
- **Mobile**: Stacked layout, smaller text
- **Tablet**: Medium spacing and font sizes
- **Desktop**: Full layout with grid columns

## 🎯 Next Steps

1. Install dependencies
2. Test all pages
3. Customize the markdown content in `privacy_policy.md` and `terms_of_service.md`
4. Add actual logo/branding if needed
5. Create dashboard page for authenticated users
6. Implement calendar integration logic

## 📚 Additional Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind Typography Plugin](https://tailwindcss.com/docs/typography-plugin)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [Next.js App Router](https://nextjs.org/docs/app)
