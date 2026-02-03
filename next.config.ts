import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/jamfor-elpriser",
        destination: "/fakturaanalys",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "elchef.se",
          },
        ],
        destination: "https://www.elchef.se/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*.mp4",
        headers: [
          {
            key: "Content-Type",
            value: "video/mp4",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Accept-Ranges",
            value: "bytes",
          },
        ],
      },
    ];
  },
  webpack: (config, { webpack, isServer }) => {
    // Prevent webpack from bundling Playwright and its Node.js dependencies
    // Playwright requires Node.js modules that are not available in Edge Runtime
    // This allows the build to succeed, but Playwright will fail at runtime in Edge Runtime
    
    // Check if we're building for Cloudflare Pages (Edge Runtime)
    // Cloudflare Pages uses Edge Runtime which doesn't support Playwright
    const isCloudflareBuild = process.env.CF_PAGES === '1' || process.env.CF_PAGES_BRANCH !== undefined;
    
    // Ignore Playwright completely in client builds
    // Also ignore in server builds when building for Cloudflare (Edge Runtime)
    // NOTE: We use IgnorePlugin only, not module rules, to avoid interfering with Next.js CSS handling
    if (!isServer || isCloudflareBuild) {
      // Add IgnorePlugin to catch Playwright imports
      // Ignore all Playwright-related modules, assets, and dependencies
      // Use push() instead of unshift() to avoid breaking Next.js's built-in plugins
      config.plugins.push(
        // Ignore ALL files from playwright directories FIRST (most aggressive, catches everything)
        new webpack.IgnorePlugin({
          checkResource(resource: string) {
            // Ignore everything from playwright (including assets like .ttf, .woff, etc.)
            if (/node_modules[\\/]playwright/.test(resource)) {
              return true;
            }
            // Also ignore chromium-bidi
            if (/node_modules[\\/]chromium-bidi/.test(resource)) {
              return true;
            }
            return false;
          },
        }),
        // Ignore Node.js built-in modules when imported from Playwright
        new webpack.IgnorePlugin({
          resourceRegExp: /^(fs|path|child_process|crypto|http2|stream|util|os|net|tls|dns|url|http|https|zlib|events|buffer|electron)$/,
          contextRegExp: /playwright/,
        }),
        // Also ignore Node.js built-in modules globally when building for Cloudflare
        ...(isCloudflareBuild ? [
          new webpack.IgnorePlugin({
            resourceRegExp: /^(fs|path|child_process|crypto|http2|stream|util|os|net|tls|dns|url|http|https|zlib|events|buffer|electron)$/,
          }),
        ] : []),
        // Ignore electron module completely
        new webpack.IgnorePlugin({
          resourceRegExp: /^electron$/,
        }),
        // Ignore chromium-bidi (Playwright dependency) completely
        new webpack.IgnorePlugin({
          resourceRegExp: /^chromium-bidi/,
        }),
        // For Cloudflare builds, also ignore chromium-bidi imports globally
        ...(isCloudflareBuild ? [
          new webpack.IgnorePlugin({
            checkResource(resource: string) {
              return /chromium-bidi/.test(resource);
            },
          }),
        ] : []),
        // For Cloudflare builds, also ignore Playwright module imports
        ...(isCloudflareBuild ? [
          new webpack.IgnorePlugin({
            resourceRegExp: /^playwright$/,
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^playwright-core$/,
          }),
          // Ignore all Playwright-related imports in Cloudflare builds
          new webpack.IgnorePlugin({
            checkResource(resource: string) {
              // Ignore any import that references playwright or chromium-bidi
              return /playwright|chromium-bidi/.test(resource);
            },
          }),
        ] : [])
      );
      
      // Mark Playwright and electron as external to prevent bundling in client
      config.resolve.alias = {
        ...config.resolve.alias,
        playwright: false,
        'playwright-core': false,
        electron: false,
        'chromium-bidi': false,
      };
      
      // Add fallback for Playwright modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        playwright: false,
        'playwright-core': false,
        electron: false,
        'chromium-bidi': false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
