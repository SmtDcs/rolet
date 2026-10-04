"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

// Procedural high-detail antique revolver for hero preview
function RevolverMesh() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Gentle floating and responsive mouse tilt
    const mouseX = state.pointer.x * 0.4;
    const mouseY = state.pointer.y * 0.3;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, Math.PI * 0.15 + Math.sin(t * 0.6) * 0.2 + mouseX, 0.05);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.15 - mouseY, 0.05);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.sin(t * 0.4) * 0.05, 0.05);
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} scale={1.2}>
      {/* Revolver Barrel */}
      <mesh position={[1.5, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.2, 2.2, 16]} />
        <meshStandardMaterial color="#1a1410" roughness={0.35} metalness={0.9} />
      </mesh>

      {/* Under-barrel extractor rod */}
      <mesh position={[1.3, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 1.8, 12]} />
        <meshStandardMaterial color="#c6a15b" roughness={0.3} metalness={0.85} />
      </mesh>

      {/* 8-Chamber Cylinder (Brass engraved) */}
      <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 0.85, 8]} />
        <meshStandardMaterial color="#c6a15b" roughness={0.25} metalness={0.95} />
      </mesh>

      {/* Frame / Receiver (Dark weathered gunmetal) */}
      <mesh position={[-0.2, 0.1, 0]}>
        <boxGeometry args={[0.8, 0.7, 0.35]} />
        <meshStandardMaterial color="#1f1813" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Hammer */}
      <mesh position={[-0.6, 0.55, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.15, 0.35, 0.1]} />
        <meshStandardMaterial color="#c6a15b" roughness={0.3} metalness={0.85} />
      </mesh>

      {/* Grip / Handle (Dark antique mahogany wood with gold screws) */}
      <mesh position={[-0.8, -0.4, 0]} rotation={[0, 0, 0.55]}>
        <boxGeometry args={[0.4, 1.1, 0.32]} />
        <meshStandardMaterial color="#3b1d11" roughness={0.65} metalness={0.1} />
      </mesh>
      {/* Grip Medal Inlay */}
      <mesh position={[-0.78, -0.38, 0.17]} rotation={[0, 0, 0.55]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color="#e5c378" roughness={0.2} metalness={0.95} />
      </mesh>

      {/* Floating Tarot Card 1 (HawkEye) */}
      <mesh position={[-1.6, 0.8, -0.8]} rotation={[0.2, 0.4, -0.2]}>
        <boxGeometry args={[0.8, 1.25, 0.02]} />
        <meshStandardMaterial color="#1a140f" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Floating Tarot Card 2 (DoubleStrike) */}
      <mesh position={[1.8, -0.6, -0.6]} rotation={[-0.2, -0.3, 0.25]}>
        <boxGeometry args={[0.8, 1.25, 0.02]} />
        <meshStandardMaterial color="#21100b" roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  );
}

export function Hero3DCanvas() {
  return (
    <div className="w-full h-[440px] sm:h-[500px] md:h-[560px] relative">
      {/* Background warm candle radial aura */}
      <div className="absolute inset-0 bg-radial from-[#c6a15b]/15 via-transparent to-transparent pointer-events-none" />

      <Canvas
        camera={{ position: [0, 0.2, 4.2], fov: 42 }}
        className="cursor-grab active:cursor-grabbing"
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.5} />
        {/* Warm key candle light */}
        <pointLight position={[2, 3, 2]} intensity={25} color="#ffd48a" />
        {/* Cool brass rim light */}
        <pointLight position={[-3, -1, -2]} intensity={12} color="#c6a15b" />
        {/* Subtle crimson fill */}
        <pointLight position={[0, -2, 2]} intensity={6} color="#8c2727" />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
          <RevolverMesh />
        </Float>
      </Canvas>

      {/* Subtle indicator under the canvas */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#a68e72] font-['Cinzel',serif] pointer-events-none opacity-60">
        <span>✦</span>
        <span>Revolveri İncelemek İçin Fareyi Oynatın</span>
        <span>✦</span>
      </div>
    </div>
  );
}
