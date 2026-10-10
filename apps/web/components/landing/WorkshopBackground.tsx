"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// three/R3F only loads on the client and never blocks first paint.
const WorkshopScene3D = dynamic(() => import("./WorkshopScene3D"), { ssr: false });

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/**
 * Fixed full-viewport world layer behind the whole landing.
 * The v3 table plate is the poster (LCP + no-WebGL fallback); the live canvas
 * fades in over it once the first frame is ready.
 */
export function WorkshopBackground() {
  const [ready, setReady] = useState(false);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#141414]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/art/landing/workshop-table-v3-hd.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[18%_62%] transition-opacity duration-700 sm:object-[35%_60%]"
        style={{ opacity: ready ? 0 : 1 }}
      />
      <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: ready ? 1 : 0 }}>
        <WorkshopScene3D onReady={() => setReady(true)} />
      </div>
      {/* Soot vignette — static layer, composited once */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 40% 50%, rgba(20,20,20,0) 40%, rgba(20,20,20,0.55) 80%, rgba(20,20,20,0.9) 100%)",
        }}
      />
      {/* Grain: very faint, world layer only; masked out of the top (nav + hero copy stay clean). */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: GRAIN,
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 35%, #000 75%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, transparent 35%, #000 75%)",
        }}
      />
    </div>
  );
}
