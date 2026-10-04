"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type DiegeticCandleHPProps = {
  hp: number;
  maxHp?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  label?: string;
};

function SingleCandle({
  index,
  isLit,
  offset,
}: {
  index: number;
  isLit: boolean;
  offset: number;
}) {
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!isLit) return;
    const t = state.clock.getElapsedTime() + index * 1.7;
    const flicker = 0.85 + Math.sin(t * 11) * 0.08 + Math.cos(t * 19) * 0.07;

    if (flameRef.current) {
      flameRef.current.scale.set(
        1 + Math.sin(t * 12) * 0.1,
        1 + Math.cos(t * 14) * 0.15,
        1 + Math.sin(t * 10) * 0.1
      );
      flameRef.current.position.y = 0.18 + Math.sin(t * 8) * 0.005;
    }
    if (lightRef.current) {
      lightRef.current.intensity = Math.max(0.2, 1.8 * flicker);
    }
  });

  return (
    <group position={[offset, 0, 0]}>
      {/* Heavy Ornate Brass Candlestick Base */}
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.03, 16]} />
        <meshStandardMaterial color="#c6a15b" roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Brass Stem */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.018, 0.024, 0.05, 12]} />
        <meshStandardMaterial color="#b38a43" roughness={0.35} metalness={0.85} />
      </mesh>
      {/* Brass Cup */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.032, 0.02, 0.02, 16]} />
        <meshStandardMaterial color="#c6a15b" roughness={0.3} metalness={0.85} />
      </mesh>

      {/* Wax Pillar (Aged Ivory Wax with drip nuances) */}
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.022, 0.024, 0.1, 16]} />
        <meshStandardMaterial color="#f2e8d8" roughness={0.7} />
      </mesh>

      {/* Wick */}
      <mesh position={[0, 0.185, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.018, 6]} />
        <meshStandardMaterial color={isLit ? "#ff7733" : "#221a15"} />
      </mesh>

      {/* Flame (Only when candle is lit / HP intact) */}
      {isLit ? (
        <group>
          {/* Inner core flame */}
          <mesh ref={flameRef} position={[0, 0.198, 0]}>
            <coneGeometry args={[0.012, 0.032, 8]} />
            <meshStandardMaterial
              color="#ffcc66"
              emissive="#ff9900"
              emissiveIntensity={3.5}
              toneMapped={false}
            />
          </mesh>
          {/* Point light casting warm glow on table felt */}
          <pointLight
            ref={lightRef}
            position={[0, 0.22, 0]}
            color="#ff9d3b"
            intensity={1.8}
            distance={0.8}
            decay={2}
          />
        </group>
      ) : (
        /* Burnt smoking wick tip */
        <mesh position={[0, 0.196, 0]}>
          <sphereGeometry args={[0.004, 6, 6]} />
          <meshStandardMaterial color="#1a110c" roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}

export function DiegeticCandleHP({
  hp,
  maxHp = 3,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: DiegeticCandleHPProps) {
  const clampedHp = Math.max(0, Math.min(hp, maxHp));
  const spacing = 0.14;
  const startX = -((maxHp - 1) * spacing) / 2;

  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: maxHp }).map((_, i) => (
        <SingleCandle
          key={i}
          index={i}
          isLit={i < clampedHp}
          offset={startX + i * spacing}
        />
      ))}
    </group>
  );
}
