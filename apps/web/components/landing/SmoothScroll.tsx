"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Landing-only smooth scroll. One loop: GSAP's ticker drives Lenis
 * (autoRaf: false), and every Lenis scroll pushes ScrollTrigger.update, so the
 * scrubbed story samples the same scroll value on the same frame. Lenis is the
 * only smoothing layer (story scrub is direct). Touch keeps native momentum
 * scrolling. Skipped entirely when the user prefers reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Mobile URL-bar show/hide resizes the viewport constantly; don't recompute
    // every trigger for it (avoids a refresh hitch mid-scroll).
    ScrollTrigger.config({ ignoreMobileResize: true });

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.12,
      wheelMultiplier: 0.9,
      anchors: { offset: -56 },
    });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Late fonts/images can shift layout once; re-measure triggers after load.
    const onLoad = () => ScrollTrigger.refresh();
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      window.removeEventListener("load", onLoad);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return null;
}
