"use client";

import React from "react";
import { Text } from "@react-three/drei";

type NameplateSNSProps = {
  name: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  isCurrentTurn?: boolean;
};

export function NameplateSNS({
  name,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isCurrentTurn = false,
}: NameplateSNSProps) {
  const displayName = name ? (name.endsWith(".sol") ? name : `${name.slice(0, 4)}…${name.slice(-4)}`) : "DUELIST";

  return (
    <group position={position} rotation={rotation}>
      {/* Heavy Aged Brass Plaque */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.26, 0.05, 0.008]} />
        <meshStandardMaterial
          color={isCurrentTurn ? "#e5c378" : "#8c6f3d"}
          roughness={0.3}
          metalness={0.9}
        />
      </mesh>

      {/* Recessed Inscribed Inner Panel */}
      <mesh position={[0, 0, 0.0045]}>
        <boxGeometry args={[0.24, 0.038, 0.002]} />
        <meshStandardMaterial
          color="#1a140f"
          roughness={0.7}
        />
      </mesh>

      {/* Brass Screws on corners */}
      {[-0.115, 0.115].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.005]} rotation={[0, 0, i * 0.8]}>
          <cylinderGeometry args={[0.004, 0.004, 0.004, 8]} />
          <meshStandardMaterial color="#c6a15b" roughness={0.2} metalness={0.9} />
        </mesh>
      ))}

      {/* 3D Engraved Typography */}
      <Text
        position={[0, 0, 0.006]}
        fontSize={0.016}
        color={isCurrentTurn ? "#ffd700" : "#d8c8b0"}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
      >
        {displayName.toUpperCase()}
      </Text>
    </group>
  );
}
