"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { RoletCard } from "@/hooks/useRolet";
import styles from "./PixelDuelStage.module.css";

export type PixelChamber = "live" | "blank" | "empty";
export type PixelBeat = "click" | "hit-you" | "hit-rival" | null;

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

const TILT = [-6, -2, 3, 6];

// Swap these files to change the rival. Same canvas, transparent around the figure.
const CHARACTER_IDLE = "/duel-pixel/character-idle.png";
const CHARACTER_HURT = "/duel-pixel/character-hurt.png";

type Pose = { x: number; y: number; rot: number; w: number };
type Phase = "boot" | "table" | "ready" | "act" | "grab" | "float" | "over";
type RivalKind = "live-you" | "live-self" | "blank-you" | "blank-self";
type Blink = { who: "you" | "rival"; from: number; to: number; heal?: boolean };

const TABLE: Pose = { x: 50, y: 73, rot: -8, w: 8.5 };
const HELD: Pose = { x: 46, y: 80, rot: -58, w: 18 };
const TILT_SELF: Pose = { x: 38, y: 82, rot: -78, w: 18 };
const TILT_RIVAL: Pose = { x: 58, y: 74, rot: -34, w: 18 };
const AIM_RIVAL: Pose = { x: 50, y: 48, rot: -82, w: 16 };
const FLOAT: Pose = { x: 54, y: 34, rot: -18, w: 12 };
const CHIN: Pose = { x: 50, y: 30, rot: -70, w: 12 };
const SIDE: Pose = { x: 64, y: 34, rot: 18, w: 13 };
const OFF: Pose = { x: 50, y: 128, rot: -124, w: 22 };

const SPLAT = [
  [8, 18], [18, 30], [30, 12], [44, 22], [62, 14], [76, 28], [88, 16],
  [14, 48], [36, 42], [58, 50], [82, 44], [24, 64], [70, 66], [48, 8], [92, 58],
];

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function lerp(a: Pose, b: Pose, t: number): Pose {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    rot: a.rot + (b.rot - a.rot) * t,
    w: a.w + (b.w - a.w) * t,
  };
}

function blip(kind: "pickup" | "cock" | "click" | "shot", muted: boolean) {
  if (muted || typeof window === "undefined") return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const end = kind === "shot" ? 0.28 : 0.16;
  if (kind === "shot") {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * end), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } else {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = kind === "click" ? 160 : kind === "cock" ? 90 : 220;
    if (kind === "pickup") osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(kind === "click" ? 0.08 : 0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + end);
  }
  window.setTimeout(() => void ctx.close(), 600);
}

export type PixelDuelStageProps = {
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
  nextLabel?: string | null;
  notice?: string | null;
  onLeave?: () => void;
  muted?: boolean;
  onToggleMute?: () => void;
};

export function PixelDuelStage({
  chambers,
  chamberIndex,
  revealedIndex,
  yourLives,
  rivalLives,
  maxLives = 4,
  hand,
  selectedSlot,
  onSelect,
  yourTurn,
  busy = false,
  silenced = false,
  onShootSelf,
  onShootRival,
  onPlayCard,
  beat = null,
  notice = null,
  onLeave,
  muted = false,
  onToggleMute,
}: PixelDuelStageProps) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [pose, setPose] = useState<Pose>(TABLE);
  const [muzzle, setMuzzle] = useState(0);
  const [hammer, setHammer] = useState<0 | 1 | 2>(0);
  const [white, setWhite] = useState(false);
  const [black, setBlack] = useState(false);
  const [splatter, setSplatter] = useState(0);
  const [bang, setBang] = useState(false);
  const [smoke, setSmoke] = useState(0);
  const [shake, setShake] = useState<"" | "lite" | "hard">("");
  const [thrown, setThrown] = useState<"" | "out" | "back">("");
  const [rattle, setRattle] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [trayY, setTrayY] = useState(0);
  const [reach, setReach] = useState(0);
  const [shield, setShield] = useState(false);
  const [shell, setShell] = useState<PixelChamber | null>(null);
  const [blink, setBlink] = useState<Blink | null>(null);
  const [clickWord, setClickWord] = useState(false);
  const [cardFx, setCardFx] = useState<{ slot: number; card: RoletCard; stage: "slide" | "act" | "dust" } | null>(null);
  const [cylTurn, setCylTurn] = useState(0);

  const seq = useRef(0);
  const dead = useRef(false);
  const mode = useRef<Phase>("boot");
  const poseRef = useRef(TABLE);
  const queue = useRef<RivalKind[]>([]);
  const pumping = useRef(false);
  const ownShot = useRef(false);
  const ignoreChamber = useRef(false);
  const suppress = useRef(false);
  const beatWait = useRef<(beat: PixelBeat) => void>(() => {});
  const cover = useRef(false);
  const pendingBlink = useRef<Blink | null>(null);
  const blinkTimer = useRef(0);
  const armed = useRef<number | null>(null);
  const prevWatch = useRef<{ index: number; you: number; rival: number } | null>(null);

  const turnRef = useRef(yourTurn);
  const busyRef = useRef(busy);
  const mutedRef = useRef(muted);
  const livesRef = useRef({ you: yourLives, rival: rivalLives });
  const chambersRef = useRef(chambers);
  const indexRef = useRef(chamberIndex);
  const handRef = useRef(hand);
  const watchRef = useRef({ beat, chamberIndex, yourLives, rivalLives, yourTurn });
  turnRef.current = yourTurn;
  busyRef.current = busy;
  mutedRef.current = muted;
  livesRef.current = { you: yourLives, rival: rivalLives };
  chambersRef.current = chambers;
  indexRef.current = chamberIndex;
  handRef.current = hand;
  watchRef.current = { beat, chamberIndex, yourLives, rivalLives, yourTurn };

  const alive = (id: number) => !dead.current && seq.current === id;

  function move(next: Pose) {
    poseRef.current = next;
    setPose(next);
  }

  function showBlink(next: Blink) {
    setBlink(next);
    window.clearTimeout(blinkTimer.current);
    blinkTimer.current = window.setTimeout(() => setBlink(null), 520);
  }

  function noteDrop(who: "you" | "rival", from: number, to: number, heal = false) {
    const payload: Blink = { who, from, to, heal };
    if (cover.current) pendingBlink.current = payload;
    else showBlink(payload);
  }

  function flushBlink() {
    cover.current = false;
    const payload = pendingBlink.current;
    pendingBlink.current = null;
    if (payload) showBlink(payload);
  }

  async function frames(id: number, count: number, total: number, apply: (t: number) => void) {
    const slice = total / count;
    for (let i = 1; i <= count; i++) {
      if (!alive(id)) return false;
      apply(i / count);
      await sleep(slice);
    }
    return alive(id);
  }

  async function pokeShake(id: number, kind: "lite" | "hard") {
    setShake("");
    await sleep(30);
    if (!alive(id)) return;
    setShake(kind);
    await sleep(kind === "hard" ? 420 : 300);
    if (alive(id)) setShake("");
  }

  async function toTable(id: number) {
    setMuzzle(0);
    setHammer(0);
    const start = poseRef.current.y > 110 ? OFF : poseRef.current;
    await frames(id, 4, 500, (t) => move(lerp(start, TABLE, t)));
  }

  function armBeat() {
    return new Promise<PixelBeat | null>((resolve) => {
      const timer = window.setTimeout(() => {
        beatWait.current = () => {};
        resolve(null);
      }, 12000);
      beatWait.current = (next) => {
        window.clearTimeout(timer);
        beatWait.current = () => {};
        resolve(next);
      };
    });
  }

  async function blackout(id: number) {
    setWhite(true);
    blip("shot", mutedRef.current);
    await sleep(80);
    if (!alive(id)) return false;
    setWhite(false);
    setBlack(true);
    await sleep(1700);
    if (!alive(id)) return false;
    setBlack(false);
    return true;
  }

  async function throwRival(id: number, comeBack: boolean) {
    setBang(true);
    setSmoke(1);
    setSplatter(1);
    setThrown("out");
    blip("shot", mutedRef.current);
    void pokeShake(id, "hard");
    await sleep(120);
    if (!alive(id)) return;
    setSmoke(2);
    setSplatter(2);
    await sleep(120);
    setBang(false);
    setSmoke(3);
    setSplatter(3);
    await sleep(140);
    setSmoke(0);
    setSplatter(0);
    await sleep(comeBack ? 1600 : 400);
    if (!alive(id)) return;
    if (!comeBack) return;
    setThrown("back");
    await sleep(700);
    if (alive(id)) setThrown("");
  }

  async function playRival(id: number, kind: RivalKind) {
    if (!alive(id)) return;
    mode.current = "act";
    setPhase("act");
    cover.current = true;
    if (kind === "live-self" || kind === "blank-self") {
      const start = poseRef.current;
      await frames(id, 6, 700, (t) => move(lerp(start, CHIN, t)));
      if (!alive(id)) return;
      if (kind === "blank-self") {
        blip("click", mutedRef.current);
        setClickWord(true);
        setRattle(true);
        await pokeShake(id, "lite");
        setClickWord(false);
        setRattle(false);
        if (!alive(id)) return;
        await frames(id, 4, 400, (t) => move(lerp(CHIN, FLOAT, t)));
        flushBlink();
        mode.current = "float";
        setPhase("float");
        return;
      }
      await throwRival(id, livesRef.current.rival > 0);
      if (!alive(id)) return;
      if (livesRef.current.rival <= 0) {
        mode.current = "over";
        setPhase("over");
        flushBlink();
        return;
      }
      await toTable(id);
      flushBlink();
      mode.current = "table";
      setPhase("table");
      return;
    }

    setMuzzle(0.2);
    await frames(id, 6, 700, (t) => setMuzzle(0.35 + t * 0.65));
    if (!alive(id)) return;
    setHammer(1);
    await sleep(80);
    setHammer(2);
    await sleep(300);
    if (!alive(id)) return;
    if (kind === "blank-you") {
      blip("click", mutedRef.current);
      setClickWord(true);
      setMuzzle(0);
      setHammer(0);
      await pokeShake(id, "lite");
      setClickWord(false);
      if (!alive(id)) return;
      await toTable(id);
      flushBlink();
      mode.current = "table";
      setPhase("table");
      return;
    }
    const ok = await blackout(id);
    if (!ok) return;
    setMuzzle(0);
    setHammer(0);
    if (livesRef.current.you <= 0) {
      mode.current = "over";
      setPhase("over");
      flushBlink();
      return;
    }
    await toTable(id);
    flushBlink();
    mode.current = "table";
    setPhase("table");
  }

  async function pump() {
    if (mode.current === "act" || mode.current === "boot" || mode.current === "grab") return;
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
    const phaseNow = mode.current as string;
    if (queue.current.length && alive(id) && phaseNow !== "over") void pump();
  }

  async function grab(id: number) {
    if (!alive(id)) return;
    if (livesRef.current.you <= 0 || livesRef.current.rival <= 0) {
      mode.current = "over";
      setPhase("over");
      return;
    }
    mode.current = "grab";
    setPhase("grab");
    setMuzzle(0);
    const start = poseRef.current;
    const ok = await frames(id, 8, 1500, (t) => {
      setReach(t < 0.62 ? t / 0.62 : 1 - (t - 0.62) / 0.38);
      move(lerp(start, FLOAT, t));
    });
    setReach(0);
    if (!ok) return;
    mode.current = "float";
    setPhase("float");
    await pump();
  }

  async function finishTurn(id: number) {
    if (!alive(id)) return;
    if (livesRef.current.you <= 0 || livesRef.current.rival <= 0) {
      mode.current = "over";
      setPhase("over");
      flushBlink();
      return;
    }
    if (queue.current.length || !turnRef.current) {
      await grab(id);
      return;
    }
    mode.current = "table";
    setPhase("table");
  }

  async function playerShot(which: "self" | "rival") {
    if (mode.current !== "ready") return;
    const id = seq.current;
    mode.current = "act";
    setPhase("act");
    cover.current = true;
    if (which === "self") {
      const start = poseRef.current;
      let ok = await frames(id, 4, 300, (t) => move(lerp(start, OFF, t)));
      if (!ok) return;
      setMuzzle(0.15);
      ok = await frames(id, 8, 800, (t) => setMuzzle(0.2 + t * 0.8));
      if (!ok) return;
      setHammer(1);
      blip("cock", mutedRef.current);
      await sleep(90);
      if (!alive(id)) return;
      setHammer(2);
      blip("cock", mutedRef.current);
      await sleep(90);
      await sleep(300);
      if (!alive(id)) return;
      ignoreChamber.current = true;
      ownShot.current = true;
      const pending = armBeat();
      onShootSelf();
      const result = await pending;
      if (!alive(id)) return;
      if (result === "hit-you") {
        const gone = await blackout(id);
        if (!gone) return;
        setMuzzle(0);
        setHammer(0);
        if (livesRef.current.you <= 0) {
          mode.current = "over";
          setPhase("over");
          flushBlink();
          return;
        }
        await toTable(id);
        flushBlink();
        await finishTurn(id);
        return;
      }
      blip("click", mutedRef.current);
      setClickWord(true);
      setMuzzle(0);
      setHammer(0);
      await pokeShake(id, "lite");
      setClickWord(false);
      if (!alive(id)) return;
      await toTable(id);
      flushBlink();
      mode.current = "table";
      setPhase("table");
      return;
    }

    const start = poseRef.current;
    const aimed = await frames(id, 8, 1000, (t) => move(lerp(start, AIM_RIVAL, t)));
    if (!aimed) return;
    ignoreChamber.current = true;
    ownShot.current = true;
    const pending = armBeat();
    onShootRival();
    const result = await pending;
    if (!alive(id)) return;
    if (result === "hit-rival") {
      await throwRival(id, livesRef.current.rival > 0);
      if (!alive(id)) return;
      if (livesRef.current.rival <= 0) {
        mode.current = "over";
        setPhase("over");
        flushBlink();
        return;
      }
      await toTable(id);
      flushBlink();
      await finishTurn(id);
      return;
    }
    blip("click", mutedRef.current);
    setClickWord(true);
    await pokeShake(id, "lite");
    setClickWord(false);
    if (!alive(id)) return;
    await toTable(id);
    flushBlink();
    await finishTurn(id);
  }

  async function pickup(id = seq.current) {
    if (mode.current !== "table" || !turnRef.current || busyRef.current) return;
    mode.current = "act";
    setPhase("act");
    blip("pickup", mutedRef.current);
    const ok = await frames(id, 5, 700, (t) => move(lerp(TABLE, HELD, t)));
    if (!ok) return;
    mode.current = "ready";
    setPhase("ready");
  }

  async function boot(id: number) {
    const fresh =
      indexRef.current === 0 &&
      chambersRef.current.length >= 8 &&
      chambersRef.current.every((hole) => hole === "live" || hole === "blank") &&
      livesRef.current.you === maxLives &&
      livesRef.current.rival === maxLives;
    if (!fresh) {
      if (livesRef.current.you <= 0 || livesRef.current.rival <= 0) {
        mode.current = "over";
        setPhase("over");
        return;
      }
      move(TABLE);
      mode.current = "table";
      setPhase("table");
      if (!turnRef.current) await grab(id);
      return;
    }
    mode.current = "boot";
    setPhase("boot");
    let ok = await frames(id, 6, 800, (t) => setTrayY(88 - 14 * t));
    if (!ok) return;
    await sleep(2600);
    if (!alive(id)) return;
    ok = await frames(id, 5, 600, (t) => setTrayY(74 + 14 * t));
    if (!ok) return;
    setTrayY(0);
    ok = await frames(id, 6, 800, (t) => move(lerp(TABLE, SIDE, t)));
    if (!ok) return;
    for (let click = 0; click < 6; click++) {
      setCylTurn(-40);
      await sleep(110);
      if (!alive(id)) return;
      setCylTurn(0);
      await sleep(260);
    }
    await sleep(700);
    if (!alive(id)) return;
    ok = await frames(id, 5, 700, (t) => move(lerp(SIDE, TABLE, t)));
    if (!ok) return;
    mode.current = "table";
    setPhase("table");
    if (!turnRef.current) await grab(id);
  }

  async function playCard(slot: number) {
    const card = handRef.current[slot];
    if (!card || mode.current !== "table" || !turnRef.current || busyRef.current || silenced) return;
    const id = seq.current;
    mode.current = "act";
    setPhase("act");
    const ejected = chambersRef.current[indexRef.current] ?? "empty";
    setCardFx({ slot, card, stage: "slide" });
    await sleep(480);
    if (!alive(id)) return;
    setCardFx({ slot, card, stage: "act" });
    suppress.current = true;
    if (selectedSlot === slot) onPlayCard();
    else {
      armed.current = slot;
      onSelect(slot);
    }
    if (card === "hawkEye" || card === "randomInsight") {
      await frames(id, 4, 350, (t) => setZoom(1 + t * 0.55));
      await sleep(1000);
      if (!alive(id)) return;
      await frames(id, 4, 300, (t) => setZoom(1.55 - t * 0.55));
    } else if (card === "blocker") {
      setShield(true);
      await sleep(700);
      setShield(false);
    } else if (card === "bulletExtractor" && ejected !== "empty") {
      setShell(ejected);
      setCylTurn(-40);
      await sleep(120);
      setCylTurn(0);
      await sleep(900);
      setShell(null);
    } else if (card === "shuffler") {
      for (let click = 0; click < 4; click++) {
        setCylTurn(-40);
        await sleep(90);
        setCylTurn(0);
        await sleep(130);
        if (!alive(id)) return;
      }
    } else {
      await sleep(900);
    }
    if (!alive(id)) return;
    setCardFx({ slot, card, stage: "dust" });
    await sleep(420);
    setCardFx(null);
    window.setTimeout(() => {
      suppress.current = false;
    }, 400);
    if (!alive(id)) return;
    mode.current = "table";
    setPhase("table");
  }

  function watch() {
    const cur = watchRef.current;
    const prev = prevWatch.current;
    prevWatch.current = { index: cur.chamberIndex, you: cur.yourLives, rival: cur.rivalLives };
    if (!prev) return;
    const indexMoved = cur.chamberIndex !== prev.index;
    if (indexMoved) {
      setCylTurn(-40);
      window.setTimeout(() => setCylTurn(-18), 80);
      window.setTimeout(() => setCylTurn(0), 160);
    }
    if (cur.yourLives < prev.you) noteDrop("you", cur.yourLives, prev.you);
    if (cur.rivalLives < prev.rival) noteDrop("rival", cur.rivalLives, prev.rival);
    if (cur.yourLives > prev.you) noteDrop("you", prev.you, cur.yourLives, true);
    if (cur.rivalLives > prev.rival) noteDrop("rival", prev.rival, cur.rivalLives, true);
    if (ownShot.current && cur.beat) {
      ownShot.current = false;
      beatWait.current(cur.beat);
    } else if (indexMoved && !ignoreChamber.current && !suppress.current && !ownShot.current) {
      let kind: RivalKind;
      if (cur.yourLives < prev.you) kind = "live-you";
      else if (cur.rivalLives < prev.rival) kind = "live-self";
      else if (!cur.yourTurn) kind = "blank-self";
      else kind = "blank-you";
      queue.current.push(kind);
      void pump();
    }
    if (indexMoved && ignoreChamber.current && !ownShot.current) ignoreChamber.current = false;
  }

  const apiRef = useRef({ boot, pump, watch });
  apiRef.current = { boot, pump, watch };

  useEffect(() => {
    apiRef.current.watch();
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
  }, [chambers.length]);

  useEffect(() => {
    dead.current = false;
    return () => {
      dead.current = true;
    };
  }, []);

  const holes = Array.from({ length: 8 }, (_, i) => chambers[i] ?? "empty");
  const freshGun = chamberIndex === 0 && holes.every((hole) => hole !== "empty");
  const shownChamber = Math.min(Math.max(chamberIndex + 1, 1), 8);
  const youHurt = Math.max(0, maxLives - yourLives);
  const rivalHurt = Math.max(0, maxLives - rivalLives);
  const deadMatch = yourLives <= 0 || rivalLives <= 0;
  const grade = deadMatch ? 0.62 : Math.min(0.5, (youHurt + rivalHurt) * 0.18);
  const cardsOpen = phase === "table" && yourTurn && !busy;

  const pipClass = (who: "you" | "rival", i: number, on: boolean) => {
    const hit = blink && blink.who === who && i >= Math.min(blink.from, blink.to) && i < Math.max(blink.from, blink.to);
    return [
      styles.pip,
      who === "you" ? styles.pipYou : styles.pipRival,
      on ? styles.pipOn : "",
      hit ? (blink?.heal ? styles.pipHeal : styles.pipDie) : "",
    ].filter(Boolean).join(" ");
  };

  return (
    <div className={styles.fit}>
      <div
        className={`${styles.frame} ${shake === "lite" ? styles.shakeLite : ""} ${shake === "hard" ? styles.shakeHard : ""}`}
        data-phase={phase}
        data-cards={cardsOpen ? "open" : "shut"}
      >
        <div className={styles.world} style={{ transform: `scale(${zoom})`, transformOrigin: "50% 64%" }}>
          <video
            className={styles.bg}
            src="/duel-pixel/bg.mp4"
            poster="/duel-pixel/bg.jpg"
            autoPlay
            muted
            loop
            playsInline
          />
          <div
            className={[
              styles.charWrap,
              thrown === "out" ? styles.thrown : "",
              thrown === "back" ? styles.comeBack : "",
              rattle ? styles.rattle : "",
              !thrown && !rattle ? styles.breathe : "",
            ].filter(Boolean).join(" ")}
          >
            <img
              className={styles.character}
              src={rivalHurt > 0 ? CHARACTER_HURT : CHARACTER_IDLE}
              alt=""
              draggable={false}
            />
          </div>
          <div className={styles.lightGrade} style={{ opacity: grade }} />
          {youHurt > 0 && (
            <div className={styles.vision} style={{ opacity: Math.min(1, youHurt / maxLives) }} />
          )}

          <div className={`${styles.lives} ${styles.livesFar}`} aria-label={`Rival lives ${rivalLives}`}>
            {Array.from({ length: maxLives }).map((_, i) => (
              <i key={i} className={pipClass("rival", i, i < rivalLives)} />
            ))}
          </div>

          <div className={styles.cyl} aria-hidden>
            {holes.map((hole, i) => {
              const angle = ((-90 + i * 45 + cylTurn) * Math.PI) / 180;
              const open = revealedIndex === i && hole !== "empty";
              const cls = [
                styles.hole,
                open && hole === "live" ? styles.holeLive : "",
                open && hole === "blank" ? styles.holeBlank : "",
                hole === "empty" ? styles.holeSpent : "",
                i === chamberIndex && hole !== "empty" ? styles.holeHot : "",
              ].filter(Boolean).join(" ");
              return (
                <span
                  key={i}
                  className={cls}
                  style={{
                    left: `${50 + Math.cos(angle) * 32}%`,
                    top: `${50 + Math.sin(angle) * 32}%`,
                  }}
                >
                  {hole === "empty" ? "×" : ""}
                </span>
              );
            })}
            <span className={styles.hub}>{freshGun ? "?" : `${shownChamber}/8`}</span>
          </div>

          {trayY > 0 && (
            <div className={styles.tray} style={{ top: `${trayY}%` }}>
              {Array.from({ length: 5 }).map((_, i) => <i key={`l${i}`} className={styles.shellLive} />)}
              {Array.from({ length: 3 }).map((_, i) => <i key={`b${i}`} className={styles.shellBlank} />)}
            </div>
          )}

          {shell && shell !== "empty" && (
            <i className={`${styles.dropped} ${shell === "live" ? styles.shellLive : styles.shellBlank}`} />
          )}

          {reach > 0 && <div className={styles.arm} style={{ height: `${Math.max(8, reach * 34)}%` }} />}

          {muzzle === 0 && (
            phase === "table" ? (
              <button
                type="button"
                className={styles.piece}
                style={{
                  left: `${pose.x}%`,
                  top: `${pose.y}%`,
                  width: `${pose.w}%`,
                  transform: `translateX(-50%) rotate(${pose.rot}deg)`,
                  zIndex: 5,
                }}
                disabled={!yourTurn || busy}
                aria-label="Take the gun"
                onClick={() => { void pickup(); }}
              >
                <img src="/duel-pixel/gun.png" alt="" draggable={false} />
              </button>
            ) : (
              <div
                className={styles.piece}
                style={{
                  left: `${pose.x}%`,
                  top: `${pose.y}%`,
                  width: `${pose.w}%`,
                  transform: `translateX(-50%) rotate(${pose.rot}deg)`,
                  zIndex: 8,
                }}
              >
                <img src="/duel-pixel/gun.png" alt="" draggable={false} />
              </div>
            )
          )}

          <div className={styles.hand}>
            {hand.map((card, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.card} ${selectedSlot === i ? styles.cardOn : ""} ${card ? "" : styles.cardEmpty}`}
                style={{
                  "--tilt": `${TILT[i % TILT.length]}deg`,
                  visibility: cardFx?.slot === i ? "hidden" : "visible",
                } as CSSProperties}
                disabled={!cardsOpen || silenced || !card}
                onClick={() => { if (card) void playCard(i); }}
              >
                {card ? (
                  <>
                    <CardGlyph card={card} />
                    <span className={styles.cardName}>{SHORT[card]}</span>
                  </>
                ) : null}
              </button>
            ))}
          </div>

          <div className={`${styles.lives} ${styles.livesNear} ${shield ? styles.shielded : ""}`} aria-label={`Your lives ${yourLives}`}>
            {Array.from({ length: maxLives }).map((_, i) => (
              <i key={i} className={pipClass("you", i, i < yourLives)} />
            ))}
          </div>
        </div>

        {phase === "ready" && (
          <>
            <button
              type="button"
              className={`${styles.shoot} ${styles.shootL}`}
              onPointerEnter={() => move(TILT_SELF)}
              onPointerLeave={() => { if (mode.current === "ready") move(HELD); }}
              onClick={() => { void playerShot("self"); }}
            >
              <img src="/duel-pixel/btn-self.png" alt="Shoot self" draggable={false} />
            </button>
            <button
              type="button"
              className={`${styles.shoot} ${styles.shootR}`}
              onPointerEnter={() => move(TILT_RIVAL)}
              onPointerLeave={() => { if (mode.current === "ready") move(HELD); }}
              onClick={() => { void playerShot("rival"); }}
            >
              <img src="/duel-pixel/btn-rival.png" alt="Shoot rival" draggable={false} />
            </button>
          </>
        )}

        {muzzle > 0 && (
          <div
            className={styles.muzzle}
            data-cock={hammer}
            style={{ transform: `translate(-50%, -50%) scale(${muzzle})` }}
          >
            <svg viewBox="0 0 64 88" className={styles.muzzleSvg} aria-hidden>
              <rect x="22" y="2" width="20" height="4" fill="#d5d8dc" />
              <rect x="14" y="6" width="36" height="4" fill="#9aa0a6" />
              <rect x="8" y="10" width="48" height="6" fill="#c5c8cc" />
              <rect x="6" y="16" width="52" height="28" fill="#8e949b" />
              <rect x="10" y="44" width="44" height="6" fill="#6a7076" />
              <rect x="18" y="50" width="28" height="4" fill="#3a3e44" />
              <rect x="26" y="18" width="12" height="4" fill="#141618" />
              <rect x="22" y="22" width="20" height="16" fill="#070708" />
              <rect x="26" y="38" width="12" height="4" fill="#141618" />
              <rect x="28" y="54" width="8" height="20" fill="#2c3034" />
              <rect
                x="6"
                y="58"
                width="16"
                height="6"
                fill="#1c1e22"
                transform={hammer === 0 ? "" : hammer === 1 ? "rotate(-16 22 64)" : "rotate(-32 22 64)"}
              />
            </svg>
          </div>
        )}

        {bang && <div className={styles.bang} />}
        {smoke > 0 && (
          <div className={styles.smoke} style={{ transform: `translate(-50%, -50%) scale(${0.6 + smoke * 0.45})` }} />
        )}
        {splatter > 0 && (
          <div className={styles.splatter} aria-hidden>
            {SPLAT.slice(0, splatter === 1 ? 15 : splatter === 2 ? 8 : 3).map(([x, y]) => (
              <i key={`${x}-${y}`} style={{ left: `${x}%`, top: `${y}%` }} />
            ))}
          </div>
        )}
        {clickWord && <div className={styles.clickWord}>CLICK</div>}
        {white && <div className={styles.whiteout} />}
        {black && <div className={styles.blackout} />}

        {cardFx && (
          <div className={styles.cardShow} data-stage={cardFx.stage}>
            <CardGlyph card={cardFx.card} />
            <span className={styles.cardName}>{SHORT[cardFx.card]}</span>
          </div>
        )}

        {phase === "over" && (
          <div className={styles.over}>
            <b>{yourLives <= 0 ? "YOU ARE DOWN" : "RIVAL IS DOWN"}</b>
          </div>
        )}

        {onLeave && (
          <button
            type="button"
            className={`${styles.corner} ${styles.cornerL}`}
            onClick={() => {
              seq.current += 1;
              onLeave();
            }}
          >
            LEAVE
          </button>
        )}
        {onToggleMute && (
          <button type="button" className={`${styles.corner} ${styles.cornerR}`} onClick={onToggleMute}>
            {muted ? "SOUND OFF" : "SOUND ON"}
          </button>
        )}
        {notice && <div className={styles.notice}>{notice}</div>}
      </div>
    </div>
  );
}

function CardGlyph({ card }: { card: RoletCard }) {
  const p = {
    fill: "none" as const,
    stroke: "#1a140f",
    strokeWidth: 2.2,
    strokeLinecap: "square" as const,
    strokeLinejoin: "miter" as const,
  };
  let body: ReactNode;
  switch (card) {
    case "hawkEye":
      body = (
        <>
          <path {...p} d="M3 16 Q16 6 29 16 Q16 26 3 16Z" />
          <circle cx="16" cy="16" r="3.1" fill="#1a140f" />
        </>
      );
      break;
    case "blocker":
      body = <path {...p} d="M16 3 L27 8 V16 C27 23 16 29 16 29 C16 29 5 23 5 16 V8 Z" />;
      break;
    case "healer":
      body = <path {...p} d="M16 6 V26 M8 16 H24" />;
      break;
    case "silence":
      body = <path {...p} d="M7 8 L25 24 M9 20 V12 H14 L21 7 V25 L14 20 Z" />;
      break;
    case "doubleStrike":
      body = <path {...p} d="M8 6 L18 26 M14 6 L24 26" />;
      break;
    case "shuffler":
      body = <path {...p} d="M5 11 H20 L15 6 M27 21 H12 L17 26" />;
      break;
    case "restoreBullet":
      body = <path {...p} d="M12 27 V13 H20 V27 M12 13 L16 5 L20 13" />;
      break;
    case "bulletExtractor":
      body = <path {...p} d="M16 4 V21 M9 15 L16 23 L23 15 M7 28 H25" />;
      break;
    case "cardThief":
      body = <path {...p} d="M7 7 H18 V25 H7 Z M14 7 H25 V25 H14" />;
      break;
    case "randomInsight":
      body = <path {...p} d="M6 16 H26 M16 6 V13 M16 20 V23" />;
      break;
    case "lastChance":
      body = <path {...p} d="M16 5 V21 M16 25 V28" />;
      break;
    case "handOfFate":
      body = <path {...p} d="M16 3 L19 13 L29 16 L19 19 L16 29 L13 19 L3 16 L13 13 Z" />;
      break;
    default:
      body = null;
  }
  return (
    <svg className={styles.glyph} viewBox="0 0 32 32" aria-hidden>
      {body}
    </svg>
  );
}

const PREVIEW_HAND: (RoletCard | null)[] = ["hawkEye", "blocker", "healer", "silence"];
const PREVIEW_CHAMBERS: PixelChamber[] = [
  "live", "blank", "live", "blank", "live", "blank", "live", "live",
];

/** Local table, no wallet. Used at /duel?preview=pixel. */
export function PixelDuelPreview() {
  const [round, setRound] = useState(0);
  const [chambers, setChambers] = useState<PixelChamber[]>(PREVIEW_CHAMBERS);
  const [index, setIndex] = useState(0);
  const [you, setYou] = useState(4);
  const [rival, setRival] = useState(4);
  const [turn, setTurn] = useState(true);
  const [hand, setHand] = useState<(RoletCard | null)[]>(PREVIEW_HAND);
  const [selected, setSelected] = useState<number | null>(null);
  const [beat, setBeat] = useState<PixelBeat>(null);
  const [revealed, setRevealed] = useState<number | null>(null);
  const [muted, setMuted] = useState(true);
  const snap = useRef({ chambers, index, you, rival, turn });
  const rivalShots = useRef(0);
  snap.current = { chambers, index, you, rival, turn };

  useEffect(() => {
    if (!beat) return;
    const t = window.setTimeout(() => setBeat(null), beat === "click" ? 700 : 450);
    return () => window.clearTimeout(t);
  }, [beat]);

  useEffect(() => {
    if (turn || you <= 0 || rival <= 0) return;
    const t = window.setTimeout(() => {
      const s = snap.current;
      if (s.turn || s.you <= 0 || s.rival <= 0) return;
      const hole = s.chambers[s.index] ?? "empty";
      if (hole === "empty") return;
      const targetSelf = rivalShots.current % 2 === 1;
      rivalShots.current += 1;
      const live = hole === "live";
      const next = s.chambers.slice();
      next[s.index] = "empty";
      setChambers(next);
      setRevealed(null);
      setIndex(Math.min(s.index + 1, 7));
      if (!live) {
        setBeat("click");
        if (!targetSelf) setTurn(true);
      } else if (targetSelf) {
        setRival((n) => Math.max(0, n - 1));
        setBeat("hit-rival");
        setTurn(true);
      } else {
        setYou((n) => Math.max(0, n - 1));
        setBeat("hit-you");
        setTurn(true);
      }
    }, 900);
    return () => window.clearTimeout(t);
  }, [turn, index, you, rival]);

  const shoot = (self: boolean) => {
    const hole = chambers[index] ?? "empty";
    if (hole === "empty") return;
    const live = hole === "live";
    const next = chambers.slice();
    next[index] = "empty";
    setChambers(next);
    setRevealed(null);
    setIndex((n) => Math.min(n + 1, 7));
    if (!live) {
      setBeat("click");
      if (!self) setTurn(false);
    } else if (self) {
      setYou((n) => Math.max(0, n - 1));
      setBeat("hit-you");
      setTurn(false);
    } else {
      setRival((n) => Math.max(0, n - 1));
      setBeat("hit-rival");
      setTurn(false);
    }
  };

  const reset = () => {
    setChambers(PREVIEW_CHAMBERS.slice());
    setIndex(0);
    setYou(4);
    setRival(4);
    setTurn(true);
    setHand(PREVIEW_HAND.slice());
    setSelected(null);
    setBeat(null);
    setRevealed(null);
    rivalShots.current = 0;
    setRound((n) => n + 1);
  };

  return (
    <PixelDuelStage
      key={round}
      chambers={chambers}
      chamberIndex={index}
      revealedIndex={revealed}
      yourLives={you}
      rivalLives={rival}
      hand={hand}
      selectedSlot={selected}
      onSelect={setSelected}
      yourTurn={turn}
      beat={beat}
      muted={muted}
      onToggleMute={() => setMuted((m) => !m)}
      onLeave={reset}
      notice={null}
      onShootSelf={() => shoot(true)}
      onShootRival={() => shoot(false)}
      onPlayCard={() => {
        if (selected == null) return;
        const card = hand[selected];
        if (card === "hawkEye" || card === "randomInsight") setRevealed(index);
        if (card === "bulletExtractor") {
          setChambers((current) => {
            const next = current.slice();
            next[index] = "empty";
            return next;
          });
          setIndex((n) => Math.min(n + 1, 7));
          setRevealed(null);
        }
        if (card === "healer") setYou((n) => Math.min(4, n + 1));
        const next = hand.slice();
        next[selected] = null;
        setHand(next);
        setSelected(null);
      }}
    />
  );
}
