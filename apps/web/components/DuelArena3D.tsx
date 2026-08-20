/// <reference types="@react-three/fiber" />
"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  Pixelation,
  Noise,
} from "@react-three/postprocessing";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CharacterRig, type CharacterState } from "./CharacterRig";

const MODEL_TABLE = "/models/table.glb";
const MODEL_REVOLVER = "/models/revolver.glb";
const MODEL_LANTERN = "/models/lantern.glb";
const MODEL_BULLET = "/models/mermi.glb";

export type GunTarget = "self" | "opponent";

// ── Loading fallback ──────────────────────────────────────────────────────────
function LoadingText() {
  return (
    <Html center>
      <div
        style={{
          fontFamily: "monospace",
          letterSpacing: "0.4em",
          fontSize: 11,
          color: "#6b4a30",
          textShadow: "0 0 12px rgba(180,40,20,0.6)",
          whiteSpace: "nowrap",
        }}
      >
        // LOADING…
      </div>
    </Html>
  );
}

// ── Generic GLB loader that darkens materials for the dim room ────────────────
function GLBModel({
  src,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  castShadow = true,
  receiveShadow = true,
}: {
  src: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const { scene } = useGLTF(src);
  const model = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = castShadow;
        m.receiveShadow = receiveShadow;
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.roughness = Math.min(mat.roughness + 0.15, 1);
            mat.metalness = Math.min(mat.metalness + 0.05, 1);
            mat.envMapIntensity = 0.5;
          }
        });
      }
    });
    return cloned;
  }, [scene, castShadow, receiveShadow]);

  return <primitive object={model} position={position} rotation={rotation} scale={scale} />;
}

// ── Deterministic hue from a base58 pubkey ─────────────────────────────────────
function hueFromPubkey(pubkey: string): number {
  let h = 0;
  for (let i = 0; i < Math.min(pubkey.length, 8); i++) {
    h = (h * 31 + pubkey.charCodeAt(i)) % 360;
  }
  return h;
}

// ── Chamber bullets laid out on the table — live = hot, blank = cold ──────────
type BulletKind = "live" | "blank";
type BulletItem = {
  key: number;
  kind: BulletKind;
  retiring?: boolean;
  slot: number; // target row slot (frozen when retiring so it shrinks in place)
  slotCount: number; // layout width the slot was computed against (frozen too)
};

const BULLET_BASE_SCALE = 0.3;
const BULLET_SPACING = 0.13;
const BULLET_RETIRE_MS = 420;

function bulletSlotX(slot: number, slotCount: number): number {
  return slotCount === 1 ? 0 : -((slotCount - 1) / 2) * BULLET_SPACING + slot * BULLET_SPACING;
}

function Bullet({ item }: { item: BulletItem }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_BULLET);

  const model = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      // GLBModel darkens shared materials; here we want per-bullet emissive,
      // so clone materials once per bullet before tinting.
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(
        (mat) => (mat as THREE.Material).clone(),
      );
      mesh.material = Array.isArray(mesh.material) ? mats : mats[0];
      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (item.kind === "live") {
          m.color = new THREE.Color("#5c0d05");
          m.emissive = new THREE.Color("#ff4422");
          m.emissiveIntensity = 1.2;
          m.roughness = 0.45;
          m.metalness = 0.15;
        } else {
          m.color = new THREE.Color("#8a8a8a");
          m.emissive = new THREE.Color("#333333");
          m.emissiveIntensity = 0.2;
          m.roughness = 0.6;
          m.metalness = 0.7;
        }
      });
    });
    return cloned;
  }, [scene, item.kind]);

  const targetX = bulletSlotX(item.slot, item.slotCount);
  const yaw = item.slot * 0.62;

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const k = Math.min(1, delta * 8);
    // New bullets grow in from 0; retiring bullets shrink to 0 before unmount.
    const targetScale = item.retiring ? 0 : BULLET_BASE_SCALE;
    g.scale.setScalar(g.scale.x + (targetScale - g.scale.x) * k);
    g.position.x += (targetX - g.position.x) * k;
  });

  return (
    <group
      ref={group}
      position={[targetX, 0.14, 0]}
      rotation={[Math.PI / 2, 0, yaw]}
      scale={0}
    >
      <primitive object={model} />
    </group>
  );
}

function BulletSet({ liveCount, blankCount }: { liveCount: number; blankCount: number }) {
  const idRef = useRef(0);
  const [items, setItems] = useState<BulletItem[]>([]);

  useFrame((_, delta) => {
    if (delta <= 0) return; // wait for a real frame

    const live = Math.max(0, liveCount);
    const blank = Math.max(0, blankCount);
    const total = Math.min(8, live + blank);
    const targetLive = Math.min(live, total);
    const targetBlank = total - targetLive;

    const active = items.filter((i) => !i.retiring);
    const activeLive = active.filter((i) => i.kind === "live");
    const activeBlank = active.filter((i) => i.kind === "blank");

    if (activeLive.length === targetLive && activeBlank.length === targetBlank) {
      return; // already reconciled
    }

    const keepLive = activeLive.slice(0, targetLive);
    const keepBlank = activeBlank.slice(0, targetBlank);
    // Frozen at their current slot/slotCount → they shrink in place.
    const retiring: BulletItem[] = [
      ...activeLive.slice(targetLive),
      ...activeBlank.slice(targetBlank),
    ].map((i) => ({ ...i, retiring: true }));

    const freshLive: BulletItem[] = [];
    for (let i = 0; i < targetLive - keepLive.length; i++) {
      freshLive.push({ key: ++idRef.current, kind: "live", slot: 0, slotCount: 0 });
    }
    const freshBlank: BulletItem[] = [];
    for (let i = 0; i < targetBlank - keepBlank.length; i++) {
      freshBlank.push({ key: ++idRef.current, kind: "blank", slot: 0, slotCount: 0 });
    }

    // Active bullets occupy a contiguous row: live first, then blank. Copy kept
    // items so their slot assignment doesn't mutate existing state.
    const activeSequence = [...keepLive, ...freshLive, ...keepBlank, ...freshBlank];
    const activeCount = activeSequence.length;
    const nextActive = activeSequence.map((it, i) => ({
      ...it,
      slot: i,
      slotCount: activeCount,
    }));

    if (retiring.length > 0) {
      const keys = new Set(retiring.map((r) => r.key));
      window.setTimeout(() => {
        setItems((cur) => cur.filter((c) => !keys.has(c.key)));
      }, BULLET_RETIRE_MS);
    }

    setItems([...nextActive, ...retiring]);
  });

  return (
    <group>
      {items.map((item) => (
        <Bullet key={item.key} item={item} />
      ))}
    </group>
  );
}

// ── Flickering spotlight — calmed down, no more nuclear glow ─────────────────
function HangingSpot() {
  const light = useRef<THREE.SpotLight>(null);
  const target = useRef<THREE.Object3D>(new THREE.Object3D());
  const baseIntensity = 12;

  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.elapsedTime;
    const flicker =
      0.94 +
      Math.sin(t * 53.7) * 0.04 +
      Math.sin(t * 17.1) * 0.03 +
      (Math.random() < 0.01 ? -0.35 : 0);
    light.current.intensity = Math.max(0.1, baseIntensity * flicker);
    light.current.position.x = Math.sin(t * 0.6) * 0.04;
    light.current.position.z = Math.cos(t * 0.5) * 0.03;
  });

  return (
    <>
      <primitive object={target.current} position={[0, 0, 0]} />
      <spotLight
        ref={light}
        position={[0, 2.0, 0]}
        target={target.current}
        angle={0.7}
        penumbra={0.4}
        intensity={baseIntensity}
        distance={5}
        decay={1.8}
        color="#ffb072"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0008}
        shadow-radius={1}
      />
    </>
  );
}

// ── Swinging lantern — hangs above the table, gentle pendulum motion ─────────
function SwingingLantern() {
  const ref = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_LANTERN);
  const model = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        (obj as THREE.Mesh).castShadow = false;
      }
    });
    return cloned;
  }, [scene]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    // Pivot at the top of the lantern → swings like a pendulum
    ref.current.rotation.z = Math.sin(t * 0.7) * 0.09;
    ref.current.rotation.x = Math.cos(t * 0.5) * 0.04;
  });

  return (
    // Pivot point is where the cord attaches; lantern body hangs BELOW (-Y)
    <group ref={ref} position={[0, 1.5, 0]}>
      {/* Cord going up off-screen */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.8, 6]} />
        <meshStandardMaterial color="#0a0604" roughness={1} />
      </mesh>
      {/* Lantern body — offset down from pivot so it swings naturally */}
      <group position={[0, -0.3, 0]}>
        <primitive object={model} scale={0.4} />
      </group>
    </group>
  );
}

// ── Camera — sitting at the table, looking across it, not down on it ────────
function CameraInit({ firing }: { firing: boolean }) {
  useFrame(({ camera, clock }, delta) => {
    const lerp = Math.min(1, delta * 3);
    const sway = Math.sin(clock.elapsedTime * 0.4) * 0.006;
    // Eye-level view: lower the camera, look across the table not steeply down.
    camera.position.x += (0.0 + sway - camera.position.x) * lerp;
    camera.position.y += (0.55 - camera.position.y) * lerp;
    camera.position.z += (1.25 - camera.position.z) * lerp;
    // Look toward the far edge of the table, slight downward angle.
    camera.lookAt(0, 0.1, -0.6);

    if ("fov" in camera) {
      const persp = camera as THREE.PerspectiveCamera;
      const targetFov = firing ? 60 : 52;
      persp.fov += (targetFov - persp.fov) * lerp;
      persp.updateProjectionMatrix();
    }
  });
  return null;
}

// ── World-space gun — centered geometry, live/blank-aware effects ───────────
export type FireKind = "live" | "blank" | null;

function FPSGun({
  held,
  target,
  firing,
  onPickup,
}: {
  held: boolean;
  target: GunTarget;
  firing: FireKind;
  onPickup: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const muzzleFlash = useRef<THREE.PointLight>(null);
  const { scene } = useGLTF(MODEL_REVOLVER);

  // Center the geometry AND rotate it 90° on Y so the barrel aligns with
  // the gun group's local -Z axis. After this, the outer group's rotation
  // becomes intuitive: [0,0,0] → barrel forward (into scene), [0,π,0] →
  // barrel toward camera.
  const model = useMemo(() => {
    const cloned = scene.clone(true);

    // 1) Rotate the model so the barrel ends up along the group's -Z axis.
    //    Quaternius revolver's barrel is along its local +X by default.
    //    +π/2 Y rotation maps +X → -Z (forward, into the scene).
    cloned.rotation.y = Math.PI / 2;

    // 2) Compute bbox AFTER the rotation, recenter to parent origin.
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    cloned.position.sub(center);

    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = true;
      }
    });
    return cloned;
  }, [scene]);

  // After the inner rotation, barrel direction in OUTER local space is -Z.
  // Opponent: outer rotation [0, 0, 0] — barrel world -Z, away from camera.
  // Self:     outer rotation [0, π, 0] — barrel world +Z, toward camera.
  const BASE_EUL_OPP = useMemo(() => new THREE.Euler(0, 0, 0), []);
  const BASE_EUL_SELF = useMemo(() => new THREE.Euler(0, Math.PI, 0), []);

  // Position targets — resting on the table top, no clipping into wood.
  const BASE_POS_OPP = useMemo(() => new THREE.Vector3(0.15, 0.28, 0.55), []);
  const BASE_POS_SELF = useMemo(() => new THREE.Vector3(0.15, 0.28, 0.55), []);

  const fireStartedAt = useRef<number | null>(null);
  const fireKindAtStart = useRef<FireKind>(null);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    const lerp = Math.min(1, delta * 6);

    const tgtEul = target === "self" ? BASE_EUL_SELF : BASE_EUL_OPP;
    const tgtPos = target === "self" ? BASE_POS_SELF : BASE_POS_OPP;

    group.current.position.lerp(tgtPos, lerp);
    group.current.rotation.x += (tgtEul.x - group.current.rotation.x) * lerp;
    group.current.rotation.y += (tgtEul.y - group.current.rotation.y) * lerp;
    group.current.rotation.z += (tgtEul.z - group.current.rotation.z) * lerp;

    // Extremely subtle aim sway — barely noticeable, no more swinging
    if (held) {
      group.current.position.x += Math.sin(t * 0.8) * 0.0006;
      group.current.position.y += Math.cos(t * 1.0) * 0.0006;
    }

    // Fire — different intensity for live vs blank
    if (firing && fireStartedAt.current === null) {
      fireStartedAt.current = t;
      fireKindAtStart.current = firing;
    }
    if (fireStartedAt.current !== null) {
      const elapsed = t - fireStartedAt.current;
      const kind = fireKindAtStart.current;
      const duration = kind === "live" ? 0.6 : 0.25;
      if (elapsed < duration) {
        const e = Math.max(0, 1 - elapsed / duration);
        if (kind === "live") {
          // Full recoil + flash
          group.current.position.z += e * 0.22;
          group.current.position.y += e * 0.06;
          group.current.rotation.x -= e * 0.35 * delta * 6;
          if (muzzleFlash.current) muzzleFlash.current.intensity = e * 36;
        } else {
          // Blank — gentle mechanical click, no flash
          group.current.position.z += e * 0.04;
          if (muzzleFlash.current) muzzleFlash.current.intensity = 0;
        }
      } else {
        fireStartedAt.current = null;
        fireKindAtStart.current = null;
        if (muzzleFlash.current) muzzleFlash.current.intensity = 0;
      }
    } else if (muzzleFlash.current) {
      muzzleFlash.current.intensity = 0;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!held) onPickup();
  };

  return (
    <group
      ref={group}
      position={[0.15, 0.28, 0.55]}
      rotation={[0, 0, 0]}
      scale={[0.2, 0.2, 0.2]}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "default"; }}
    >
      <primitive object={model} />
      {/* Local fill light — keeps gun lit against the dark void */}
      <pointLight position={[0.3, 0.5, 0.3]} color="#ffd9a0" intensity={1.8} distance={2} decay={2} />
      {/* Muzzle flash — placed at barrel tip (outer local -Z = barrel direction) */}
      <pointLight ref={muzzleFlash} position={[0, 0.1, -0.65]} color="#ffaa22" intensity={0} distance={6} decay={2} />
    </group>
  );
}

// ── Scene contents ────────────────────────────────────────────────────────────
// Floor sits at Y=-0.5 and the KayKit character's feet are at its local Y=0, so
// character position.y = -0.5 plants the feet exactly on the floor. At scale
// 0.62 the ~2.17m rig becomes ~1.34m — torso visible above the table top
// (table top ≈ Y=0.16). The camera is at +Z looking -Z, so:
//   • PlayerOne (you) stands on the camera side and faces the opponent (-Z) → rotationY = π
//   • PlayerTwo (opponent) stands on the far side and faces you (+Z) → rotationY = 0
const CHARACTER_Y = -0.5;
const CHARACTER_SCALE = 0.62;

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

function Scene({
  gunHeld,
  setGunHeld,
  target,
  firing,
  isYourTurn,
  playerOneHp = 4,
  playerTwoHp = 4,
  playerOnePubkey = "",
  playerTwoPubkey = "",
  playerOneHitSignal = 0,
  playerTwoHitSignal = 0,
  liveCount = 5,
  blankCount = 3,
}: DuelArenaProps) {
  const matchOver = playerOneHp <= 0 || playerTwoHp <= 0;

  const playerOneState: CharacterState =
    playerOneHp <= 0 ? "dead" : matchOver ? "win" : "idle";
  const playerTwoState: CharacterState =
    playerTwoHp <= 0 ? "dead" : matchOver ? "win" : "idle";

  return (
    <>
      <CameraInit firing={firing === "live"} />
      {/* Very low ambient — keeps the dark-room mood */}
      <ambientLight intensity={0.04} color="#1a0c04" />
      <HangingSpot />

      {/* Floor — nearly black, catches the shadow pool */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#050302" roughness={1} metalness={0} />
      </mesh>

      <GLBModel src={MODEL_TABLE} position={[0, -0.5, 0]} scale={0.78} receiveShadow />

      {/* PlayerOne (you) — camera side, faces the opponent across the table */}
      <CharacterRig
        hue={hueFromPubkey(playerOnePubkey)}
        state={playerOneState}
        isTurn={isYourTurn && !matchOver}
        hitSignal={playerOneHitSignal}
        position={[-0.6, CHARACTER_Y, 0.8]}
        rotationY={Math.PI}
        scale={CHARACTER_SCALE}
      />

      {/* PlayerTwo (opponent) — far side, faces you / the camera */}
      <CharacterRig
        hue={hueFromPubkey(playerTwoPubkey)}
        state={playerTwoState}
        isTurn={!isYourTurn && !matchOver}
        hitSignal={playerTwoHitSignal}
        position={[0, CHARACTER_Y, -1.15]}
        rotationY={0}
        scale={CHARACTER_SCALE}
      />

      <FPSGun
        held={gunHeld}
        target={target}
        firing={firing}
        onPickup={() => setGunHeld(true)}
      />

      {/* Hanging lantern — swings gently, visible above the table */}
      <SwingingLantern />

      {/* Dynamic chamber bullets — live (hot) + blank (cold), animated in/out */}
      <BulletSet liveCount={liveCount} blankCount={blankCount} />
    </>
  );
}

// ── Main canvas ───────────────────────────────────────────────────────────────
export default function DuelArena3D({
  isYourTurn,
  gunHeld,
  setGunHeld,
  target,
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
  return (
    <Canvas
      shadows="basic"
      camera={{ position: [0.0, 0.55, 1.25], fov: 52 }}
      gl={{
        antialias: false,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.55,
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        background: "#000000",
        zIndex: 5,
      }}
    >
      <color attach="background" args={["#000000"]} />

      <Suspense fallback={<LoadingText />}>
        <Scene
          isYourTurn={isYourTurn}
          gunHeld={gunHeld}
          setGunHeld={setGunHeld}
          target={target}
          firing={firing}
          playerOneHp={playerOneHp}
          playerTwoHp={playerTwoHp}
          playerOnePubkey={playerOnePubkey}
          playerTwoPubkey={playerTwoPubkey}
          playerOneHitSignal={playerOneHitSignal}
          playerTwoHitSignal={playerTwoHitSignal}
          liveCount={liveCount}
          blankCount={blankCount}
        />
      </Suspense>

      <EffectComposer>
        <Pixelation granularity={4} />
        <Bloom
          intensity={0.45}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.5}
          mipmapBlur
        />
        <Noise opacity={0.04} />
        <Vignette eskil={false} offset={0.28} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}

useGLTF.preload(MODEL_TABLE);
useGLTF.preload(MODEL_REVOLVER);
useGLTF.preload(MODEL_LANTERN);
useGLTF.preload(MODEL_BULLET);
