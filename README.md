# Balieytc - Premium Yoga & Wellness Center

A modern, high-performance website for Balieytc, a premier yoga and wellness center in Ubud, Bali. This site features professional yoga teacher trainings, wellness retreats, and meditation programs.

## Features

âœ¨ **Modern Design**
- Responsive, mobile-first design
- Smooth animations and transitions
- Professional color scheme (Amber/Orange accent colors)
- High-performance image optimization

ðŸ§˜ **Yoga Training Programs**
- 100-Hour Yoga Intensive
- 200-Hour Teacher Training (Most Popular)
- 300-Hour Advanced Training
- Detailed course information with pricing and schedules

ðŸŒ **Yoga Alliance Certified**
- RYS (Registered Yoga School) certified programs
- Internationally recognized certifications
- Authentic, multi-style yoga training

ðŸ“± **Responsive Navigation**
- Hamburger menu for mobile devices
- Dropdown navigation for courses
- Sticky header with scroll animations
- WhatsApp integration for quick contact

ðŸ’¼ **Advanced Features**
- Application modal with multi-step form
- Course scheduling and booking system
- Testimonials section from real students
- Gallery with professional imagery
- Contact integration with Google Maps
- Newsletter subscription

ðŸ” **SEO Optimized**
- Comprehensive meta tags
- Sitemap.xml for search engines
- Robots.txt configuration
- Optimized Open Graph tags
- Schema markup ready
- Mobile-friendly design
- Fast page load times with optimized images

## Technology Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS 3
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **UI Components**: Custom components with Radix UI
- **State Management**: React Query

## Project Structure

```
src/
├── app/               # Next.js routes, layouts, API handlers
├── components/
│   ├── home/          # Homepage sections (Hero, Courses, etc.)
│   ├── layout/        # Navigation, Footer, Layout
│   ├── navigation/    # Navigation link components
│   └── shared/        # Reusable components (Modal, Button, etc.)
├── views/             # Page view components (About, Courses, etc.)
├── data/              # Static data (site config, courses, teachers)
├── hooks/             # Custom React hooks
├── i18n/              # Locale routing, request config, messages
└── lib/               # Utility functions and services
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/balieytc.git
cd balieytc

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

### Update Site Information
Edit `src/data/site.ts` to update:
- Site name and branding
- Contact information
- Course details and pricing
- Teacher profiles
- Testimonials
- FAQs

### Customize Colors
The main brand color is Amber (used throughout):
- `bg-amber-600`: Primary action buttons
- `text-amber-300/400/600`: Text accents
- Update in components as needed

### Add New Pages
1. Create a new file in `src/views/`
2. Add route in `src/app/[locale]/<route>/page.tsx`
3. Add navigation link in `src/data/site.ts`

## Branding & Design

### Color Palette
- **Primary**: Amber-600 (#d97706)
- **Secondary**: Warm colors (cream, sand)
- **Dark**: Warm-dark background

### Logo
The logo uses the Om (à¥) symbol in a gradient amber/orange circle. Update in:
- `src/components/layout/Nav.tsx`
- `src/components/layout/Footer.tsx`

### Typography
- **Serif Font**: Used for headings (elegant, traditional yoga aesthetic)
- **Sans-serif**: Used for body text (modern, readable)

## SEO Improvements

âœ… Meta tags optimization
âœ… Open Graph tags for social sharing
âœ… XML Sitemap at `/sitemap.xml`
âœ… Robots.txt configuration
âœ… Mobile-responsive design
âœ… Fast loading with image optimization
âœ… Structured data ready
âœ… Internal linking strategy

## Performance Optimizations

- Lazy loading images
- Code splitting with React Router
- CSS optimization with Tailwind
- Image CDN integration ready
- Minified production builds

## Future Enhancements

- [ ] Blog/Article section for yoga tips
- [ ] Student login and progress tracking
- [ ] Payment gateway integration
- [ ] Email confirmation automation
- [ ] Video testimonials
- [ ] Instructor certification verification
- [ ] Live chat support
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Multi-language support

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
# Connect GitHub repo to Netlify
# Automatic deployments on push
```

### Traditional Hosting
```bash
npm run build
# Upload 'dist' folder to your server
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Copyright Â© 2026 Balieytc. All rights reserved.

## Contact

- **Email**: hello@balieytc.com
- **Phone**: +62 819-1234-5678
- **WhatsApp**: +62 819-1234-5678
- **Location**: Ubud, Bali, Indonesia

## Support

For support, email us at hello@balieytc.com or contact us via WhatsApp.

---

**Built with â¤ï¸ for yoga enthusiasts worldwide**
