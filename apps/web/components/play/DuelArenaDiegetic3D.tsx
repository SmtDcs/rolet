"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { DiegeticCandleHP } from "./diegetic/DiegeticCandleHP";
import { DiegeticLifeCounterBox } from "./diegetic/DiegeticLifeCounterBox";
import { DiegeticAmmoTray } from "./diegetic/DiegeticAmmoTray";
import { DiegeticTurnCoin } from "./diegetic/DiegeticTurnCoin";
import { DiegeticRevolver } from "./diegetic/DiegeticRevolver";
import { DiegeticCardHand } from "./diegetic/DiegeticCardHand";
import { NameplateSNS } from "./diegetic/NameplateSNS";
import { GildedButton } from "@/components/ui/GildedButton";
import { Crosshair, Flame, RotateCcw, Hand } from "lucide-react";

export type DuelArenaDiegetic3DProps = {
  isYourTurn: boolean;
  gunHeld: boolean;
  setGunHeld: (held: boolean) => void;
  target: "self" | "opponent";
  setTarget: (target: "self" | "opponent") => void;
  firing: "live" | "blank" | null;
  onFire: () => void;
  playerHp: number;
  opponentHp: number;
  playerPubkey: string;
  opponentPubkey: string;
  liveCount: number;
  blankCount: number;
  cards?: string[];
  onSelectCard?: (idx: number, cardId: string) => void;
  selectedCardIndex?: number | null;
  disabled?: boolean;
};

// ── Swinging Pendant Light Bulb ─────────────────────────────────────────────
function SwingingBulb() {
  const bulbRef = useRef<THREE.Group>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (bulbRef.current) {
      bulbRef.current.rotation.z = Math.sin(t * 0.7) * 0.04;
      bulbRef.current.rotation.x = Math.cos(t * 0.5) * 0.03;
    }
    if (pointLightRef.current) {
      const flicker = 0.94 + Math.sin(t * 14) * 0.04 + Math.sin(t * 26) * 0.02;
      pointLightRef.current.intensity = 22 * flicker;
    }
  });

  return (
    <group ref={bulbRef} position={[0, 2.3, 0]}>
      {/* Hanging Cord */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 1.0, 8]} />
        <meshStandardMaterial color="#14100c" />
      </mesh>
      {/* Brass Lamp Shade */}
      <mesh position={[0, 0.06, 0]}>
        <coneGeometry args={[0.22, 0.14, 24, 1, true]} />
        <meshStandardMaterial color="#2b1f14" roughness={0.4} metalness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Glowing Filament Bulb */}
      <mesh position={[0, -0.02, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#ffe7ba" emissive="#ffb852" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight
        ref={pointLightRef}
        position={[0, -0.08, 0]}
        intensity={22}
        distance={6}
        decay={1.6}
        color="#ffcc88"
        castShadow
      />
    </group>
  );
}

// ── Occult Table Model (with fallback) ──────────────────────────────────────
function ProceduralTableMesh() {
  return (
    <group position={[0, -0.65, 0]}>
      {/* Mahogany pedestal */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.45, 0.7, 24]} />
        <meshStandardMaterial color="#1f1108" roughness={0.85} />
      </mesh>
      {/* Circular tabletop */}
      <mesh position={[0, 0.7, 0]} receiveShadow>
        <cylinderGeometry args={[1.1, 1.1, 0.08, 48]} />
        <meshStandardMaterial color="#2d170a" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Brass rim bevel */}
      <mesh position={[0, 0.74, 0]}>
        <torusGeometry args={[1.09, 0.015, 12, 48]} />
        <meshStandardMaterial color="#c6a15b" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Green Velvet Baize Inset */}
      <mesh position={[0, 0.745, 0]} receiveShadow>
        <cylinderGeometry args={[1.05, 1.05, 0.01, 48]} />
        <meshStandardMaterial color="#152b1e" roughness={0.95} />
      </mesh>
    </group>
  );
}

function LoadedTableGLTF() {
  const { scene } = useGLTF("/models/arena_table.glb");
  const cloned = React.useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} scale={1.25} position={[0, -0.68, 0]} />;
}

// ── Opponent Challenger Across Table ───────────────────────────────────────
function ProceduralOpponentMesh() {
  return (
    <group position={[0, 0.1, -1.05]}>
      {/* Torso in dark frock coat */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.65, 0.85, 0.35]} />
        <meshStandardMaterial color="#0c0908" roughness={0.9} />
      </mesh>
      {/* Sinister porcelain mask / face */}
      <mesh position={[0, 0.76, 0.08]}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color="#ebe2d5" roughness={0.4} />
      </mesh>
      {/* Glowing piercing eyes */}
      {[-0.055, 0.055].map((x, i) => (
        <mesh key={i} position={[x, 0.78, 0.22]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color="#ff4422" emissive="#ff2200" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      ))}
      {/* Top Hat */}
      <mesh position={[0, 0.98, 0.06]}>
        <cylinderGeometry args={[0.15, 0.15, 0.32, 20]} />
        <meshStandardMaterial color="#14100d" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.83, 0.06]}>
        <cylinderGeometry args={[0.24, 0.24, 0.02, 20]} />
        <meshStandardMaterial color="#14100d" roughness={0.8} />
      </mesh>
    </group>
  );
}

function LoadedOpponentGLTF() {
  const { scene } = useGLTF("/models/opponent_duelist.glb");
  const cloned = React.useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} scale={0.95} position={[0, -0.65, -1.05]} rotation={[0, 0, 0]} />;
}

function OpponentFigure() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Subtle occult breathing sway
    groupRef.current.position.y = Math.sin(t * 1.8) * 0.008;
    groupRef.current.rotation.y = Math.sin(t * 0.9) * 0.015;
  });

  return (
    <group ref={groupRef}>
      <Suspense fallback={<ProceduralOpponentMesh />}>
        <LoadedOpponentGLTF />
      </Suspense>
    </group>
  );
}

// ── Main Arena 3D Viewport ──────────────────────────────────────────────────
export function DuelArenaDiegetic3D({
  isYourTurn,
  gunHeld,
  setGunHeld,
  target,
  setTarget,
  firing,
  onFire,
  playerHp,
  opponentHp,
  playerPubkey,
  opponentPubkey,
  liveCount,
  blankCount,
  cards = [],
  onSelectCard,
  selectedCardIndex,
  disabled = false,
}: DuelArenaDiegetic3DProps) {
  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#070605]">
      {/* Three.js Canvas Scene */}
      <Canvas
        camera={{ position: [0, 0.48, 1.38], fov: 48 }}
        dpr={[1, 1.5]}
        shadows
        className="w-full h-full"
      >
        {/* Occult Room Atmosphere & Fog */}
        <color attach="background" args={["#070605"]} />
        <fogExp2 attach="fog" args={["#070605", 0.42]} />

        {/* Lighting Setup */}
        <ambientLight intensity={0.35} />
        <SwingingBulb />

        {/* Warm candle sidelights */}
        <pointLight position={[-1.2, 0.4, 0]} intensity={4} color="#ff9e42" distance={2.5} />
        <pointLight position={[1.2, 0.4, 0]} intensity={4} color="#ff9e42" distance={2.5} />

        {/* Moody red back rim on opponent */}
        <pointLight position={[0, 1.0, -1.8]} intensity={6} color="#8c2727" distance={3} />

        {/* Duel Table */}
        <Suspense fallback={<ProceduralTableMesh />}>
          <LoadedTableGLTF />
        </Suspense>

        {/* Opponent Figure */}
        <OpponentFigure />

        {/* Diegetic Elements Placed on Table Felt */}
        {/* 1. Life Monitor Box on Table (Vitality Counter Box) */}
        <DiegeticLifeCounterBox
          playerHp={playerHp}
          opponentHp={opponentHp}
          maxHp={3}
          position={[-0.48, 0.08, 0.2]}
          rotation={[0, 0.35, 0]}
        />

        {/* 2. Ambient Candle Light on far table */}
        <DiegeticCandleHP
          hp={Math.max(1, opponentHp)}
          maxHp={3}
          position={[-0.58, 0.08, -0.45]}
          rotation={[0, -0.2, 0]}
        />

        {/* 3. Ammo Tray (near right) */}
        <DiegeticAmmoTray
          liveCount={liveCount}
          blankCount={blankCount}
          position={[0.52, 0.08, 0.3]}
          rotation={[0, -0.25, 0]}
        />

        {/* 4. Turn Indicator Coin (table center) */}
        <DiegeticTurnCoin
          isYourTurn={isYourTurn}
          position={[0, 0.08, 0]}
        />

        {/* 5. Duelist Nameplates on table rims */}
        <NameplateSNS
          name={playerPubkey}
          position={[0, 0.08, 0.68]}
          rotation={[-0.3, 0, 0]}
          isCurrentTurn={isYourTurn}
        />
        <NameplateSNS
          name={opponentPubkey}
          position={[0, 0.08, -0.68]}
          rotation={[0.3, Math.PI, 0]}
          isCurrentTurn={!isYourTurn}
        />

        {/* 6. Diegetic Tarot Hand */}
        <DiegeticCardHand
          cards={cards}
          selectedCardIndex={selectedCardIndex}
          onSelectCard={onSelectCard}
          disabled={!isYourTurn || disabled}
          position={[0, 0.08, 0.48]}
        />

        {/* 7. Diegetic First-Person Revolver */}
        <DiegeticRevolver
          isYourTurn={isYourTurn}
          gunHeld={gunHeld}
          target={target}
          firing={firing}
        />
      </Canvas>

      {/* Diegetic Action Controls Overlay (Zero 2D HUD clutter — only physical triggers) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30 pointer-events-auto">
        {isYourTurn && !disabled && (
          <div className="flex items-center gap-3 bg-black/85 backdrop-blur-md px-6 py-3 rounded-full border border-brass-frame shadow-2xl shadow-black/80">
            {/* Pick up / Aim target controls */}
            {!gunHeld ? (
              <GildedButton
                variant="gold"
                size="md"
                onClick={() => setGunHeld(true)}
              >
                <Hand className="w-4 h-4 mr-2 text-[#c6a15b]" />
                <span>Take Revolver</span>
              </GildedButton>
            ) : (
              <>
                <GildedButton
                  variant={target === "opponent" ? "crimson" : "dark"}
                  size="sm"
                  onClick={() => setTarget("opponent")}
                >
                  <Crosshair className="w-4 h-4 mr-1.5" />
                  <span>Aim at Opponent</span>
                </GildedButton>

                <GildedButton
                  variant={target === "self" ? "crimson" : "dark"}
                  size="sm"
                  onClick={() => setTarget("self")}
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  <span>Aim at Self</span>
                </GildedButton>

                <div className="h-6 w-px bg-zinc-700 mx-1" />

                <GildedButton
                  variant="gold"
                  size="md"
                  onClick={onFire}
                  disabled={firing !== null}
                >
                  <Flame className="w-4 h-4 mr-1.5 text-[#ff4422]" />
                  <span>{target === "opponent" ? "Pull Trigger (Opponent)" : "Pull Trigger (Self)"}</span>
                </GildedButton>
              </>
            )}
          </div>
        )}

        {/* Occult Turn Subtitle */}
        <div className="text-xs uppercase tracking-[0.3em] font-sans text-[#c6a15b]/80 drop-shadow">
          {isYourTurn ? "YOUR TURN — YOUR SOUL IS ON THE LINE" : "OPPONENT'S TURN — AWAITING ACTION"}
        </div>
      </div>
    </div>
  );
}

// Preload models for immediate rendering
useGLTF.preload("/models/arena_table.glb");
useGLTF.preload("/models/opponent_duelist.glb");
