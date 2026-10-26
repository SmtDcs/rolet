"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { RoletCard } from "@/hooks/useRolet";
import type { PixelBeat, PixelChamber } from "./PixelDuelStage";

// Camera sits on +z and looks toward -z, where the rival stands.
// The revolver's barrel is the group's local -z.
const CAM = new THREE.Vector3(0, 1.18, 1.7);
const LOOK = new THREE.Vector3(0, 1.18, -2.55);
const WALL = { w: 4.6, h: 2.59, y: 1.18, z: -2.55 };

type Space = "world" | "cam";
type Aim = "self" | "rival";
type Phase = "boot" | "table" | "held" | "act" | "over";

type GunPose = {
  space: Space;
  p: THREE.Vector3;
  r: THREE.Euler;
  scale: number;
  rate: number;
};

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const e = (x: number, y: number, z: number) => new THREE.Euler(x, y, z);

const POSE = {
  table: { space: "world" as Space, p: v(0, 0.62, 0.05), r: e(0.15, Math.PI / 2, 0), scale: 1, rate: 7 },
  held: { space: "cam" as Space, p: v(0.1, -0.24, -0.5), r: e(-0.55, 0.45, 0.55), scale: 1.25, rate: 6 },
  rival: { space: "cam" as Space, p: v(0.02, -0.12, -0.62), r: e(-0.08, 0.04, 0.02), scale: 1.35, rate: 8 },
  self: { space: "cam" as Space, p: v(0, 0.0, -0.2), r: e(0.15, Math.PI, 0), scale: 2.15, rate: 5 },
  dealer: { space: "world" as Space, p: v(0.18, 1.28, -1.15), r: e(0.2, -0.4, 1.2), scale: 1.1, rate: 4 },
};

const SHORT: Record<RoletCard, string> = {
  restoreBullet: "LOAD",
  hawkEye: "EYE",
  silence: "HUSH",
  blocker: "SHIELD",
  bulletExtractor: "EJECT",
  shuffler: "SHUFFLE",
  doubleStrike: "X2",
  healer: "HEAL",
  cardThief: "STEAL",
  randomInsight: "PEEK",
  lastChance: "LAST",
  handOfFate: "FATE",
};

export type BuckshotRoomProps = {
  chambers: PixelChamber[];
  chamberIndex: number;
  revealedIndex: number | null;
  yourLives: number;
  rivalLives: number;
  maxLives?: number;
  hand: (RoletCard | null)[];
  selectedSlot: number | null;
  onSelect: (slot: number | null) => void;
  yourTurn: boolean;
  busy?: boolean;
  silenced?: boolean;
  onShootSelf: () => void;
  onShootRival: () => void;
  onPlayCard: () => void;
  beat?: PixelBeat;
  notice?: string | null;
  onLeave?: () => void;
  muted?: boolean;
  onToggleMute?: () => void;
};

type ShotKind = "live-you" | "live-self" | "blank-you" | "blank-self";

export function BuckshotRoom(props: BuckshotRoomProps) {
  const {
    chambers, chamberIndex, revealedIndex, yourLives, rivalLives, maxLives = 4,
    hand, selectedSlot, onSelect, yourTurn, busy = false, silenced = false,
    onShootSelf, onShootRival, onPlayCard, beat = null, notice, onLeave, muted = false, onToggleMute,
  } = props;

  const [phase, setPhase] = useState<Phase>("boot");
  const [aim, setAim] = useState<Aim>("rival");
  const [tray, setTray] = useState(0);
  const [white, setWhite] = useState(false);
  const [black, setBlack] = useState(false);
  const [clickWord, setClickWord] = useState(false);
  const [flash, setFlash] = useState(0);
  const [cylSpin, setCylSpin] = useState(0);

  const pose = useRef<GunPose>(clonePose(POSE.table));
  const shake = useRef(new THREE.Vector3());
  const rivalShift = useRef(new THREE.Vector3());
  const rivalRot = useRef(0);
  const phaseRef = useRef<Phase>("boot");
  const aimRef = useRef<Aim>("rival");
  const seq = useRef(0);
  const dead = useRef(false);
  const ownShot = useRef(false);
  const ignoreChamber = useRef(false);
  const beatWait = useRef<(b: PixelBeat) => void>(() => {});
  const queue = useRef<ShotKind[]>([]);
  const pumping = useRef(false);
  const mode = useRef<Phase>("boot");
  const armed = useRef<number | null>(null);
  const turnRef = useRef(yourTurn);
  const livesRef = useRef({ you: yourLives, rival: rivalLives });
  const prev = useRef<{ index: number; you: number; rival: number } | null>(null);
  const apiRef = useRef({ boot: (_id: number) => Promise.resolve(), pump: () => Promise.resolve() });

  turnRef.current = yourTurn;
  livesRef.current = { you: yourLives, rival: rivalLives };
  phaseRef.current = phase;
  aimRef.current = aim;

  const alive = (id: number) => !dead.current && seq.current === id;
  const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

  function go(next: GunPose) {
    pose.current = clonePose(next);
  }

  async function shakeFor(id: number, amount: number, ms: number) {
    const until = performance.now() + ms;
    while (performance.now() < until && alive(id)) {
      shake.current.set((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount, 0);
      await sleep(40);
    }
    shake.current.set(0, 0, 0);
  }

  async function blackout(id: number) {
    setWhite(true);
    await sleep(80);
    if (!alive(id)) return false;
    setWhite(false);
    setBlack(true);
    await sleep(1700);
    if (!alive(id)) return false;
    setBlack(false);
    return true;
  }

  async function toTable(id: number) {
    go(POSE.table);
    await sleep(650);
    return alive(id);
  }

  async function throwRival(id: number, comeBack: boolean) {
    setFlash(1);
    rivalShift.current.set(-0.15, 0.05, -0.25);
    rivalRot.current = -0.2;
    void shakeFor(id, 0.05, 420);
    await sleep(180);
    if (!alive(id)) return;
    setFlash(0);
    rivalShift.current.set(-0.85, -0.15, -0.9);
    rivalRot.current = -0.7;
    await sleep(comeBack ? 1600 : 500);
    if (!alive(id) || !comeBack) return;
    rivalShift.current.set(0, 0, 0);
    rivalRot.current = 0;
    await sleep(700);
  }

  async function playRival(id: number, kind: ShotKind) {
    if (!alive(id)) return;
    mode.current = "act";
    setPhase("act");
    if (kind === "live-self" || kind === "blank-self") {
      go(POSE.dealer);
      await sleep(700);
      if (!alive(id)) return;
      if (kind === "blank-self") {
        setClickWord(true);
        rivalRot.current = 0.08;
        await shakeFor(id, 0.015, 280);
        setClickWord(false);
        rivalRot.current = 0;
        mode.current = "table";
        setPhase("table");
        return;
      }
      await throwRival(id, livesRef.current.rival > 0);
      if (!alive(id)) return;
      if (livesRef.current.rival <= 0) {
        mode.current = "over";
        setPhase("over");
        return;
      }
      await toTable(id);
      mode.current = "table";
      setPhase("table");
      return;
    }
    go(POSE.self);
    await sleep(900);
    if (!alive(id)) return;
    if (kind === "blank-you") {
      setClickWord(true);
      await shakeFor(id, 0.02, 260);
      setClickWord(false);
      if (!alive(id)) return;
      await toTable(id);
      mode.current = "table";
      setPhase("table");
      return;
    }
    const ok = await blackout(id);
    if (!ok) return;
    if (livesRef.current.you <= 0) {
      mode.current = "over";
      setPhase("over");
      return;
    }
    await toTable(id);
    mode.current = "table";
    setPhase("table");
  }

  async function pump() {
    if (mode.current === "act" || mode.current === "boot") return;
    if (pumping.current) return;
    pumping.current = true;
    const id = seq.current;
    try {
      while (queue.current.length && alive(id) && mode.current !== "over") {
        const kind = queue.current.shift();
        if (!kind) break;
        await playRival(id, kind);
      }
    } finally {
      pumping.current = false;
    }
  }

  async function finishTurn(id: number) {
    if (!alive(id)) return;
    if (livesRef.current.you <= 0 || livesRef.current.rival <= 0) {
      mode.current = "over";
      setPhase("over");
      return;
    }
    if (queue.current.length || !turnRef.current) {
      go(POSE.dealer);
      mode.current = "act";
      setPhase("act");
      await sleep(900);
      if (!alive(id)) return;
      mode.current = "table";
      await pump();
      const now = mode.current as Phase;
      if (now !== "over" && turnRef.current && !queue.current.length) {
        await toTable(id);
        mode.current = "table";
        setPhase("table");
      }
      return;
    }
    mode.current = "table";
    setPhase("table");
  }

  async function playerShot(which: Aim) {
    if (mode.current !== "held") return;
    const id = seq.current;
    mode.current = "act";
    setPhase("act");
    go(which === "self" ? POSE.self : POSE.rival);
    await sleep(which === "self" ? 1100 : 700);
    if (!alive(id)) return;
    if (which === "self") await sleep(300);
    ignoreChamber.current = true;
    ownShot.current = true;
    const pending = new Promise<PixelBeat | null>((resolve) => {
      const timer = window.setTimeout(() => resolve(null), 12000);
      beatWait.current = (next) => {
        window.clearTimeout(timer);
        beatWait.current = () => {};
        resolve(next);
      };
    });
    if (which === "self") onShootSelf();
    else onShootRival();
    const result = await pending;
    if (!alive(id)) return;
    if (result === "hit-you" || result === "hit-rival") {
      if (result === "hit-you") {
        const ok = await blackout(id);
        if (!ok) return;
      } else {
        await throwRival(id, livesRef.current.rival > 0);
        if (!alive(id)) return;
      }
      if (livesRef.current.you <= 0 || livesRef.current.rival <= 0) {
        mode.current = "over";
        setPhase("over");
        return;
      }
      await toTable(id);
      await finishTurn(id);
      return;
    }
    setClickWord(true);
    await shakeFor(id, 0.018, 280);
    setClickWord(false);
    if (!alive(id)) return;
    await toTable(id);
    await finishTurn(id);
  }

  async function pickup() {
    if (mode.current !== "table" || !turnRef.current || busy) return;
    mode.current = "act";
    setPhase("act");
    go(POSE.held);
    await sleep(700);
    if (dead.current) return;
    mode.current = "held";
    setPhase("held");
    setAim("rival");
  }

  async function boot(id: number) {
    const fresh =
      chamberIndex === 0 &&
      chambers.length >= 8 &&
      chambers.every((hole) => hole === "live" || hole === "blank") &&
      yourLives === maxLives &&
      rivalLives === maxLives;
    go(POSE.table);
    if (!fresh) {
      mode.current = "table";
      setPhase("table");
      if (!turnRef.current) void pump();
      return;
    }
    mode.current = "boot";
    setPhase("boot");
    setTray(1);
    await sleep(2800);
    if (!alive(id)) return;
    setTray(0);
    go(POSE.dealer);
    await sleep(800);
    for (let i = 0; i < 5; i++) {
      setCylSpin((n) => n + 1);
      await sleep(280);
      if (!alive(id)) return;
    }
    go(POSE.table);
    await sleep(700);
    if (!alive(id)) return;
    mode.current = "table";
    setPhase("table");
  }

  apiRef.current = { boot, pump };

  useEffect(() => {
    const cur = { index: chamberIndex, you: yourLives, rival: rivalLives };
    const was = prev.current;
    prev.current = cur;
    if (!was) return;
    if (cur.you < was.you || cur.rival < was.rival) {
      /* lives changed; the shot film already running reads the refs */
    }
    if (ownShot.current && beat) {
      ownShot.current = false;
      beatWait.current(beat);
    } else if (cur.index !== was.index && !ignoreChamber.current && !ownShot.current) {
      let kind: ShotKind;
      if (cur.you < was.you) kind = "live-you";
      else if (cur.rival < was.rival) kind = "live-self";
      else if (!yourTurn) kind = "blank-self";
      else kind = "blank-you";
      queue.current.push(kind);
      void apiRef.current.pump();
    }
    if (cur.index !== was.index && ignoreChamber.current && !ownShot.current) ignoreChamber.current = false;
  }, [beat, chamberIndex, yourLives, rivalLives, yourTurn]);

  useEffect(() => {
    if (armed.current == null || selectedSlot !== armed.current) return;
    armed.current = null;
    onPlayCard();
  }, [selectedSlot, onPlayCard]);

  useEffect(() => {
    if (chambers.length < 8) return;
    let cancelled = false;
    void (async () => {
      await sleep(0);
      if (cancelled || dead.current) return;
      await apiRef.current.boot(seq.current);
    })();
    return () => {
      cancelled = true;
      seq.current += 1;
    };
    // The opening load runs once, when the chamber list arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chambers.length]);

  useEffect(() => {
    dead.current = false;
    return () => {
      dead.current = true;
    };
  }, []);

  const holes = Array.from({ length: 8 }, (_, i) => chambers[i] ?? "empty");
  const freshGun = chamberIndex === 0 && holes.every((hole) => hole !== "empty");
  const shown = freshGun ? "?" : `${Math.min(8, chamberIndex + 1)}/8`;
  const cardsOpen = phase === "table" && yourTurn && !busy;

  return (
    <div className="fixed inset-0 bg-[#141414] text-[#e6e1d6]" style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}>
      <Canvas
        dpr={1}
        gl={{ antialias: false, alpha: false }}
        camera={{ fov: 34, position: [CAM.x, CAM.y, CAM.z], near: 0.05, far: 40 }}
        onPointerMissed={() => { /* clicks land on the aim plane while the gun is held */ }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={["#141414"]} />
          <CameraRig shake={shake} />
          <hemisphereLight args={["#e6d2b0", "#141414", 0.35]} />
          <spotLight position={[-1.7, 2.5, 0.4]} angle={0.55} penumbra={0.4} intensity={18} color="#d9963a" />
          <spotLight position={[1.5, 2.3, 0.2]} angle={0.5} penumbra={0.5} intensity={10} color="#ffb46a" />
          <Room rivalShift={rivalShift} rivalRot={rivalRot} />
          <Cylinder
            holes={holes}
            index={chamberIndex}
            revealed={revealedIndex}
            spin={cylSpin}
            label={shown}
          />
          <Lives who="rival" n={rivalLives} max={maxLives} y={0.78} z={-0.35} color="#d2462b" />
          <Lives who="you" n={yourLives} max={maxLives} y={0.42} z={0.72} color="#ffc15e" />
          {tray > 0 && <ShellTray />}
          <Cards
            hand={hand}
            open={cardsOpen}
            silenced={silenced}
            selected={selectedSlot}
            onPlay={(slot) => {
              if (!cardsOpen || silenced) return;
              if (selectedSlot === slot) onPlayCard();
              else {
                armed.current = slot;
                onSelect(slot);
              }
            }}
          />
          <Gun pose={pose} clickable={phase === "table" && yourTurn && !busy} onTake={() => { void pickup(); }} />
          {phase === "held" && (
            <mesh
              position={[0, 1.05, 0.35]}
              onPointerMove={(ev) => {
                const next: Aim = ev.pointer.y > -0.05 ? "rival" : "self";
                if (aimRef.current !== next) {
                  aimRef.current = next;
                  setAim(next);
                  go(next === "self" ? POSE.self : POSE.rival);
                }
              }}
              onClick={(ev) => {
                ev.stopPropagation();
                const which: Aim = ev.pointer.y > -0.05 ? "rival" : "self";
                void playerShot(which);
              }}
            >
              <planeGeometry args={[6, 4]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
          {flash > 0 && (
            <pointLight position={[0, 1.35, -1.2]} color="#fff1c4" intensity={12} distance={3} />
          )}
        </Suspense>
      </Canvas>

      {clickWord && (
        <div className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 border-[3px] border-[#141414] bg-[#e6e1d6] px-3 py-1 text-lg font-bold tracking-[0.18em] text-[#141414] shadow-[4px_4px_0_#000]">
          CLICK
        </div>
      )}
      {white && <div className="pointer-events-none absolute inset-0 z-20 bg-white" />}
      {black && <div className="absolute inset-0 z-20 bg-black" />}
      {phase === "over" && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black text-2xl tracking-[0.22em]">
          <b>{yourLives <= 0 ? "YOU ARE DOWN" : "RIVAL IS DOWN"}</b>
        </div>
      )}
      {onLeave && (
        <button type="button" className="absolute left-3 top-3 z-40 border-2 border-[#2e333a] bg-[#16181b] px-2 py-1 text-[11px] tracking-[0.16em]" onClick={onLeave}>
          LEAVE
        </button>
      )}
      {onToggleMute && (
        <button type="button" className="absolute right-3 top-3 z-40 border-2 border-[#2e333a] bg-[#16181b] px-2 py-1 text-[11px] tracking-[0.16em]" onClick={onToggleMute}>
          {muted ? "SOUND OFF" : "SOUND ON"}
        </button>
      )}
      {notice && (
        <div className="absolute left-1/2 top-3 z-40 -translate-x-1/2 border-2 border-[#3a4046] bg-[#121416] px-3 py-1 text-[12px] font-bold tracking-[0.16em] text-[#f0b04a]">
          {notice}
        </div>
      )}
      {phase === "held" && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-[11px] tracking-[0.18em] text-[#c8bfa8]">
          {aim === "self" ? "BARREL ON YOU" : "BARREL ON HIM"}
        </div>
      )}
    </div>
  );
}

function clonePose(src: GunPose): GunPose {
  return { space: src.space, p: src.p.clone(), r: src.r.clone(), scale: src.scale, rate: src.rate };
}

function CameraRig({ shake }: { shake: MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.set(CAM.x + shake.current.x, CAM.y + shake.current.y, CAM.z);
    camera.lookAt(LOOK);
  });
  return null;
}

function skipRay() {}

function pixelMap(url: string) {
  const tex = useTexture(url);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function Room({
  rivalShift,
  rivalRot,
}: {
  rivalShift: MutableRefObject<THREE.Vector3>;
  rivalRot: MutableRefObject<number>;
}) {
  const bg = pixelMap("/duel-pixel/bg.jpg");
  const figure = pixelMap("/duel-pixel/character-idle.png");
  const cut = 0.556;
  const clipped = useMemo(() => {
    const tex = figure.clone();
    tex.repeat.set(1, cut);
    tex.offset.set(0, 1 - cut);
    tex.needsUpdate = true;
    return tex;
  }, [figure]);
  const ref = useRef<THREE.Mesh>(null);
  const cutH = WALL.h * cut;
  const cutY = WALL.y + WALL.h * (0.5 - cut / 2);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.position.x += (rivalShift.current.x - mesh.position.x) * 0.08;
    mesh.position.y = cutY + rivalShift.current.y;
    mesh.position.z = WALL.z + 0.08 + rivalShift.current.z;
    mesh.rotation.z += (rivalRot.current - mesh.rotation.z) * 0.12;
  });
  return (
    <group>
      <mesh position={[0, WALL.y, WALL.z]} raycast={skipRay}>
        <planeGeometry args={[WALL.w, WALL.h]} />
        <meshBasicMaterial map={bg} toneMapped={false} />
      </mesh>
      <mesh ref={ref} position={[0, cutY, WALL.z + 0.08]} raycast={skipRay}>
        <planeGeometry args={[WALL.w, cutH]} />
        <meshBasicMaterial map={clipped} transparent alphaTest={0.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Cylinder({
  holes, index, revealed, spin, label,
}: {
  holes: PixelChamber[];
  index: number;
  revealed: number | null;
  spin: number;
  label: string;
}) {
  return (
    <group position={[0, 0.72, -0.15]} rotation={[-1.15, 0, spin * 0.2]}>
      <mesh>
        <cylinderGeometry args={[0.09, 0.09, 0.03, 16]} />
        <meshStandardMaterial color="#8d939a" metalness={0.65} roughness={0.35} />
      </mesh>
      {holes.map((hole, i) => {
        const a = (-90 + i * 45) * (Math.PI / 180);
        const open = revealed === i && hole !== "empty";
        const color = hole === "empty" ? "#1a1c1f" : open && hole === "live" ? "#d2462b" : open && hole === "blank" ? "#3f7f74" : "#141618";
        return (
          <mesh key={i} position={[Math.cos(a) * 0.055, 0.02, Math.sin(a) * 0.055]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.014, 8]} />
            <meshBasicMaterial color={i === index && hole !== "empty" ? "#e6e1d6" : color} />
          </mesh>
        );
      })}
      <Html center position={[0, 0.04, 0]} style={{ color: "#e6e1d6", fontWeight: 700, fontSize: 11, pointerEvents: "none" }} distanceFactor={1.6}>
        {label}
      </Html>
    </group>
  );
}

function Lives({ who, n, max, y, z, color }: { who: string; n: number; max: number; y: number; z: number; color: string }) {
  return (
    <group position={[0, y, z]}>
      {Array.from({ length: max }).map((_, i) => (
        <mesh key={i} position={[(i - (max - 1) / 2) * 0.05, 0, 0]}>
          <sphereGeometry args={[0.016, 8, 8]} />
          <meshStandardMaterial
            color={i < n ? color : "#2a2118"}
            emissive={i < n ? color : "#000"}
            emissiveIntensity={i < n ? 0.8 : 0}
          />
        </mesh>
      ))}
      <Html position={[0, 0.06, 0]} center style={{ fontSize: 9, letterSpacing: "0.14em", color: "#8a8478", pointerEvents: "none" }}>
        {who === "you" ? "" : ""}
      </Html>
    </group>
  );
}

function ShellTray() {
  const shells = [...Array(5).fill("live"), ...Array(3).fill("blank")];
  return (
    <group position={[0, 0.7, 0.15]}>
      {shells.map((kind, i) => (
        <mesh key={i} position={[(i - 3.5) * 0.06, 0, 0]} rotation={[0, 0, 0.2]}>
          <capsuleGeometry args={[0.012, 0.04, 2, 6]} />
          <meshStandardMaterial color={kind === "live" ? "#d2462b" : "#3a3a3a"} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Cards({
  hand, open, silenced, selected, onPlay,
}: {
  hand: (RoletCard | null)[];
  open: boolean;
  silenced: boolean;
  selected: number | null;
  onPlay: (slot: number) => void;
}) {
  const tex = pixelMap("/duel-pixel/card.png");
  return (
    <group>
      {hand.map((card, i) => {
        if (!card) return null;
        const x = (i - 1.5) * 0.2;
        return (
          <mesh
            key={i}
            position={[x, selected === i ? 0.58 : 0.52, 0.48]}
            rotation={[-1.05, 0, (i - 1.5) * 0.06]}
            onClick={(ev) => {
              ev.stopPropagation();
              if (open && !silenced) onPlay(i);
            }}
          >
            <planeGeometry args={[0.1, 0.14]} />
            <meshStandardMaterial map={tex} transparent opacity={open ? 1 : 0.45} roughness={0.9} />
            <Html center position={[0, -0.01, 0.01]} distanceFactor={2.2} style={{ fontSize: 13, fontWeight: 700, color: "#1a140f", pointerEvents: "none" }}>
              {SHORT[card]}
            </Html>
          </mesh>
        );
      })}
    </group>
  );
}

function Gun({
  pose, clickable, onTake,
}: {
  pose: MutableRefObject<GunPose>;
  clickable: boolean;
  onTake: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const { camera, scene } = useThree();
  const shown = useRef(clonePose(POSE.table));
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = pose.current;
    const parent = target.space === "cam" ? camera : scene;
    if (g.parent !== parent) {
      parent.add(g);
      shown.current.space = target.space;
      shown.current.p.copy(target.p);
      shown.current.r.copy(target.r);
    }
    const k = 1 - Math.exp(-target.rate * dt);
    shown.current.p.lerp(target.p, k);
    shown.current.r.x += (target.r.x - shown.current.r.x) * k;
    shown.current.r.y += (target.r.y - shown.current.r.y) * k;
    shown.current.r.z += (target.r.z - shown.current.r.z) * k;
    shown.current.scale += (target.scale - shown.current.scale) * k;
    g.position.copy(shown.current.p);
    g.rotation.copy(shown.current.r);
    g.scale.setScalar(shown.current.scale);
  });
  return (
    <group
      ref={ref}
      onClick={(ev) => {
        if (!clickable) return;
        ev.stopPropagation();
        onTake();
      }}
    >
      <Revolver />
    </group>
  );
}

function Revolver() {
  const gltf = useGLTF("/duel-pixel/models/gun.glb");
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  // Meshy fits the revolver in a 2-unit box. Barrel forward is measured on screen.
  return <primitive object={model} scale={0.16} />;
}

useGLTF.preload("/duel-pixel/models/gun.glb");
