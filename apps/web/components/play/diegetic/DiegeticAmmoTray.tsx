"use client";

import React from "react";

type DiegeticAmmoTrayProps = {
  liveCount: number;
  blankCount: number;
  totalRounds?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

function Bullet({
  type,
  position,
}: {
  type: "live" | "blank" | "empty";
  position: [number, number, number];
}) {
  if (type === "empty") {
    return (
      <group position={position}>
        {/* Empty indented cylinder groove in tray */}
        <mesh position={[0, -0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.08, 12]} />
          <meshStandardMaterial color="#1a120b" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  const isLive = type === "live";

  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      {/* Brass Cartridge Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.0125, 0.065, 16]} />
        <meshStandardMaterial color="#c6a15b" roughness={0.25} metalness={0.9} />
      </mesh>

      {/* Cartridge Rim Base */}
      <mesh position={[0, -0.033, 0]}>
        <cylinderGeometry args={[0.0145, 0.0145, 0.006, 16]} />
        <meshStandardMaterial color="#a07a38" roughness={0.3} metalness={0.95} />
      </mesh>

      {/* Bullet Projectile Head */}
      {isLive ? (
        /* Copper FMJ Pointed Tip */
        <mesh position={[0, 0.042, 0]}>
          <coneGeometry args={[0.0118, 0.024, 16]} />
          <meshStandardMaterial color="#b85d3b" roughness={0.35} metalness={0.8} />
        </mesh>
      ) : (
        /* Blank Crimped Paper / Dark Wax Crimp */
        <mesh position={[0, 0.033, 0]}>
          <cylinderGeometry args={[0.009, 0.0115, 0.008, 12]} />
          <meshStandardMaterial color="#332a22" roughness={0.8} />
        </mesh>
      )}
    </group>
  );
}

export function DiegeticAmmoTray({
  liveCount,
  blankCount,
  totalRounds = 8,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: DiegeticAmmoTrayProps) {
  // Generate list of cartridges: live first, then blank, remainder empty
  const cartridges: Array<"live" | "blank" | "empty"> = [];
  for (let i = 0; i < liveCount && cartridges.length < totalRounds; i++) {
    cartridges.push("live");
  }
  for (let i = 0; i < blankCount && cartridges.length < totalRounds; i++) {
    cartridges.push("blank");
  }
  while (cartridges.length < totalRounds) {
    cartridges.push("empty");
  }

  // 2 rows of 4 slots
  const cols = 4;
  const colSpacing = 0.045;
  const rowSpacing = 0.1;

  return (
    <group position={position} rotation={rotation}>
      {/* Heavy Ornate Brass Tray Base */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[0.22, 0.016, 0.24]} />
        <meshStandardMaterial color="#211710" roughness={0.6} metalness={0.7} />
      </mesh>

      {/* Brass Lip Trim */}
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[0.23, 0.008, 0.25]} />
        <meshStandardMaterial color="#c6a15b" roughness={0.3} metalness={0.85} />
      </mesh>

      {/* Dark Velvet Interior Felt Bed */}
      <mesh position={[0, 0.014, 0]}>
        <boxGeometry args={[0.2, 0.002, 0.22]} />
        <meshStandardMaterial color="#0f1d15" roughness={0.9} />
      </mesh>

      {/* Cartridge Slots */}
      {cartridges.map((type, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = (col - (cols - 1) / 2) * colSpacing;
        const z = (row - 0.5) * rowSpacing;

        return (
          <Bullet
            key={i}
            type={type}
            position={[x, 0.022, z]}
          />
        );
      })}
    </group>
  );
}
