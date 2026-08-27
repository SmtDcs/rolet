"use client";
/// <reference types="@react-three/fiber" />

// ROLET v2 — pure-procedural arena. NO GLB imports: external assets arrive
// with broken origins/scales, so everything (table, bullets, revolver,
// bulb, character silhouettes) is built from three.js primitives and
// normalized right here. Minimal animation: breathing sway + hit reaction.
// Characters are black silhouettes with glowing eyes — the "Dealer across
// the table" look; in PvP the opponent is the other player's silhouette.

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type GunTarget = "self" | "opponent";
export type FireKind = "live" | "blank" | null;

type DuelArenaProps = {
  isYourTurn: boolean;
  gunHeld: boolean;
  setGunHeld: (v: boolean) => void;
  target: GunTarget;
  firing: FireKind;
  playerOneHp?: number;
  playerTwoHp?: number;
  playerOnePubkey?: string;
  playerTwoPubkey?: string;
  playerOneHitSignal?: number;
  playerTwoHitSignal?: number;
  liveCount?: number;
  blankCount?: number;
};

// ── Single hanging bulb — the one light source ──────────────────────────────
function Bulb() {
  const light = useRef<THREE.PointLight>(null);
  const moving = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flicker =
      0.92 + Math.sin(t * 9.3) * 0.05 + Math.sin(t * 23.7) * 0.03 + (Math.random() < 0.008 ? -0.3 : 0);
    if (light.current) light.current.intensity = Math.max(0.3, 16 * flicker);
    if (moving.current) moving.current.rotation.z = Math.sin(t * 0.6) * 0.06;
  });
  return (
    <group ref={moving} position={[0, 2.25, 0]}>
      {/* cord */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.1, 6]} />
        <meshStandardMaterial color="#0a0604" />
      </mesh>
      {/* bulb */}
      <mesh position={[0, -0.02, 0]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial color="#ffdfb0" emissive="#ffc080" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, -0.1, 0]} intensity={16} distance={12} decay={1.4} color="#ffb072" castShadow />
      {/* Warm fill — keeps the table/gun/opponent readable, no more black hole */}
      <pointLight position={[0, 0.5, 1.3]} intensity={4} distance={5} decay={1.8} color="#ff8a4d" />
      {/* Cool key from the front-left — models read as 3D, not flat silhouettes */}
      <pointLight position={[-1.5, 1.2, 1.8]} intensity={3} distance={6} decay={1.8} color="#d8c8b0" />
      {/* Rim behind the opponent — separates silhouette from void */}
      <pointLight position={[0, 0.8, -2.0]} intensity={3} distance={4} decay={2} color="#a0200a" />
    </group>
  );
}

// ── Round wooden gambler's table ────────────────────────────────────────────
function Table() {
  return (
    <group position={[0, -0.5, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.38, 0.8, 24]} />
        <meshStandardMaterial color="#241208" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.05, 1.05, 0.1, 40]} />
        <meshStandardMaterial color="#3a2316" roughness={0.82} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.89, 0]} receiveShadow>
        <cylinderGeometry args={[1.07, 1.07, 0.035, 40]} />
        <meshStandardMaterial color="#1d0d06" roughness={0.95} />
      </mesh>
      {/* felt runner */}
      <mesh position={[0, 1.005, 0]} receiveShadow>
        <boxGeometry args={[1.45, 0.02, 0.55]} />
        <meshStandardMaterial color="#54100c" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Bullets on the felt: live = warm glow, blank = cold steel ───────────────
function bulletX(i: number, n: number) {
  return n === 1 ? 0 : -((n - 1) / 2) * 0.11 + i * 0.11;
}
function BulletRow({ live, blank }: { live: number; blank: number }) {
  const items: { x: number; live: boolean }[] = [];
  const total = Math.max(1, live + blank);
  let idx = 0;
  for (let i = 0; i < live; i++) items.push({ x: bulletX(idx++, total), live: true });
  for (let i = 0; i < blank; i++) items.push({ x: bulletX(idx++, total), live: false });
  return (
    <group>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, 0.51, 0.3]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.12, 14]} />
          <meshStandardMaterial
            color={it.live ? "#5c0d05" : "#8a8a8a"}
            emissive={it.live ? "#ff4422" : "#222222"}
            emissiveIntensity={it.live ? 1.3 : 0.15}
            metalness={it.live ? 0.2 : 0.7}
            roughness={it.live ? 0.4 : 0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Revolver-like gun (pure primitives) ─────────────────────────────────────
function Revolver({ firing }: { firing: FireKind }) {
  const muzzle = useRef<THREE.PointLight>(null);
  const steel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#7a8d9e",
        metalness: 0.85,
        roughness: 0.3,
        emissive: "#1a2229",
        emissiveIntensity: 0.35,
      }),
    [],
  );
  const grip = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4a2512",
        metalness: 0.15,
        roughness: 0.7,
        emissive: "#120804",
        emissiveIntensity: 0.4,
      }),
    [],
  );

  useFrame((_, delta) => {
    if (muzzle.current) {
      muzzle.current.intensity += (firing === "live" ? 30 : 0 - muzzle.current.intensity) * Math.min(1, delta * 20);
    }
  });

  return (
    <group>
      {/* barrel — long, forward (-Z) */}
      <mesh position={[0, 0.03, -0.32]} castShadow material={steel}>
        <cylinderGeometry args={[0.04, 0.045, 0.6, 20]} />
      </mesh>
      {/* sight ridge */}
      <mesh position={[0, 0.075, -0.32]} material={steel}>
        <boxGeometry args={[0.05, 0.025, 0.6]} />
      </mesh>
      {/* frame — connects barrel to grip */}
      <mesh position={[0, 0.08, 0.02]} castShadow material={steel}>
        <boxGeometry args={[0.12, 0.07, 0.22]} />
      </mesh>
      {/* cylinder / drum — the iconic rotating part, upright */}
      <mesh position={[0, 0.03, -0.02]} rotation={[0, 0, 0]} castShadow material={steel}>
        <cylinderGeometry args={[0.1, 0.1, 0.18, 24]} />
      </mesh>
      {/* grip — angled down, wood tone */}
      <mesh position={[0, -0.1, 0.1]} rotation={[0.2, 0, 0]} castShadow material={grip}>
        <cylinderGeometry args={[0.055, 0.075, 0.24, 8]} />
      </mesh>
      {/* hammer */}
      <mesh position={[0, 0.1, 0.17]} material={grip}>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
      </mesh>
      {/* muzzle flash light */}
      <pointLight ref={muzzle} position={[0, 0.03, -0.65]} color="#ffbb44" intensity={0} distance={4} decay={2} />
    </group>
  );
}

// ── Character: black silhouette, glowing eyes, breathing + hit sway ─────────
function Silhouette({
  hue,
  facing,
  alive,
  isTurn,
  isSelf,
  hitSignal = 0,
}: {
  hue: number;
  facing: number;
  alive: boolean;
  isTurn: boolean;
  isSelf: boolean;
  hitSignal?: number;
}) {
  const torso = useRef<THREE.Group>(null);
  const hitAt = useRef<number>(-999);
  if (hitSignal > 0) hitAt.current = -1;

  const eyeColor = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.9, 0.62), [hue]);
  const body = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#241009",
        roughness: 0.9,
        metalness: 0.05,
        emissive: "#0d0502",
        emissiveIntensity: 0.4,
      }),
    [],
  );
  const head = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2b140a",
        roughness: 0.85,
        metalness: 0.05,
        emissive: "#0f0603",
        emissiveIntensity: 0.4,
      }),
    [],
  );

  useFrame(({ clock }, delta) => {
    const g = torso.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const damp = Math.min(1, delta * 5);
    if (hitAt.current === -1) hitAt.current = t;

    let hitPitch = 0;
    if (hitAt.current > -900) {
      const el = t - hitAt.current;
      if (el < 1) hitPitch = -Math.exp(-el * 6) * Math.cos(el * 16) * 0.22;
      else hitAt.current = -999;
    }

    const breathe = Math.sin(t * 1.6) * 0.02;
    const sway = Math.sin(t * 0.8) * 0.03;
    const targetPitch = (alive ? 0 : 0.5) + (isTurn ? 0.07 : 0) + breathe + hitPitch;
    g.rotation.x += (targetPitch - g.rotation.x) * damp;
    g.rotation.z += (sway - g.rotation.z) * damp;
  });

  return (
    <group position={isSelf ? [-0.6, -0.5, 0.9] : [0.0, -0.5, -1.2]} rotation={[0, facing, 0]} scale={isSelf ? 1.05 : 1.35}>
      {/* legs */}
      <mesh position={[0, 0.25, 0]} castShadow material={body}>
        <cylinderGeometry args={[0.16, 0.2, 0.5, 12]} />
      </mesh>
      <group ref={torso}>
        <mesh position={[0, 0.75, 0]} castShadow material={body}>
          <cylinderGeometry args={[0.28, 0.4, 0.55, 14]} />
        </mesh>
        <mesh position={[0, 1.0, 0]} castShadow material={body}>
          <boxGeometry args={[0.85, 0.22, 0.4]} />
        </mesh>
        {/* arms */}
        <mesh position={[-0.5, 0.86, 0.1]} castShadow material={body}>
          <cylinderGeometry args={[0.07, 0.07, 0.6, 10]} />
        </mesh>
        <mesh position={[0.5, 0.86, 0.1]} castShadow material={body}>
          <cylinderGeometry args={[0.07, 0.07, 0.6, 10]} />
        </mesh>
        {/* head */}
        <mesh position={[0, 1.28, 0]} castShadow material={head}>
          <boxGeometry args={[0.3, 0.4, 0.3]} />
        </mesh>
        {/* eyes */}
        <mesh position={[-0.07, 1.32, 0.152]}>
          <boxGeometry args={[0.06, 0.045, 0.02]} />
          <meshBasicMaterial color={eyeColor} toneMapped={false} />
        </mesh>
        <mesh position={[0.07, 1.32, 0.152]}>
          <boxGeometry args={[0.06, 0.045, 0.02]} />
          <meshBasicMaterial color={eyeColor} toneMapped={false} />
        </mesh>
      </group>
      {/* Red rim light behind the opponent — cuts the silhouette out of the void */}
      {!isSelf && <pointLight position={[0, 0.9, -0.4]} intensity={2.2} distance={2.5} decay={2} color="#8a1a0a" />}
    </group>
  );
}

// ── Camera: seated eye-level, looking across at the opponent ────────────────
function CameraRig({ firing }: { firing: FireKind }) {
  useFrame(({ camera, clock }, delta) => {
    const lerp = Math.min(1, delta * 3);
    const sway = Math.sin(clock.elapsedTime * 0.4) * 0.006;
    camera.position.x += (0.0 + sway - camera.position.x) * lerp;
    camera.position.y += (1.05 - camera.position.y) * lerp;
    camera.position.z += (1.7 - camera.position.z) * lerp;
    // Firing kicks the camera back slightly for impact
    const kick = firing === "live" ? 0.06 : 0;
    camera.lookAt(0, 0.55 - kick, -1.1);
  });
  return null;
}

// ── Main canvas ──────────────────────────────────────────────────────────────
export default function DuelArena3D({
  isYourTurn,
  firing,
  playerOneHp = 4,
  playerTwoHp = 4,
  playerOnePubkey = "",
  playerTwoPubkey = "",
  playerOneHitSignal = 0,
  playerTwoHitSignal = 0,
  liveCount = 5,
  blankCount = 3,
}: DuelArenaProps) {
  const hue1 = hueOf(playerOnePubkey);
  const hue2 = hueOf(playerTwoPubkey);

  return (
    <Canvas
      shadows="basic"
      camera={{ position: [0, 1.05, 1.7], fov: 48 }}
      gl={{ antialias: true }}
      onCreated={(state) => console.log("[CANVAS-OK] webgl2=", state.gl.capabilities.isWebGL2)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        zIndex: 5,
      }}
    >
      {/* Floor — hard, catches the light pool */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#0a0705" roughness={0.95} />
      </mesh>
      {/* Back wall — a dimly lit room, not an infinite void */}
      <mesh position={[0, 1.6, -3.2]}>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color="#1a100a" roughness={1} />
      </mesh>
      {/* Wall light band — the room has depth behind the opponent */}
      <mesh position={[0, 2.3, -3.15]}>
        <planeGeometry args={[8, 1.4]} />
        <meshBasicMaterial color="#3a2414" toneMapped={false} />
      </mesh>

      <CameraRig firing={firing} />
      <Bulb />
      <Table />
      <BulletRow live={liveCount} blank={blankCount} />

      {/* Opponent — across the table, facing you */}
      <Silhouette hue={hue2} facing={0} alive={playerTwoHp > 0} isTurn={!isYourTurn} isSelf={false} hitSignal={playerTwoHitSignal} />
      {/* You — not rendered: the camera IS your eyes (Buckshot POV).
          Your silhouette would block the whole table at z=0.9. */}

      {/* Revolver — rests ON the table, center of the felt, lying flat.
          Barrel points diagonally toward the opponent. */}
      <group position={[0.0, 0.47, 0.28]} rotation={[-Math.PI / 2, 0, 0.6]} scale={[1.8, 1.8, 1.8]}>
        <Revolver firing={firing} />
        {/* Dedicated light so the gun reads clearly against the dark table */}
        <pointLight position={[0.1, 0.5, 0.2]} intensity={6} distance={2} decay={1.4} color="#ffe0b0" />
      </group>
    </Canvas>
  );
}

function hueOf(pubkey: string): number {
  let h = 0;
  for (let i = 0; i < Math.min(pubkey.length, 8); i++) h = (h * 31 + pubkey.charCodeAt(i)) % 360;
  return h;
}
