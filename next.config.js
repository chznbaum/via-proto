/** @type {import('next').NextConfig} */
const { withPayload } = require('@payloadcms/next/withPayload')

// CDN configuration - assetPrefix is baked in at build time
const cdnUrl = process.env.CDN_URL;

// Security Headers
const securityHeaders = [
  // HSTS - Force HTTPS connections
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // Prevent MIME-type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions Policy (formerly Feature-Policy)
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

// Content Security Policy
// Environment-aware: allows localhost in development, production domains in prod
const isDev = process.env.NODE_ENV === 'development';

// CDN domains for CSP (BunnyCDN custom domains)
const cdnDomains = 'https://cdn.viapro.to https://cdn-dev.viapro.to';

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' ${cdnDomains} https://client.crisp.chat https://*.crisp.chat https://swetrix.org https://cdn.jsdelivr.net https://js.stripe.com https://accounts.google.com;
  style-src 'self' 'unsafe-inline' ${cdnDomains} https://client.crisp.chat https://*.crisp.chat https://fonts.googleapis.com;
  img-src 'self' blob: data: https: ${cdnDomains} https://*.crisp.chat https://client.crisp.chat https://image.crisp.chat https://api.analytics.chazona.dev https://s3.nl-ams.scw.cloud https://viaproto-prod.s3.nl-ams.scw.cloud https://viaproto-dev.s3.nl-ams.scw.cloud;
  font-src 'self' ${cdnDomains} https://client.crisp.chat https://*.crisp.chat https://fonts.gstatic.com;
  connect-src 'self' ${isDev ? 'http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*' : ''} https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.openrouter.ai https://*.crisp.chat wss://*.crisp.chat https://client.relay.crisp.chat wss://client.relay.crisp.chat https://swetrix.org https://api.swetrix.com https://api.analytics.chazona.dev https://js.stripe.com https://api.stripe.com https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com https://unsplash.com https://images.unsplash.com https://api.unsplash.com https://pixabay.com https://cdn.pixabay.com https://www.pexels.com https://images.pexels.com;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com https://*.crisp.chat;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://accounts.google.com;
  frame-ancestors 'self';
  ${isDev ? '' : 'upgrade-insecure-requests;'}
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // CDN asset prefix - only applied when CDN_URL is set (production/staging builds)
  assetPrefix: isDev ? undefined : cdnUrl,
  eslint: {
    // WARNING: This allows production builds to successfully complete even if
    // your project has ESLint errors. Remove this after fixing lint errors!
    ignoreDuringBuilds: true,
  },
  typescript: {
    // WARNING: Dangerously allow production builds even if type errors exist
    // Remove this after fixing TypeScript errors!
    ignoreBuildErrors: true,
  },
  images: {
    // Disable Next.js image optimization - BunnyCDN handles optimization
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'logos-world.net',
      },
      // Scaleway S3 buckets for Payload CMS uploads
      {
        protocol: 'https',
        hostname: 's3.nl-ams.scw.cloud',
      },
      {
        protocol: 'https',
        hostname: 'viaproto-prod.s3.nl-ams.scw.cloud',
      },
      {
        protocol: 'https',
        hostname: 'viaproto-dev.s3.nl-ams.scw.cloud',
      },
      // BunnyCDN (already in CSP but good to be explicit)
      {
        protocol: 'https',
        hostname: 'cdn.viapro.to',
      },
      {
        protocol: 'https',
        hostname: 'cdn-dev.viapro.to',
      },
    ],
  },
  webpack: (config, { webpack, isServer }) => {
    // Ignore MongoDB's optional dependencies to prevent build warnings
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(kerberos|@mongodb-js\/zstd|@aws-sdk\/credential-providers|gcp-metadata|snappy|socks|aws4|mongodb-client-encryption)$/,
        })
      );
    }

    return config;
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          ...securityHeaders,
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
      {
        // Long cache headers for static assets (served from CDN in production)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = withPayload(nextConfig);
