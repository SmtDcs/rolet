"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { C } from "./theme";

/*
 * Landing world: the art-director-locked still (cabinet, half a revolver in
 * the gap, shells on the near lip) as one feathered plate. Sodium flicker is
 * an additive pass on the cabinet mouth. No GLB — the previous cylinder mesh
 * and the broken full-room mesh stay out of this scene.
 *
 * Perf: one 1024 texture, two unlit planes, no shadows, no postprocessing.
 * dpr caps at 1.5 and steps down to 1. prefers-reduced-motion draws one frame.
 */

const PLATE_URL = "/art/landing/workshop-locked.webp";
const DIST = 6.4;
const SODIUM = new THREE.Color(C.sodium);

function targetDpr() {
  if (typeof window === "undefined") return 1;
  return Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
}

function viewSize(fov: number, aspect: number) {
  const h = 2 * Math.tan((fov * Math.PI) / 360) * DIST;
  return { h, w: h * aspect };
}

/** Soft sodium discs aligned to the locked plate (mouth + wood spill). */
function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  if (!g) return new THREE.Texture();
  const blot = (x: number, y: number, inner: number, outer: number, alpha: number) => {
    const grd = g.createRadialGradient(x, y, inner, x, y, outer);
    grd.addColorStop(0, `rgba(217,150,58,${alpha})`);
    grd.addColorStop(1, "rgba(217,150,58,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 512);
  };
  // Cabinet mouth sits just above the middle of the still; spill hits the lip.
  blot(236, 300, 6, 78, 0.9);
  blot(250, 390, 4, 120, 0.4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function flickerAt(t: number, state: { next: number; until: number; level: number; nextToggle: number }) {
  let k = 1 + 0.045 * Math.sin(t * 11.3) + 0.025 * Math.sin(t * 27.1 + 1.7);
  if (t >= state.next && state.until === 0) {
    state.until = t + 0.16 + Math.random() * 0.28;
    state.nextToggle = t;
  }
  if (state.until > 0) {
    if (t >= state.nextToggle) {
      state.level = Math.random() < 0.45 ? 0.35 + Math.random() * 0.2 : 0.85 + Math.random() * 0.2;
      state.nextToggle = t + 0.04 + Math.random() * 0.05;
    }
    k *= state.level;
    if (t >= state.until) {
      state.until = 0;
      state.level = 1;
      state.next = t + 2.8 + Math.random() * 5;
    }
  }
  return k;
}

function LockedPlate({ still }: { still: boolean }) {
  const plate = useTexture(PLATE_URL);
  const glow = useMemo(() => makeGlowTexture(), []);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const flicker = useRef({ next: 2.2, until: 0, level: 1, nextToggle: 0 });
  const { size, camera } = useThree();

  useEffect(() => {
    plate.colorSpace = THREE.SRGBColorSpace;
    plate.anisotropy = 4;
    plate.needsUpdate = true;
    return () => glow.dispose();
  }, [plate, glow]);

  const wide = size.width / Math.max(size.height, 1) > 1.05;
  const { h, w } = viewSize((camera as THREE.PerspectiveCamera).fov, size.width / Math.max(size.height, 1));
  const side = h * (wide ? 1.04 : 1.12);
  const x = wide ? -w * 0.2 : 0;

  useFrame(({ clock }) => {
    if (still || !glowMat.current) return;
    const k = flickerAt(clock.getElapsedTime(), flicker.current);
    glowMat.current.opacity = 0.55 * k;
    glowMat.current.color.copy(SODIUM);
  });

  return (
    <group position={[x, 0, 0]}>
      <mesh>
        <planeGeometry args={[side, side]} />
        <meshBasicMaterial map={plate} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[side, side]} />
        <meshBasicMaterial
          ref={glowMat}
          map={glow}
          color={C.sodium}
          transparent
          opacity={0.55}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** Slow drift. The plate already fills the frame, so the move stays small. */
function CameraRig({ still }: { still: boolean }) {
  const { camera } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const cur = useRef({ px: 0, py: 0 });

  useEffect(() => {
    camera.position.set(0, 0, DIST);
    look.set(0, 0, 0);
    camera.lookAt(look);
  }, [camera, look]);

  useFrame(({ clock, pointer }, dt) => {
    if (still) return;
    const t = clock.getElapsedTime();
    const d = Math.min(dt, 0.05);
    const c = cur.current;
    c.px = THREE.MathUtils.damp(c.px, pointer.x, 1.4, d);
    c.py = THREE.MathUtils.damp(c.py, pointer.y, 1.4, d);
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const p = Math.min(Math.max(window.scrollY / max, 0), 1);
    camera.position.set(
      Math.sin(t * 0.12) * 0.05 + c.px * 0.08,
      Math.sin(t * 0.15) * 0.03 + c.py * 0.04 + p * 0.12,
      DIST,
    );
    camera.lookAt(look);
  });
  return null;
}

export default function WorkshopScene3D({ onReady }: { onReady?: () => void }) {
  const [still] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [covered, setCovered] = useState(false);
  const [dpr, setDpr] = useState(targetDpr);

  useEffect(() => {
    const onScroll = () => setCovered(window.scrollY > window.innerHeight * 0.92);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Canvas
      frameloop={still || covered ? "demand" : "always"}
      dpr={dpr}
      shadows={false}
      camera={{ fov: 38, near: 0.1, far: 20, position: [0, 0, DIST] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.NoToneMapping;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, +(d - 0.25).toFixed(2)))}
        flipflops={3}
        onFallback={() => setDpr(1)}
      />
      <Suspense fallback={null}>
        <LockedPlate still={still} />
        <ReadySignal onReady={onReady} />
      </Suspense>
      <CameraRig still={still} />
    </Canvas>
  );
}

function ReadySignal({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => onReady?.());
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  return null;
}

useTexture.preload(PLATE_URL);
