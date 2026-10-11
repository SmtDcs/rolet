"use client";

import React, { useState } from "react";
import * as THREE from "three";

export type DiegeticCardHandProps = {
  cards: string[];
  selectedCardIndex?: number | null;
  onSelectCard?: (index: number, cardId: string) => void;
  disabled?: boolean;
  position?: [number, number, number];
};

function TarotCard3D({
  cardName,
  index,
  total,
  isSelected,
  onClick,
  disabled,
}: {
  cardName: string;
  index: number;
  total: number;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  // Spread cards in a fan
  const spacing = 0.12;
  const startX = -((total - 1) * spacing) / 2;
  const x = startX + index * spacing;
  const rotZ = ((index - (total - 1) / 2) / Math.max(1, total)) * -0.15;
  const yElev = isSelected ? 0.04 : hovered && !disabled ? 0.025 : 0.005;

  return (
    <group
      position={[x, yElev, 0]}
      rotation={[-0.35, 0, rotZ]}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!disabled) setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
    >
      {/* Card Body - Thick Occult Parchment */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.095, 0.145, 0.003]} />
        <meshStandardMaterial
          color={isSelected ? "#2b1c10" : hovered ? "#24180e" : "#17100b"}
          roughness={0.65}
          metalness={0.2}
        />
      </mesh>

      {/* Gold Leaf Inlay Rim */}
      <mesh position={[0, 0, 0.002]}>
        <boxGeometry args={[0.088, 0.138, 0.001]} />
        <meshStandardMaterial
          color={isSelected ? "#ffd700" : hovered ? "#e5c378" : "#8c6f3d"}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Card Center Field (Aged Parchment with Occult Sigil) */}
      <mesh position={[0, 0, 0.003]}>
        <boxGeometry args={[0.08, 0.128, 0.001]} />
        <meshStandardMaterial
          color="#0f0c08"
          roughness={0.8}
        />
      </mesh>

      {/* Subtle selection / hover candlelight */}
      {(hovered || isSelected) && (
        <pointLight
          position={[0, 0.04, 0.05]}
          color={isSelected ? "#ffd700" : "#ffaa44"}
          intensity={0.6}
          distance={0.25}
          decay={2}
        />
      )}
    </group>
  );
}

export function DiegeticCardHand({
  cards,
  selectedCardIndex = null,
  onSelectCard,
  disabled = false,
  position = [0, 0.015, 0.45],
}: DiegeticCardHandProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <group position={position}>
      {cards.map((card, i) => (
        <TarotCard3D
          key={`${card}-${i}`}
          cardName={card}
          index={i}
          total={cards.length}
          isSelected={selectedCardIndex === i}
          onClick={() => onSelectCard?.(i, card)}
          disabled={disabled}
        />
      ))}
    </group>
  );
}
