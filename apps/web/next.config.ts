import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The public door is a Cloudflare quick tunnel onto this dev server.
  // Without this, Next blocks /_next/webpack-hmr and the page never hydrates.
  allowedDevOrigins: ["*.trycloudflare.com", "127.0.0.1"],
  devIndicators: false,
  images: {
    // Landing art uses quality={90} (HD pass); Next 16 only allows listed qualities.
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    resolveAlias: {
      // mpl-core 0.4.6 does require("@noble/hashes/sha3") with no extension.
      // @noble/hashes 2.x ships an exports map that rejects that specifier, so
      // the character-mint path fails to build whenever the tree resolves the
      // 2.x copy for mpl-core. Point the bare specifier at the real file.
      "@noble/hashes/sha3": "@noble/hashes/sha3.js",
    },
  },
};

export default nextConfig;
