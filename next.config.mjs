import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['images.unsplash.com', 'firebasestorage.googleapis.com', 'ml4wp2nfx5ts.i.optimole.com'],
  },
  // Exclude seed file from build
  webpack: (config) => {
    config.externals = config.externals || [];
    return config;
  },
};

export default withNextIntl(nextConfig);
