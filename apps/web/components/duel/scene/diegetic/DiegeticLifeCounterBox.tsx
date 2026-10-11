"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Text } from "@react-three/drei";
import * as THREE from "three";

export type DiegeticLifeCounterBoxProps = {
  playerHp: number;
  opponentHp: number;
  maxHp?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

// ── Glowing Nixie Tube Indicator ─────────────────────────────────────────────
function NixieTube({
  value,
  isAlive,
  label,
  position,
  glowColor = "#ff7a00",
}: {
  value: number;
  isAlive: boolean;
  label: string;
  position: [number, number, number];
  glowColor?: string;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const filamentRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!lightRef.current) return;
    if (!isAlive || value <= 0) {
      lightRef.current.intensity = 0;
      return;
    }
    const t = state.clock.getElapsedTime();
    // Subtle analog electric filament flicker
    const flicker = 0.92 + Math.sin(t * 18) * 0.05 + Math.cos(t * 31) * 0.03;
    lightRef.current.intensity = 2.4 * flicker;
  });

  return (
    <group position={position}>
      {/* Brass Tube Socket Collar */}
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.036, 0.042, 0.03, 16]} />
        <meshStandardMaterial color="#c6a15b" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Outer Glass Envelope */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.1, 16]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.92}
          opacity={1}
          transparent
          roughness={0.1}
          ior={1.5}
        />
      </mesh>

      {/* Internal Anode Mesh Screen */}
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.024, 0.024, 0.08, 12]} />
        <meshStandardMaterial color="#2d2218" wireframe roughness={0.7} />
      </mesh>

      {/* Glowing Digit Filament */}
      {isAlive && value > 0 && (
        <group ref={filamentRef} position={[0, 0.075, 0]}>
          <Text
            position={[0, 0, 0.005]}
            fontSize={0.055}
            color={glowColor}
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRYEF8RQ.woff"
          >
            {value}
          </Text>
          {/* Backside mirror for depth */}
          <Text
            position={[0, 0, -0.005]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.055}
            color={glowColor}
            anchorX="center"
            anchorY="middle"
          >
            {value}
          </Text>
        </group>
      )}

      {/* Warm Ambient Glow from Tube */}
      <pointLight
        ref={lightRef}
        position={[0, 0.08, 0.03]}
        color={glowColor}
        distance={0.85}
        intensity={isAlive && value > 0 ? 2.5 : 0}
      />

      {/* Brass Label Stamped Below Tube */}
      <Text
        position={[0, -0.015, 0.05]}
        rotation={[-0.4, 0, 0]}
        fontSize={0.018}
        color="#c6a15b"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
      >
        {label}
      </Text>
    </group>
  );
}

// ── Procedural Base Counter Box ─────────────────────────────────────────────
function ProceduralBox() {
  return (
    <group>
      {/* Heavy Weathered Cast-Iron Body */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.1, 0.18]} />
        <meshStandardMaterial
          color="#161413"
          roughness={0.75}
          metalness={0.65}
        />
      </mesh>

      {/* Top Beveled Plate (Dark Blued Steel) */}
      <mesh position={[0, 0.103, 0]}>
        <boxGeometry args={[0.33, 0.008, 0.17]} />
        <meshStandardMaterial color="#1a1c24" roughness={0.4} metalness={0.85} />
      </mesh>

      {/* Brass Corner Reinforcements */}
      {[-0.165, 0.165].map((x) =>
        [-0.085, 0.085].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.05, z]}>
            <boxGeometry args={[0.02, 0.102, 0.02]} />
            <meshStandardMaterial color="#c6a15b" roughness={0.3} metalness={0.9} />
          </mesh>
        ))
      )}

      {/* Front Faceplate Title: VITALITY MONITOR */}
      <Text
        position={[0, 0.05, 0.092]}
        fontSize={0.014}
        color="#c6a15b"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
      >
        LIFE MONITOR • DEFI-V1
      </Text>

      {/* Vintage Voltage Meter Glass Window in Center */}
      <mesh position={[0, 0.106, -0.03]}>
        <boxGeometry args={[0.08, 0.006, 0.05]} />
        <meshStandardMaterial color="#0c0e14" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Analog Needle Indicator */}
      <mesh position={[0, 0.11, -0.03]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.002, 0.002, 0.035]} />
        <meshStandardMaterial color="#e63946" emissive="#e63946" emissiveIntensity={0.6} />
      </mesh>

      {/* Industrial Screws on Top Plate */}
      {[-0.14, 0.14].map((x) => (
        <mesh key={`screw-${x}`} position={[x, 0.108, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.004, 8]} />
          <meshStandardMaterial color="#b38a43" metalness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// ── 3D GLTF Model Loader (with graceful procedural fallback) ────────────────
function LoadedBoxGLTF() {
  const { scene } = useGLTF("/models/life_counter_box.glb");
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} scale={0.32} position={[0, 0, 0]} />;
}

export function DiegeticLifeCounterBox({
  playerHp,
  opponentHp,
  maxHp = 3,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: DiegeticLifeCounterBoxProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* 3D Box Chassis (Meshy 4K PBR GLTF with procedural fallback) */}
      <Suspense fallback={<ProceduralBox />}>
        <LoadedBoxGLTF />
      </Suspense>

      {/* Left Tube: PLAYER HP (YOU) — Warm Golden-Amber Glow */}
      <NixieTube
        value={playerHp}
        isAlive={playerHp > 0}
        label="YOU"
        position={[-0.085, 0.105, 0.035]}
        glowColor="#ff9a00"
      />

      {/* Right Tube: OPPONENT HP (CHALLENGER) — Sinister Red-Orange Glow */}
      <NixieTube
        value={opponentHp}
        isAlive={opponentHp > 0}
        label="RIVAL"
        position={[0.085, 0.105, 0.035]}
        glowColor="#ff3a1a"
      />
    </group>
  );
}

useGLTF.preload("/models/life_counter_box.glb");
