import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  async redirects() {
    return [
      // Kortlänkar för sociala medier (UTM-spårning)
      { source: "/yt", destination: "/?utm_source=youtube&utm_medium=social", permanent: false },
      { source: "/fb", destination: "/?utm_source=facebook&utm_medium=social", permanent: false },
      { source: "/ig", destination: "/?utm_source=instagram&utm_medium=social", permanent: false },
      { source: "/tt", destination: "/?utm_source=tiktok&utm_medium=social", permanent: false },
      { source: "/pin", destination: "/?utm_source=pinterest&utm_medium=social", permanent: false },
      { source: "/x", destination: "/?utm_source=x&utm_medium=social", permanent: false },
      { source: "/in", destination: "/?utm_source=linkedin&utm_medium=social", permanent: false },
      { source: "/snap", destination: "/?utm_source=snapchat&utm_medium=social", permanent: false },
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
      // Use a single, specific IgnorePlugin that only targets Playwright directories
      // This avoids interfering with Next.js internal modules
      config.plugins.push(
        new webpack.IgnorePlugin({
          checkResource(resource: string) {
            // Only ignore resources that are explicitly from playwright or chromium-bidi node_modules
            // Be very specific to avoid false positives with Next.js or other modules
            const playwrightMatch = /node_modules[\\/](playwright|chromium-bidi)/.test(resource);
            return playwrightMatch;
          },
        }),
        // Ignore Node.js built-in modules ONLY when imported from Playwright context
        new webpack.IgnorePlugin({
          resourceRegExp: /^(fs|path|child_process|crypto|http2|stream|util|os|net|tls|dns|url|http|https|zlib|events|buffer|electron)$/,
          contextRegExp: /[\\/](playwright|chromium-bidi)[\\/]/,
        }),
        // Ignore electron module when imported from Playwright context
        new webpack.IgnorePlugin({
          resourceRegExp: /^electron$/,
          contextRegExp: /[\\/](playwright|chromium-bidi)[\\/]/,
        })
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
