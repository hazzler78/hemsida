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
    if (!isServer || isCloudflareBuild) {
      // Add module rules to handle Playwright assets before they cause errors
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      
      // Rule to return empty module for all files from playwright directories in client builds
      // Place this FIRST in the rules array so it catches Playwright files before other rules
      config.module.rules.unshift({
        test: /\.(ttf|woff|woff2|eot|otf|png|jpg|jpeg|gif|svg|ico|css|json|js|ts|tsx|mjs|cjs)$/,
        include: [
          /node_modules[\\/]playwright/,
          /node_modules[\\/]chromium-bidi/,
        ],
        use: {
          loader: 'ignore-loader',
        },
      });
      
      // Ignore all Playwright-related modules, assets, and dependencies
      config.plugins.push(
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
        // Ignore ALL files from playwright directories (catch-all)
        new webpack.IgnorePlugin({
          checkResource(resource: string) {
            // Ignore everything from playwright
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
