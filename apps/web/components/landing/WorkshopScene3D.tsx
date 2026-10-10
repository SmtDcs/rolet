"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { C } from "./theme";

/*
 * Ambient 3D workshop behind the landing (style guide v1.2: Soot, oiled wood,
 * Gunmetal, Brass hub, sodium practical light only).
 *
 * Hero asset: /art/landing/workshop-hq.glb (Meshy image-to-3D, PBR textured
 * battered workbench + 8-chamber steel cylinder + brass hub). Procedural
 * bench/cylinder removed; only lamp, dust and back wall stay procedural.
 *
 * Perf budget:
 *  - One GLB (~30k tris, 2k textures), no shadows, no postprocessing.
 *  - HD pass: dpr up to 2 (native), MSAA on, smooth (non-pixelated) upscale.
 *  - PerformanceMonitor steps dpr down to 1 on slow GPUs, never below.
 *  - One flickering pointLight + hemisphere/rim fill.
 *  - prefers-reduced-motion: frameloop "demand" → a single static frame.
 */

const MODEL_URL = "/art/landing/workshop-hq.glb";
const SODIUM = new THREE.Color(C.sodium);

function targetDpr() {
  if (typeof window === "undefined") return 1;
  const native = window.devicePixelRatio || 1;
  // HD: at least 1.5 for crisp edges, up to 2 on hi-dpi screens.
  return Math.min(2, Math.max(1.5, native));
}

/** Sodium lamp: steady hum + rare electrical dropouts. */
function Lamp() {
  const light = useRef<THREE.PointLight>(null);
  const bulb = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const rig = useRef<THREE.Group>(null);
  const flicker = useRef({ next: 2.5, until: 0, level: 1, nextToggle: 0 });

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const f = flicker.current;
    let k = 1 + 0.05 * Math.sin(t * 11.3) + 0.03 * Math.sin(t * 27.1 + 1.7);

    if (t >= f.next && f.until === 0) {
      f.until = t + 0.18 + Math.random() * 0.35; // burst length
      f.nextToggle = t;
    }
    if (f.until > 0) {
      if (t >= f.nextToggle) {
        f.level = Math.random() < 0.5 ? 0.12 + Math.random() * 0.25 : 0.7 + Math.random() * 0.3;
        f.nextToggle = t + 0.035 + Math.random() * 0.06;
      }
      k *= f.level;
      if (t >= f.until) {
        f.until = 0;
        f.level = 1;
        f.next = t + 2.5 + Math.random() * 5.5;
      }
    }

    if (light.current) light.current.intensity = 30 * k;
    if (bulb.current) bulb.current.color.copy(SODIUM).multiplyScalar(0.6 + 0.9 * k);
    if (glow.current) glow.current.opacity = 0.16 * k;
    if (rig.current) rig.current.rotation.z = Math.sin(t * 0.55) * 0.035; // slow pendulum
  });

  return (
    <group ref={rig} position={[0.2, 4.6, -0.1]}>
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1.8, 4]} />
        <meshBasicMaterial color="#0c0c0c" />
      </mesh>
      <mesh position={[0, -1.95, 0]}>
        <coneGeometry args={[0.38, 0.3, 16, 1, true]} />
        <meshLambertMaterial color={C.gunmetal} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -2.12, 0]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshBasicMaterial ref={bulb} color={C.sodium} toneMapped={false} />
      </mesh>
      <mesh position={[0, -2.2, 0.05]}>
        <circleGeometry args={[0.9, 24]} />
        <meshBasicMaterial
          ref={glow}
          color={C.sodium}
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight ref={light} position={[0, -2.25, 0]} color={C.sodium} intensity={30} distance={10} decay={1.5} />
    </group>
  );
}

/**
 * Meshy HQ workbench. Normalised at load: longest side → `width` units,
 * centred on X/Z, feet on y=0 (then offset by the parent group).
 */
function WorkshopModel({ width = 3.8 }: { width?: number }) {
  const { scene } = useGLTF(MODEL_URL);

  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = false;
      m.receiveShadow = false;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        const s = mat as THREE.MeshStandardMaterial;
        if (s.map) s.map.anisotropy = 8;
        // keep metal readable without an env map
        if (s.metalness !== undefined) s.metalness = Math.min(s.metalness, 0.6);
      }
    });
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const k = width / Math.max(size.x, size.z, 1e-3);
    root.scale.setScalar(k);
    root.position.set(-center.x * k, -box.min.y * k, -center.z * k);
    const wrap = new THREE.Group();
    wrap.add(root);
    return wrap;
  }, [scene, width]);

  // Framing tuned via headless renders: 3/4 view, bored chamber face toward
  // camera, bench left of the hero copy, legs fading into Soot.
  return (
    <group position={[0.5, -1.25, 0]} rotation={[0, 1.1, 0]}>
      <primitive object={model} />
    </group>
  );
}

function BackWall() {
  return (
    <mesh position={[0, 0, -3.2]}>
      <planeGeometry args={[18, 16]} />
      <meshLambertMaterial color={C.gunmetal} />
    </mesh>
  );
}

/** Slow dust in the lamp cone. One draw call. */
function Dust({ still }: { still: boolean }) {
  const pts = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 160;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt(Math.random()) * 1.6;
      const a = Math.random() * Math.PI * 2;
      p[i * 3] = Math.cos(a) * r;
      p[i * 3 + 1] = -0.5 + Math.random() * 2.6;
      p[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(({ clock }) => {
    if (!pts.current || still) return;
    const t = clock.getElapsedTime();
    pts.current.rotation.y = t * 0.03;
    pts.current.position.y = Math.sin(t * 0.2) * 0.08;
  });

  return (
    <points ref={pts} geometry={geo}>
      <pointsMaterial
        color={C.sodium}
        size={0.022}
        sizeAttenuation
        transparent
        opacity={0.45}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Very slow handheld drift + light pointer parallax + scroll dolly. */
function CameraRig({ still }: { still: boolean }) {
  const { camera, size } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const cur = useRef({ px: 0, py: 0 });

  // Hero copy sits on the right on desktop → push the bench left.
  const wide = size.width / Math.max(size.height, 1) > 1.1;
  const offsetX = wide ? 0.95 : 0;

  useEffect(() => {
    camera.position.set(offsetX, 1.35, 4.6);
    look.set(offsetX, -0.35, 0);
    camera.lookAt(look);
  }, [camera, look, offsetX]);

  useFrame(({ clock, pointer }, dt) => {
    if (still) return;
    const t = clock.getElapsedTime();
    const d = Math.min(dt, 0.05);
    const c = cur.current;
    c.px = THREE.MathUtils.damp(c.px, pointer.x, 1.5, d);
    c.py = THREE.MathUtils.damp(c.py, pointer.y, 1.5, d);

    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const p = Math.min(Math.max(window.scrollY / max, 0), 1);

    camera.position.set(
      offsetX + Math.sin(t * 0.13) * 0.16 + c.px * 0.18,
      1.35 + Math.sin(t * 0.17 + 1.3) * 0.05 + c.py * 0.08 - p * 0.45,
      4.6 + Math.sin(t * 0.09) * 0.08 - p * 1.5,
    );
    look.set(offsetX * (1 - p * 0.6), -0.35 - p * 0.1, 0);
    camera.lookAt(look);
  });
  return null;
}

export default function WorkshopScene3D({ onReady }: { onReady?: () => void }) {
  const [still] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [dpr, setDpr] = useState(targetDpr);

  return (
    <Canvas
      frameloop={still ? "demand" : "always"}
      dpr={dpr}
      shadows={false}
      camera={{ fov: 38, near: 0.1, far: 30, position: [0.95, 1.35, 4.6] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1, +(d - 0.25).toFixed(2)))}
        flipflops={3}
        onFallback={() => setDpr(1)}
      />
      <color attach="background" args={[C.soot]} />
      <fog attach="fog" args={[C.soot, 5, 12]} />
      <hemisphereLight args={["#5A606A", C.soot, 0.9]} />
      {/* cool rim from behind so the silhouette separates from the wall */}
      <directionalLight position={[-3, 2.5, -3]} intensity={0.6} color="#6B7480" />
      {/* faint warm key so PBR wood/brass read even during lamp dropouts */}
      <directionalLight position={[2, 3, 3]} intensity={0.35} color={C.sodium} />
      <Lamp />
      <BackWall />
      <Suspense fallback={null}>
        <WorkshopModel />
        <ReadySignal onReady={onReady} />
      </Suspense>
      <Dust still={still} />
      <CameraRig still={still} />
    </Canvas>
  );
}

/** Fires once the GLB has resolved (inside Suspense), so the poster only fades when the model is visible. */
function ReadySignal({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => onReady?.());
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  return null;
}

useGLTF.preload(MODEL_URL);
