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
    
    // Ignore Playwright completely in client builds - it's only used server-side in API routes
    if (!isServer) {
      // Add module rules to handle Playwright assets before they cause errors
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      
      // Rule to return empty module for all files from playwright directories in client builds
      // Place this FIRST in the rules array so it catches Playwright files before other rules
      config.module.rules.unshift({
        test: /\.(ttf|woff|woff2|eot|otf|png|jpg|jpeg|gif|svg|ico|css|json|js|ts|tsx|mjs|cjs)$/,
        include: /node_modules[\\/]playwright/,
        use: {
          loader: 'ignore-loader',
        },
      });
      
      // Ignore all Playwright-related modules, assets, and dependencies in client builds
      config.plugins.push(
        // Ignore Node.js built-in modules and electron when imported from Playwright
        new webpack.IgnorePlugin({
          resourceRegExp: /^(fs|path|child_process|crypto|http2|stream|util|os|net|tls|dns|url|http|https|zlib|events|buffer|electron)$/,
          contextRegExp: /playwright/,
        }),
        // Ignore electron module completely in client builds
        new webpack.IgnorePlugin({
          resourceRegExp: /^electron$/,
        }),
        // Ignore ALL files from playwright directories in client builds (catch-all)
        new webpack.IgnorePlugin({
          checkResource(resource: string) {
            // Ignore everything from playwright in client builds
            if (/node_modules[\\/]playwright/.test(resource)) {
              return true;
            }
            return false;
          },
        })
      );
      
      // Mark Playwright and electron as external to prevent bundling in client
      config.resolve.alias = {
        ...config.resolve.alias,
        playwright: false,
        'playwright-core': false,
        electron: false,
      };
      
      // Add fallback for Playwright modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        playwright: false,
        'playwright-core': false,
        electron: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
