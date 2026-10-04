"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type DiegeticTurnCoinProps = {
  isYourTurn: boolean;
  position?: [number, number, number];
};

export function DiegeticTurnCoin({
  isYourTurn,
  position = [0, 0.015, 0],
}: DiegeticTurnCoinProps) {
  const coinRef = useRef<THREE.Group>(null);
  const targetZ = isYourTurn ? 0.22 : -0.22;
  const targetRotY = isYourTurn ? 0 : Math.PI;

  useFrame((_, delta) => {
    if (!coinRef.current) return;

    // Smooth lerp position
    coinRef.current.position.z = THREE.MathUtils.lerp(
      coinRef.current.position.z,
      targetZ,
      delta * 4
    );

    // Smooth flip rotation
    coinRef.current.rotation.y = THREE.MathUtils.lerp(
      coinRef.current.rotation.y,
      targetRotY,
      delta * 5
    );

    // Idle subtle wobble
    coinRef.current.rotation.x = Math.sin(Date.now() * 0.002) * 0.05;
  });

  return (
    <group ref={coinRef} position={position}>
      {/* Heavy Gold Coin Body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.008, 32]} />
        <meshStandardMaterial
          color="#d4af37"
          roughness={0.25}
          metalness={0.95}
        />
      </mesh>

      {/* Raised Rim Front */}
      <mesh position={[0, 0.0045, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.058, 0.004, 8, 32]} />
        <meshStandardMaterial
          color="#f5d77f"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Player Side Seal: Skull / Crossed Pistols Sigil */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.038, 16]} />
        <meshStandardMaterial
          color="#3a1c0d"
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>

      {/* Opponent Side Seal: Occult Eye */}
      <mesh position={[0, -0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.038, 16]} />
        <meshStandardMaterial
          color="#220b08"
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>

      {/* Golden Aura Glow (Active Turn indicator) */}
      <pointLight
        position={[0, 0.04, 0]}
        color={isYourTurn ? "#ffd700" : "#8c2727"}
        intensity={isYourTurn ? 0.8 : 0.3}
        distance={0.3}
        decay={2}
      />
    </group>
  );
}
