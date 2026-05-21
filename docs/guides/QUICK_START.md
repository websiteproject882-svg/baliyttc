# Balieytc - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. **Install Dependencies**
```bash
cd balieytc
npm install
```

### 2. **Start Development Server**
```bash
npm run dev
```
Visit `http://localhost:3000` in your browser.

### 3. **Edit Content**
Edit course details, teacher info, and testimonials in:
```
src/data/site.ts
```

### 4. **Customize Design**
Main brand color is **Amber** (#d97706). Update colors in components:
```
src/components/home/
src/components/layout/
```

### 5. **Build for Production**
```bash
npm run build
npm run start
```

---

## 📁 Key Files

| File | Purpose | Edit For |
|------|---------|----------|
| `src/data/site.ts` | All site content | Courses, Teachers, FAQs, Prices |
| `src/app/layout.tsx` | Meta tags & SEO | Page titles, descriptions |
| `src/components/layout/Nav.tsx` | Header & Navigation | Logo, menu items, colors |
| `src/components/layout/Footer.tsx` | Footer | Contact info, social links |
| `src/components/home/Hero.tsx` | Hero section | Main headline, CTA text |
| `src/app/robots.ts` | SEO configuration | Search engine rules |
| `src/app/sitemap.ts` | XML sitemap | Page URLs for search engines |

---

## 🎨 Color Customization

### Current Branding (Amber)
```css
Primary:    #d97706 (bg-amber-600)
Light:      #fcd34d (text-amber-300)
Deep:       #b45309 (text-amber-700)
```

### To Change Colors Globally:
1. Find all `bg-amber-600` → replace with your color
2. Find all `text-amber-600` → replace with your color
3. Find all `border-amber-500` → replace with your color
4. Update theme-color in `src/app/layout.tsx`

---

## 📝 Content Updates

### Update Courses
Edit `src/data/site.ts` - COURSES array:
```typescript
{
  slug: "100hr",
  title: "100-Hour Yoga Teacher Training",
  priceFrom: 999,
  // ... more fields
}
```

### Update Teachers
Edit `src/data/site.ts` - TEACHERS array:
```typescript
{
  name: "Your Name",
  cred: "Credentials",
  role: "Your Role",
  bio: "Your bio...",
  style: ["Yoga Style 1", "Style 2"],
}
```

### Update Contact Info
Edit `src/data/site.ts` - SITE object:
```typescript
export const SITE = {
  name: "Balieytc",
  email: "hello@balieytc.com",
  phone: "+62 819-1234-5678",
  whatsapp: "6281912345678",
  // ...
}
```

### Update FAQ
Edit `src/data/site.ts` - FAQS array:
```typescript
{
  q: "Your question?",
  a: "Your answer here..."
}
```

---

## 🔍 SEO Essentials

### Meta Tags
Edit `src/app/layout.tsx`:
- `<title>` - Page title (60 chars max)
- `<meta name="description">` - Page description (160 chars max)

### Sitemap
Auto-generated in `src/app/sitemap.ts` - Update URLs manually if changing routes.

### Robots.txt
Edit `src/app/robots.ts` to control search engine crawling.

---

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
1. Push to GitHub
2. Connect repo to Netlify
3. Auto-deploys on push

### Traditional Node Hosting
```bash
npm run build
# Run the Next.js server with npm run start
```

---

## 🐛 Troubleshooting

### Dependencies Error
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
```bash
npm run dev -- --port 3000
```

### Images Not Loading
Check image URLs in `src/data/site.ts` - IMG object

### Styling Issues
1. Clear browser cache (Ctrl+Shift+Delete)
2. Rebuild: `npm run build`
3. Check for CSS conflicts in components

---

## 📚 Learn More

- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion)
- [Next.js Docs](https://nextjs.org/docs)

---

## ✅ Pre-Launch Checklist

Before going live:
- [ ] Update all contact information
- [ ] Test all forms (submission, email notification)
- [ ] Verify all course prices and dates
- [ ] Check all images load correctly
- [ ] Test on mobile devices
- [ ] Verify meta tags in browser DevTools
- [ ] Check links (internal and external)
- [ ] Test WhatsApp link
- [ ] Set up Google Analytics
- [ ] Configure email notifications

---

## 💡 Quick Tips

1. **Hot Reload**: Saves automatically while `npm run dev` runs
2. **CSS Updates**: Tailwind classes apply instantly
3. **Content Changes**: Refresh browser to see updates
4. **Navigation**: Edit in `src/data/site.ts` - NAV array
5. **Component Colors**: Search for old color name, replace globally
6. **Add New Page**: 
   - Create file in `src/views/`
   - Add route in `src/app/[locale]/<route>/page.tsx`
   - Add nav link in `src/data/site.ts`

---

## 🆘 Need Help?

- Check docs/project/TRANSFORMATION_CHANGELOG.md for detailed changes
- Review README.md for project overview
- Check component files for implementation details
- Visit component files to understand structure

---

**Happy coding! Transform your yoga vision into reality.** 🧘‍♀️✨
