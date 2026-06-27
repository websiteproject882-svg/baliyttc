import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'ml4wp2nfx5ts.i.optimole.com' },
    ],
  },
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://firebasestorage.googleapis.com https://www.googletagmanager.com https://checkout.razorpay.com https://www.paypal.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' blob: data: https://images.unsplash.com https://firebasestorage.googleapis.com https://ml4wp2nfx5ts.i.optimole.com https://api.baliyttc.com https://res.cloudinary.com https://www.paypalobjects.com;
      font-src 'self' data: https://fonts.gstatic.com;
      connect-src 'self' https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.baliyttc.com https://api-m.sandbox.paypal.com https://api-m.paypal.com;
      frame-src 'self' https://www.youtube.com https://player.vimeo.com https://www.google.com https://checkout.razorpay.com https://www.sandbox.paypal.com https://www.paypal.com;
      media-src 'self' https://res.cloudinary.com;
    `.replace(/\s{2,}/g, ' ').trim();

    const securityHeaders = [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Content-Security-Policy', value: cspHeader },
    ];

    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }

    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          { key: 'X-Robots-Tag', value: 'index, follow' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      ...['admin', 'app', 'staff', 'login', 'payment'].flatMap((privatePath) => [
        {
          source: `/${privatePath}/:path*`,
          headers: [
            ...securityHeaders,
            { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          ],
        },
        {
          source: `/:locale/${privatePath}/:path*`,
          headers: [
            ...securityHeaders,
            { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          ],
        },
      ]),
    ];
  },
  async redirects() {
    return [
      // 1. Blog Post Redirects
      {
        source: '/yoga-teacher-certification-guide-what-ryt-200-ryt-500-e-ryt-rcyt-and-rpyt-really-mean',
        destination: '/en/blog/yoga-teacher-certification-guide-ryt-200-ryt-500-e-ryt-rcyt-rpyt',
        permanent: true,
      },
      {
        source: '/yoga-teacher-training-in-bali-master-teaching-with-bali-yttc',
        destination: '/en/blog/yoga-teacher-training-in-bali-master-teaching-with-yoga',
        permanent: true,
      },
      {
        source: '/your-complete-beginner-yoga-guide-to-confident-practice',
        destination: '/en/blog/complete-beginner-yoga-guide-confident-practice',
        permanent: true,
      },
      {
        source: '/morning-vs-evening-yoga-which-time-is-best-for-your-practice',
        destination: '/en/blog/morning-vs-evening-yoga-best-time-for-practice',
        permanent: true,
      },
      {
        source: '/bali-visa-guide-for-yoga-teacher-training-students',
        destination: '/en/blog/bali-visa-guide-for-yoga-teacher-training-students',
        permanent: true,
      },
      // 2. Course Page Redirects
      {
        source: '/100-hour-ytt-in-bali',
        destination: '/en/courses/100hr',
        permanent: true,
      },
      {
        source: '/200-hour-ytt-in-bali',
        destination: '/en/courses/200hr',
        permanent: true,
      },
      {
        source: '/300-hour-ytt-in-bali',
        destination: '/en/courses/300hr',
        permanent: true,
      },
      {
        source: '/50-hour-hatha-yoga-teacher-training-in-bali',
        destination: '/en/courses/50hr',
        permanent: true,
      },
      // 3. Marketing Pages Redirects
      {
        source: '/about-us',
        destination: '/en/about',
        permanent: true,
      },
      {
        source: '/contact-us',
        destination: '/en/contact',
        permanent: true,
      },
    ];
  },
  // Exclude seed file from build
  webpack: (config) => {
    config.cache = false;
    config.externals = config.externals || [];
    return config;
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  telemetry: false,
});
