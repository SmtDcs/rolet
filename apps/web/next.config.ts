import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next blocks cross-origin dev requests, which stops the page hydrating when
  // the dev server is reached over a tunnel or by a bare loopback address.
  allowedDevOrigins: ["*.trycloudflare.com", "127.0.0.1"],
  devIndicators: false,
  // Keep the dev server off the production build. Sharing .next between
  // `next dev` and `next start` leaves the running server pointing at chunks
  // the dev server deleted, which shows up as a black page.
  distDir: process.env.NEXT_DIST_DIR || ".next",
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
