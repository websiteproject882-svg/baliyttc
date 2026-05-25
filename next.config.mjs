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
    const securityHeaders = [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
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
  // Exclude seed file from build
  webpack: (config) => {
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
