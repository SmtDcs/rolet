"use client";

import React, { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { useSound } from "@/hooks/useSound";
import { Crosshair, Flame, RefreshCw } from "lucide-react";

// Procedural Fallback Mesh while GLTF loads
function LoadingMesh() {
  return (
    <mesh>
      <boxGeometry args={[0.8, 0.4, 0.2]} />
      <meshStandardMaterial color="#241a12" wireframe />
    </mesh>
  );
}

// ── Smoke Particle Ring (Muzzle blast effect) ────────────────────────────────
function MuzzleBlastParticles({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(0.1);
  const opacityRef = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (active) {
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 3.2, delta * 12);
      opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, 0, delta * 6);
    } else {
      scaleRef.current = 0.1;
      opacityRef.current = active ? 0.9 : 0;
    }
    meshRef.current.scale.setScalar(scaleRef.current);
  });

  return (
    <group ref={meshRef} position={[0, 0.2, -1.8]}>
      <mesh>
        <ringGeometry args={[0.08, 0.35, 16]} />
        <meshBasicMaterial
          color="#ff7a18"
          transparent
          opacity={active ? 0.8 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── The Real Meshy 3D Revolver Model with Scroll Animation ──────────────────
function AnimatedRevolver({
  scrollProgress,
  isFiring,
}: {
  scrollProgress: number;
  isFiring: boolean;
}) {
  const { scene } = useGLTF("/models/revolver_occult.glb");
  const cloned = useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const recoilRef = useRef(0);

  // Compute smooth animation state based on scrollProgress (0.0 to 1.0)
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Recoil kick decay
    if (isFiring) {
      recoilRef.current = 1.0;
    } else {
      recoilRef.current = THREE.MathUtils.lerp(recoilRef.current, 0, delta * 9);
    }
    const recoilKickRot = recoilRef.current * 0.55;
    const recoilKickZ = recoilRef.current * 0.35;

    // Mouse parallax
    const mouseX = state.pointer.x * 0.15;
    const mouseY = state.pointer.y * 0.15;

    // Multi-stage scroll choreograph:
    // Stage 0 (0.0 - 0.3): Hero beauty angle - 3/4 floating view
    // Stage 1 (0.3 - 0.65): Zoomed cylinder inspection - rotating chamber
    // Stage 2 (0.65 - 1.0): Aiming down the barrel at the camera + firing!
    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let targetRotZ = 0;
    let targetScale = 1.1;

    if (scrollProgress < 0.3) {
      // Stage 0: Hero 3/4 showcase
      const p = scrollProgress / 0.3;
      targetX = THREE.MathUtils.lerp(0.3, 0.1, p);
      targetY = THREE.MathUtils.lerp(-0.05, 0.05, p) + Math.sin(t * 1.5) * 0.02;
      targetZ = THREE.MathUtils.lerp(0, 0.4, p);
      targetRotX = THREE.MathUtils.lerp(0.12, 0.05, p) - mouseY;
      targetRotY = THREE.MathUtils.lerp(Math.PI * 0.28, Math.PI * 0.45, p) + mouseX;
      targetRotZ = THREE.MathUtils.lerp(-0.05, 0.08, p);
    } else if (scrollProgress < 0.65) {
      // Stage 1: Close inspection of 8-chamber cylinder
      const p = (scrollProgress - 0.3) / 0.35;
      targetX = THREE.MathUtils.lerp(0.1, -0.1, p);
      targetY = THREE.MathUtils.lerp(0.05, 0.1, p);
      targetZ = THREE.MathUtils.lerp(0.4, 0.8, p);
      targetScale = THREE.MathUtils.lerp(1.1, 1.45, p);
      // Spin cylinder angle
      targetRotX = THREE.MathUtils.lerp(0.05, -0.15, p);
      targetRotY = THREE.MathUtils.lerp(Math.PI * 0.45, Math.PI * 0.85, p) + t * 0.2;
      targetRotZ = THREE.MathUtils.lerp(0.08, 0.2, p);
    } else {
      // Stage 2: Aiming directly at camera / player!
      const p = (scrollProgress - 0.65) / 0.35;
      targetX = THREE.MathUtils.lerp(-0.1, 0, p);
      targetY = THREE.MathUtils.lerp(0.1, -0.15, p);
      targetZ = THREE.MathUtils.lerp(0.8, 1.3, p);
      targetScale = THREE.MathUtils.lerp(1.45, 1.3, p);
      // Point directly forward
      targetRotX = THREE.MathUtils.lerp(-0.15, 0.08, p) - recoilKickRot;
      targetRotY = THREE.MathUtils.lerp(Math.PI * 0.85, 0, p);
      targetRotZ = THREE.MathUtils.lerp(0.2, 0, p);
    }

    // Apply smooth interpolation
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 6);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 6);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ + recoilKickZ, delta * 8);

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 7);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 7);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, delta * 7);

    groupRef.current.scale.setScalar(targetScale);

    // Muzzle flash intensity
    if (flashRef.current) {
      flashRef.current.intensity = recoilRef.current > 0.4 ? 45 : 0;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={cloned} scale={0.7} />

      {/* Muzzle Flash Point Light */}
      <pointLight
        ref={flashRef}
        position={[0, 0.25, -2.1]}
        color="#ff7b00"
        intensity={0}
        distance={6}
        decay={1.8}
      />

      {/* Muzzle Particle Smoke */}
      <MuzzleBlastParticles active={isFiring} />
    </group>
  );
}

// ── Main Scroll-Driven 3D Revolver Showcase Component ───────────────────────
export function ScrollRevolverCanvas() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isFiring, setIsFiring] = useState(false);
  const sound = useSound();
  const lastShotScrollRef = useRef(0);

  // Track global scroll progression
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / totalScroll)) : 0;
      setScrollProgress(progress);

      // Auto-fire gunshot when user scrolls past 0.82 for the first time
      if (progress > 0.82 && lastShotScrollRef.current <= 0.82) {
        triggerFire();
      }
      lastShotScrollRef.current = progress;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const triggerFire = () => {
    sound.play("triggerCock");
    setTimeout(() => {
      sound.play("gunshotLive");
      setIsFiring(true);
      setTimeout(() => setIsFiring(false), 280);
    }, 120);
  };

  return (
    <div className="w-full h-[480px] sm:h-[560px] md:h-[620px] relative select-none">
      {/* Background Volumetric Glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
          isFiring ? "opacity-90 bg-radial from-[#ff4400]/25 to-transparent" : "opacity-40 bg-radial from-[#c6a15b]/10 to-transparent"
        }`}
      />

      <Canvas
        camera={{ position: [0, 0.1, 4.2], fov: 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.4} />

        {/* Warm key lantern light */}
        <pointLight position={[2.5, 3, 2]} intensity={28} color="#ffd48a" />
        {/* Cool brass rim light */}
        <pointLight position={[-3, -1, -2]} intensity={16} color="#c6a15b" />
        {/* Sinister crimson under-fill */}
        <pointLight position={[0, -2.5, 1.5]} intensity={8} color="#8c2727" />

        <Suspense fallback={<LoadingMesh />}>
          <Float speed={scrollProgress < 0.6 ? 1.5 : 0} rotationIntensity={0.15} floatIntensity={0.3}>
            <AnimatedRevolver
              scrollProgress={scrollProgress}
              isFiring={isFiring}
            />
          </Float>
        </Suspense>
      </Canvas>

      {/* Interactive Controls Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 pointer-events-auto">
        <button
          onClick={triggerFire}
          disabled={isFiring}
          className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-gradient-to-b from-[#2b1510] to-[#120806] border border-[#8c2727] hover:border-[#ff4444] text-[#ffb0a0] hover:text-[#ffffff] shadow-[0_0_20px_rgba(140,39,39,0.35)] hover:shadow-[0_0_30px_rgba(255,68,68,0.6)] font-sans text-xs uppercase tracking-widest transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Flame className="w-4 h-4 text-[#ff4422]" />
          <span>Pull Trigger (Fire)</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-[#3d2e24] text-[11px] font-mono text-[#a68e72] backdrop-blur-sm">
          <Crosshair className="w-3.5 h-3.5 text-[#c6a15b]" />
          <span>Scroll down to examine & fire</span>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload("/models/revolver_occult.glb");
