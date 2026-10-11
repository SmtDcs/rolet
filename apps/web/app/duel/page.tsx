// app/duel/page.tsx
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { keccak_256 } from "@noble/hashes/sha3.js";
import bs58 from "bs58";
import { useRolet, useToasts, emitToast, type RoletCard } from "@/hooks/useRolet";
import { queueMessage, reduceQueueView, type QueueView } from "@/lib/matchQueue";
import { decideSit, guestBase58, guestBenchView, hostBenchView, revealGate, secretForSeat } from "@/lib/seat";
import { launchActor, pollWaitMs, seedReady, sessionAttemptFresh, timeoutClaimable } from "@/lib/chainPace";
import {
  InviteLink,
  LobbyButton,
  LobbyFrame,
  LobbyLink,
  LobbyNote,
  LobbyQuiet,
  LobbySteps,
  LobbyWallet,
} from "@/components/duel/WorkshopLobby";
import { useSound } from "@/hooks/useSound";
import { Volume2, VolumeX } from "lucide-react";

const DuelBoard2D = dynamic(() => import("@/components/DuelBoard2D"), { ssr: false });
const HandRack2D = dynamic(() => import("@/components/HandRack2D"), { ssr: false });

// ============================================================
// Domain types
// ============================================================
type Chamber = "live" | "blank" | "empty";
type Target = "self" | "opponent";

// CARD_LABEL stays here — needed for the floating PLAY button label.
// Glyph + blurb live in HandRack2D (where the card faces are drawn).
const CARD_LABEL: Record<RoletCard, string> = {
  restoreBullet: "RestoreBullet",
  hawkEye: "HawkEye",
  silence: "Silence",
  blocker: "Blocker",
  bulletExtractor: "BulletExtractor",
  shuffler: "Shuffler",
  doubleStrike: "DoubleStrike",
  healer: "Healer",
  cardThief: "CardThief",
  randomInsight: "RandomInsight",
  lastChance: "LastChance",
  handOfFate: "HandOfFate",
};

// ============================================================
// Decoders — translate raw on-chain MatchState into UI state
// ============================================================
type DecodedMatch = {
  playerOneHp: number;
  playerTwoHp: number;
  currentTurn: string;
  playerOne: string;
  playerTwo: string;
  chambers: Chamber[];
  currentChamber: number;
  liveCount: number;
  blankCount: number;
  yourHand: (RoletCard | null)[];
  status: "awaitingOpponent" | "active" | "completed" | "abandoned";
  silencedYou: boolean;
  blockerOnYou: boolean;
  lastActionSlot: number;
};

const ANCHOR_CARD_KEYS: RoletCard[] = [
  "restoreBullet", "hawkEye", "silence", "blocker", "bulletExtractor",
  "shuffler", "doubleStrike", "healer", "cardThief", "randomInsight",
  "lastChance", "handOfFate",
];

function decodeChamber(raw: { empty?: object; blank?: object; live?: object }): Chamber {
  if (raw.live) return "live";
  if (raw.blank) return "blank";
  return "empty";
}

function decodeCard(opt: { [k in RoletCard]?: object } | null): RoletCard | null {
  if (!opt) return null;
  const key = ANCHOR_CARD_KEYS.find((k) => opt[k]);
  return key ?? null;
}

function decodeStatus(raw: Record<string, object>): DecodedMatch["status"] {
  if (raw.active) return "active";
  if (raw.completed) return "completed";
  if (raw.abandoned) return "abandoned";
  return "awaitingOpponent";
}

function decodeMatch(state: any, you: string | null): DecodedMatch | null {
  if (!state) return null;
  const playerOne = state.playerOne.toBase58();
  const playerTwo = state.playerTwo.toBase58();
  const youArePlayerOne = you === playerOne;

  const chambers: Chamber[] = state.gun.chambers.map(decodeChamber);
  const liveCount = chambers.filter((c) => c === "live").length;
  const blankCount = chambers.filter((c) => c === "blank").length;

  const handAccount = youArePlayerOne ? state.playerOneCards : state.playerTwoCards;
  const yourHand = handAccount.slots.map((s: any) => decodeCard(s));

  const silenceTarget = state.silenceTarget?.toBase58?.() ?? null;
  const blockerFor = state.blockerActiveFor?.toBase58?.() ?? null;

  return {
    playerOne,
    playerTwo,
    playerOneHp: state.playerOneHp,
    playerTwoHp: state.playerTwoHp,
    currentTurn: state.currentTurn.toBase58(),
    chambers,
    currentChamber: state.gun.currentChamber,
    liveCount,
    blankCount,
    yourHand,
    status: decodeStatus(state.status),
    silencedYou: silenceTarget === you,
    blockerOnYou: blockerFor === you,
    lastActionSlot:
      typeof state.lastActionSlot?.toNumber === "function"
        ? state.lastActionSlot.toNumber()
        : Number(state.lastActionSlot ?? 0),
  };
}

// ============================================================
// Default export — Suspense boundary required for useSearchParams
// ============================================================
export default function DuelPage() {
  return (
    <Suspense fallback={<DuelLoading />}>
      <DuelRouter />
    </Suspense>
  );
}

function DuelLoading() {
  return <LobbyFrame status="Opening" kicker="The bench" title="Opening the bench." />;
}

/**
 * Reads URL params:
 *  ?match=<hex>  → ActiveDuel
 *  ?lobby=<hex>  → HostWaiting (host polling for guest)
 *  ?join=<hex>   → GuestLobby (guest joins + waits for host to launch)
 *  (none)        → Lobby (server queue; the assigned host opens the room)
 */
function DuelRouter() {
  const search = useSearchParams();
  const matchHex = search.get("match");
  const lobbyHex = search.get("lobby");
  const joinHex = search.get("join");
  const autoJoin = search.get("auto") === "true";

  const matchId = useMemo(() => {
    if (!matchHex) return null;
    try { return new BN(matchHex, 16); } catch { return null; }
  }, [matchHex]);

  const lobbyMatchId = useMemo(() => {
    const hex = lobbyHex ?? joinHex;
    if (!hex) return null;
    try { return new BN(hex, 16); } catch { return null; }
  }, [lobbyHex, joinHex]);

  if (matchId) return <ActiveDuel matchId={matchId} />;
  if (lobbyMatchId && lobbyHex) return <HostWaiting matchId={lobbyMatchId} />;
  if (lobbyMatchId && joinHex) return <GuestLobby matchId={lobbyMatchId} autoJoin={autoJoin} />;
  return <Lobby />;
}

// ============================================================
// Active duel — UI when a real on-chain match exists
// ============================================================
// ── Damage number type ───────────────────────────────────────────────────────
type DamageNum = { id: number; value: number; x: number };
let dmgSeq = 0;

function ActiveDuel({ matchId }: { matchId: BN }) {
  const wallet = useWallet();
  const rolet = useRolet({ ephemeral: false });
  const toasts = useToasts();
  const roletRef = useRef(rolet);
  roletRef.current = rolet;
  const programReady = !!rolet.program;

  const [state, setState] = useState<any>(null);
  const [target, setTarget] = useState<Target>("opponent");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([
    "// signal acquired — L1://solana-devnet",
    "// awaiting wallet handshake…",
  ]);

  // ── Animation state ────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [hitFlash, setHitFlash] = useState<"player" | "opponent" | null>(null);
  const [damageNums, setDamageNums] = useState<DamageNum[]>([]);
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [deathBeat, setDeathBeat] = useState(false);
  const prevPlayerHpRef = useRef<number | null>(null);
  const prevOpponentHpRef = useRef<number | null>(null);
  const prevTurnRef = useRef<boolean | null>(null);

  // ── Gun state ──────────────────────────────────────────────────────────────
  const [gunHeld, setGunHeld] = useState(false);
  const [firing, setFiring] = useState<"live" | "blank" | null>(null);
  const [opponentHitSignal, setOpponentHitSignal] = useState(0);
  const [lastPlayedSlot, setLastPlayedSlot] = useState<number | null>(null);
  const [lastPlayedSignal, setLastPlayedSignal] = useState(0);
  const [vaultRewardSol, setVaultRewardSol] = useState<string>("0.12");
  const [currentSlot, setCurrentSlot] = useState(0);
  const { play, muted, toggleMute } = useSound();

  const youKey = wallet.publicKey?.toBase58() ?? null;
  const decoded = useMemo(() => decodeMatch(state, youKey), [state, youKey]);

  const turnIsYours =
    !!decoded && !!youKey && decoded.currentTurn === youKey && decoded.status === "active";

  // Live MatchState — websocket subscribe + HTTP poll fallback.
  // Helius free tier sometimes blocks WS; without the poll, UI stays frozen
  // while txs land on chain. Poll every 1.5s — cheap and within free quota.
  useEffect(() => {
    if (!programReady) return;
    let unsub = () => {};
    let alive = true;
    let timer = 0;
    let failures = 0;
    (async () => {
      const initial = await roletRef.current.fetchMatch(matchId);
      if (alive && initial) {
        setState(initial);
        setLog((l) => ["// match snapshot loaded", ...l].slice(0, 24));
      }
      // Pull the on-chain reward so the claim banner shows the real amount.
      const vault = await roletRef.current.fetchVault();
      if (alive && vault) {
        const sol = (vault.rewardSol.toNumber() / 1e9).toFixed(3);
        setVaultRewardSol(sol.replace(/0+$/, "").replace(/\.$/, ""));
      }
      unsub = roletRef.current.subscribeMatch(matchId, (next) => {
        if (!alive) return;
        setState(next);
        setLog((l) => ["// state delta received", ...l].slice(0, 24));
      });
    })();
    const tick = async () => {
      if (!alive) return;
      try {
        const fresh = await roletRef.current.fetchMatch(matchId);
        if (alive && fresh) setState(fresh);
        const slot = await roletRef.current.connection.getSlot("confirmed");
        if (alive) setCurrentSlot(slot);
        failures = 0;
      } catch {
        failures += 1;
      }
      if (alive) timer = window.setTimeout(tick, pollWaitMs(failures));
    };
    timer = window.setTimeout(tick, pollWaitMs(0));
    return () => {
      alive = false;
      unsub();
      window.clearTimeout(timer);
    };
  }, [programReady, matchId]);

  // Mirror toast events into the cursed terminal log.
  useEffect(() => {
    if (!toasts.length) return;
    const latest = toasts[toasts.length - 1];
    const tag =
      latest.level === "error" ? "!!" : latest.level === "success" ? ">>" : "..";
    setLog((l) => [`${tag} ${latest.message}`, ...l].slice(0, 24));
  }, [toasts]);

  // When a match completes inside the ER, push final state back to L1 so
  // settle_match becomes callable. Runs once per terminal status flip.
  const [committed, setCommitted] = useState(false);
  const [settled, setSettled] = useState(false);
  const matchEndSoundPlayedRef = useRef(false);
  useEffect(() => {
    if (!decoded || decoded.status !== "completed" || committed) return;
    setCommitted(true);
    setLog((l) => ["// match over — committing state to L1…", ...l].slice(0, 24));
    rolet.commitAndUndelegateMatch(matchId);
    if (!matchEndSoundPlayedRef.current) {
      matchEndSoundPlayedRef.current = true;
      const youWon = decoded.playerOneHp > 0
        ? decoded.playerOne === youKey
        : decoded.playerTwo === youKey;
      play(youWon ? "matchWin" : "matchLose");
      setDeathBeat(true);
      setTimeout(() => setDeathBeat(false), 500);
      setFiring(null);
    }
  }, [decoded, committed, rolet, matchId, youKey, play]);

  // The session key still holds SOL after the match. Return it to the wallet
  // once the commit and the settlement have had time to land.
  const sweptRef = useRef(false);
  const endStatus = decoded?.status;
  useEffect(() => {
    if (endStatus !== "completed" || sweptRef.current) return;
    const timer = setTimeout(() => {
      if (sweptRef.current) return;
      sweptRef.current = true;
      rolet.sweepSession();
    }, 45000);
    return () => clearTimeout(timer);
  }, [endStatus, rolet]);

  const handleArm = async () => {
    await rolet.startSession(60 * 60);
  };

  const handlePlayCard = async () => {
    if (selectedSlot === null || !decoded) return;
    const card = decoded.yourHand[selectedSlot];
    if (!card) return;
    setLog((l) => [`> arming card ${CARD_LABEL[card]}…`, ...l].slice(0, 24));
    const cardResult = await rolet.playCard({
      matchId,
      slot: selectedSlot,
      card,
      currentTurnAuthority: new PublicKey(decoded.currentTurn),
    });
    if (cardResult) play("cardPlay");
    setLastPlayedSlot(selectedSlot);
    setLastPlayedSignal(Date.now());
    setSelectedSlot(null);
    // Immediate refetch so the HUD reflects the new state without waiting
    // for the 1.5s poll tick.
    const fresh = await rolet.fetchMatch(matchId);
    if (fresh) setState(fresh);
  };

  const handlePullTrigger = async () => {
    if (!decoded) return;
    // Read the chamber that's about to fire so we can play the right effect
    // BEFORE the on-chain tx resolves (snappier UX).
    const chamberType = decoded.chambers[decoded.currentChamber] ?? "live";
    const isLive = chamberType === "live";
    setLog((l) => [
      `> trigger → ${target.toUpperCase()} · ${isLive ? "LIVE" : "BLANK"}`,
      ...l,
    ].slice(0, 24));

    if (isLive) {
      // Full effects: shake + recoil + muzzle flash + fullscreen flash
      triggerShake();
      setFiring("live");
      play("gunshotLive");
      setTimeout(() => setFiring(null), 650);
    } else {
      // Blank: mechanical click only — no flash, no big shake
      setFiring("blank");
      play("clickBlank");
      setTimeout(() => setFiring(null), 280);
    }

    await rolet.pullTrigger({
      matchId,
      targetSelf: target === "self",
      currentTurnAuthority: new PublicKey(decoded.currentTurn),
    });
    // Re-fetch so the on-chain state (HP, current chamber, turn) updates the
    // UI immediately. Buckshot rules: self+blank keeps your turn, everything
    // else passes the gun — the chain enforces this, we just reflect it.
    const fresh = await rolet.fetchMatch(matchId);
    if (fresh) setState(fresh);
  };

  // ── Screen shake ──────────────────────────────────────────────────────────
  const triggerShake = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.remove("animate-shake");
    void el.offsetWidth; // reflow
    el.classList.add("animate-shake");
    setTimeout(() => el.classList.remove("animate-shake"), 450);
  }, []);

  // ── Detect HP changes → hit flash + damage numbers ────────────────────────
  const opponentHp = decoded
    ? youKey === decoded.playerOne ? decoded.playerTwoHp : decoded.playerOneHp
    : 4;
  const playerHp = decoded
    ? youKey === decoded.playerOne ? decoded.playerOneHp : decoded.playerTwoHp
    : 4;

  useEffect(() => {
    if (playerHp === null) return;
    if (prevPlayerHpRef.current !== null && playerHp < prevPlayerHpRef.current) {
      const diff = prevPlayerHpRef.current - playerHp;
      setHitFlash("player");
      setDamageNums((prev) => [...prev, { id: ++dmgSeq, value: -diff, x: 48 }]);
      triggerShake();
      play("playerHit");
      setTimeout(() => setHitFlash(null), 550);
    }
    prevPlayerHpRef.current = playerHp;
  }, [playerHp, triggerShake, play]);

  useEffect(() => {
    if (opponentHp === null) return;
    if (prevOpponentHpRef.current !== null && opponentHp < prevOpponentHpRef.current) {
      const diff = prevOpponentHpRef.current - opponentHp;
      setHitFlash("opponent");
      setOpponentHitSignal(Date.now());
      setDamageNums((prev) => [...prev, { id: ++dmgSeq, value: -diff, x: 52 }]);
      setTimeout(() => setHitFlash(null), 450);
    }
    prevOpponentHpRef.current = opponentHp;
  }, [opponentHp]);

  // ── Gun pickup sound — rising edge of gunHeld ─────────────────────────────
  const prevGunHeldRef = useRef(false);
  useEffect(() => {
    if (gunHeld && !prevGunHeldRef.current) play("triggerCock");
    prevGunHeldRef.current = gunHeld;
  }, [gunHeld, play]);

  // ── Turn change banner + auto-pickup gun on your turn ─────────────────────
  useEffect(() => {
    if (prevTurnRef.current === null) { prevTurnRef.current = turnIsYours; return; }
    if (prevTurnRef.current === turnIsYours) return;
    prevTurnRef.current = turnIsYours;
    setShowTurnBanner(true);
    setTimeout(() => setShowTurnBanner(false), 2200);
    // Pick up the gun automatically when it becomes your turn,
    // put it back on the table when it doesn't.
    setGunHeld(turnIsYours);
  }, [turnIsYours]);

  const opponentStatus: "watching" | "silenced" | "blocking" = useMemo(() => {
    if (!decoded || !youKey) return "watching";
    const oppKey =
      decoded.playerOne === youKey ? decoded.playerTwo : decoded.playerOne;
    if (decoded.silencedYou && decoded.currentTurn === oppKey) return "silenced";
    if (decoded.blockerOnYou) return "blocking";
    return "watching";
  }, [decoded, youKey]);

  return (
    <main
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* 2D duel board — covers entire viewport, behind everything */}
      <DuelBoard2D
        isYourTurn={turnIsYours}
        gunHeld={gunHeld}
        target={target}
        firing={firing}
        opponentPubkey={
          decoded && youKey
            ? youKey === decoded.playerOne
              ? decoded.playerTwo
              : decoded.playerOne
            : ""
        }
        opponentHp={opponentHp}
        opponentHitSignal={opponentHitSignal}
        liveCount={decoded?.liveCount ?? 0}
        blankCount={decoded?.blankCount ?? 0}
      />

      {/* Hit flash overlay (red, when player takes damage) */}
      <AnimatePresence>
        {hitFlash === "player" && (
          <motion.div
            key="hit-flash"
            className="pointer-events-none fixed inset-0 z-[100]"
            initial={{ opacity: 0.65 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{ background: "radial-gradient(ellipse at 50% 90%, rgba(255,0,0,0.55) 0%, rgba(140,0,0,0.35) 40%, transparent 70%)" }}
          />
        )}
      </AnimatePresence>

      {/* Opponent damage flash (red, when opponent takes damage) */}
      <AnimatePresence>
        {hitFlash === "opponent" && (
          <motion.div
            key="opponent-hit-flash"
            className="pointer-events-none fixed inset-0 z-[100]"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ background: "radial-gradient(ellipse at 50% 10%, rgba(180,30,30,0.5) 0%, rgba(90,0,0,0.3) 40%, transparent 70%)" }}
          />
        )}
      </AnimatePresence>

      {/* Muzzle FLASH overlay — only fires for LIVE chambers */}
      <AnimatePresence>
        {firing === "live" && (
          <motion.div
            key="fire-flash"
            className="pointer-events-none fixed inset-0 z-[99] mix-blend-screen"
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ background: "radial-gradient(circle at 50% 55%, rgba(255,240,180,0.85) 0%, rgba(255,140,40,0.45) 25%, transparent 60%)" }}
          />
        )}
      </AnimatePresence>

      {/* Death beat overlay */}
      <AnimatePresence>
        {deathBeat && (
          <motion.div
            key="death-beat"
            className="pointer-events-none fixed inset-0 z-[97] mix-blend-multiply"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(120,0,0,0.8) 0%, rgba(40,0,0,0.55) 45%, transparent 75%)" }}
          />
        )}
      </AnimatePresence>

      {/* Turn banner */}
      <AnimatePresence>
        {showTurnBanner && (
          <motion.div
            key={turnIsYours ? "your-turn" : "enemy-turn"}
            className="pointer-events-none fixed inset-x-0 top-1/3 z-[90] flex flex-col items-center"
            initial={{ opacity: 0, y: -32, scaleX: 1.1 }}
            animate={{ opacity: 1, y: 0, scaleX: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={`px-12 py-4 border-2 ${
              turnIsYours
                ? "border-[var(--color-alert)]/70 bg-black/70"
                : "border-[var(--color-line-strong)] bg-black/60"
            }`}>
              <div className={`font-display tracking-[0.5em] text-4xl ${
                turnIsYours ? "text-[var(--color-alert)] text-bleed" : "text-[var(--color-phosphor-dim)]"
              }`}>
                {turnIsYours ? "YOUR TURN" : "ENEMY TURN"}
              </div>
              <div className={`mt-1 text-center text-[9px] tracking-[0.6em] ${
                turnIsYours ? "text-rust" : "text-[var(--color-phosphor-faint)]"
              }`}>
                {turnIsYours ? "// WEAPON ARMED — CHOOSE ACTION" : "// OPPONENT IS DECIDING"}
              </div>
            </div>
            {/* Scan line effect across banner */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
              <div className="w-full h-px bg-white animate-scan-line" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating damage numbers */}
      <AnimatePresence>
        {damageNums.map((d) => (
          <motion.div
            key={d.id}
            className="pointer-events-none fixed z-[95] font-display font-bold select-none"
            style={{ left: `${d.x}%`, top: "45%", color: d.value < 0 ? "var(--color-alert)" : "var(--color-patina)" }}
            initial={{ opacity: 1, y: 0, scale: 1.4 }}
            animate={{ opacity: 0, y: -90, scale: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            onAnimationComplete={() =>
              setDamageNums((prev) => prev.filter((x) => x.id !== d.id))
            }
          >
            <span className="text-5xl" style={{ textShadow: "0 0 20px currentColor, 0 0 40px currentColor" }}>
              {d.value < 0 ? d.value : `+${d.value}`}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Room atmosphere overlay — subtle tint above 3D, below UI */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(10, 6, 4, 0.4) 75%)",
          zIndex: 2,
        }}
      />
      {/* Global CRT scanlines — fixed overlay above the 3D, below UI panels */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 3px)",
          mixBlendMode: "multiply",
          zIndex: 8,
        }}
      />
      {/* Global film grain — subtle, animated */}
      <div
        className="absolute inset-0 pointer-events-none animate-grain"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>\")",
          opacity: 0.08,
          mixBlendMode: "overlay",
          zIndex: 8,
        }}
      />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between gap-2 px-4 py-4 border-b border-rust/40 bg-black/40 sm:px-6">
        <Link href="/" className="shrink-0 text-[10px] tracking-[0.4em] text-rust hover:text-[var(--color-alert)] crt-text">
          ◄ Leave the table
        </Link>
        <span className="min-w-0 truncate px-2 text-[9px] tracking-[0.35em] text-[var(--color-phosphor-dim)] crt-text sm:text-[10px]">
          0x{matchId.toString(16).toUpperCase()} · devnet
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMute}
            className="flex items-center gap-1.5 text-[10px] tracking-[0.4em] text-rust hover:text-[var(--color-alert)] crt-text"
          >
            {muted ? (
              <>
                <VolumeX className="h-3.5 w-3.5" aria-hidden />
                MUTED
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" aria-hidden />
                ON
              </>
            )}
          </button>
          <span className="text-[10px] tracking-[0.4em] text-[var(--color-alert)] animate-pulse crt-text">
            ● {decoded?.status?.toUpperCase() ?? "AWAITING"}
          </span>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid h-full max-w-7xl grid-rows-[auto_1fr_auto] gap-1.5 px-6 pt-12 pb-2 overflow-hidden">
        {/* OPPONENT HUD ONLY (HP bar + status) — 3D shows through behind */}
        <section className="relative flex justify-center pt-1">
          <OpponentHud hp={opponentHp} maxHp={4} />
        </section>

        {/* CCTV VIEWPORT — 3D scene shows through this framed window */}
        <section className="relative flex items-stretch justify-center">
        </section>

        {/* PLAYER HUD */}
        <section className="relative flex flex-col gap-2 pt-1">
          {decoded?.status === "completed" && !settled && (
            <CompletedBanner
              decoded={decoded}
              youKey={youKey}
              busy={rolet.busy}
              rewardSol={vaultRewardSol}
              onSettle={async () => {
                // "already-settled" = the match account is closed (someone
                // settled first) — reward is paid either way, dismiss banner.
                const result = await rolet.settleMatch(matchId);
                if (result) setSettled(true);
              }}
            />
          )}
          {settled && (
            <div className="border-2 border-rust bg-black/70 px-4 py-3 flex items-center justify-between">
              <div className="text-[11px] tracking-[0.4em] text-rust">
                // MATCH ARCHIVED · REWARD CLAIMED
              </div>
              <Link
                href="/duel"
                className="border border-[var(--color-alert)]/50 bg-[var(--color-void)] px-4 py-2 text-[10px] tracking-[0.3em] text-[var(--color-alert)] hover:bg-[var(--color-alert)]/25"
              >
                ► NEW MATCH
              </Link>
            </div>
          )}
          {decoded?.status !== "completed" && !rolet.sessionKey && rolet.busy && (
            <div className="border border-rust/40 bg-black/60 px-4 py-3 flex items-center gap-3">
              <span className="h-2 w-2 bg-[var(--color-alert)] animate-pulse" />
              <span className="text-[10px] tracking-[0.3em] text-[var(--color-phosphor-faint)]">
                // ARMING SESSION KEY…
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 items-end lg:grid-cols-12">
            {/* Slim player vitals — Buckshot pixelated HP */}
            <div className="order-2 col-span-1 crt-frame crt-grain border border-rust/60 bg-black/70 p-2 lg:order-1 lg:col-span-2">
              <div className="flex items-center justify-between text-[8px] tracking-[0.35em] text-rust crt-text">
                <span>You</span>
                <span className={turnIsYours ? "text-[var(--color-alert)] animate-pulse" : "text-[var(--color-phosphor-faint)]"}>
                  {turnIsYours ? "TURN" : "WAIT"}
                </span>
              </div>
              <div className="mt-2">
                <HpBar hp={playerHp} maxHp={4} accent="player" />
              </div>
              <div className="mt-1 text-center text-[9px] tracking-[0.3em] text-[var(--color-phosphor-dim)] crt-text">
                HP {playerHp}/4
              </div>
            </div>

            {/* 2D card hand — shorter container so the action panel stays on-screen */}
            <div className="order-1 col-span-2 lg:order-2 lg:col-span-7 relative h-36">
              <HandRack2D
                hand={decoded?.yourHand ?? [null, null, null, null]}
                selectedSlot={selectedSlot}
                onSelect={(i) => { setSelectedSlot(i); if (i !== null) play("uiSelect"); }}
                disabled={!turnIsYours || !!decoded?.silencedYou || rolet.busy}
                playedSlot={lastPlayedSlot}
                playSignal={lastPlayedSignal}
              />
              {/* Floating PLAY button — appears when a card is selected */}
              {selectedSlot !== null && decoded?.yourHand[selectedSlot] && (
                <button
                  onClick={handlePlayCard}
                  disabled={rolet.busy || !turnIsYours}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 border border-[var(--color-alert)]/70 bg-black/85 px-4 py-1.5 text-[10px] tracking-[0.4em] text-[var(--color-alert)] font-bold shadow-[0_0_18px_rgba(220,30,30,0.6)] hover:bg-[var(--color-void)] disabled:opacity-40 crt-text"
                >
                  ▶ PLAY {CARD_LABEL[decoded.yourHand[selectedSlot]!].toUpperCase()}
                </button>
              )}
            </div>

            {/* The only action panel. Two target choices and one commit. */}
            <div className="order-3 col-span-1 flex flex-col gap-2 border border-[var(--color-line-strong)] bg-[var(--color-void)] p-2 lg:col-span-3">
              <div className="grid grid-cols-2 gap-1">
                <TargetButton label="OPP" active={target === "opponent"} onClick={() => { setTarget("opponent"); play("uiSelect"); }} />
                <TargetButton label="SELF" active={target === "self"} onClick={() => { setTarget("self"); play("uiSelect"); }} />
              </div>
              <button
                onClick={handlePullTrigger}
                disabled={!turnIsYours || rolet.busy}
                className={`btn w-full ${
                  turnIsYours && !rolet.busy ? "btn-primary" : ""
                }`}
              >
                Pull the trigger
              </button>
              {timeoutClaimable({
                status: decoded?.status ?? "",
                yourTurn: turnIsYours,
                currentSlot,
                lastActionSlot: decoded?.lastActionSlot ?? 0,
              }) && (
                <button
                  onClick={async () => {
                    const sig = await rolet.claimTimeout(matchId);
                    if (sig) {
                      const fresh = await rolet.fetchMatch(matchId);
                      if (fresh) setState(fresh);
                    }
                  }}
                  disabled={rolet.busy}
                  className="mt-1 border border-yellow-700/60 bg-yellow-950/30 px-2 py-1 text-[8px] tracking-[0.3em] text-yellow-400 hover:bg-yellow-900/50 disabled:opacity-40 crt-text text-center transition-colors"
                  title="Claim win by forfeit if opponent has stalled for 150+ slots"
                >
                  ⏱ CLAIM TIMEOUT (IF STALLED)
                </button>
              )}
            </div>
          </div>

          {/* Compact 1-line log */}
          <div className="crt-frame crt-grain border border-rust/50 bg-black/70 px-3 py-1.5 flex items-center justify-between">
            <div className="font-mono text-[10px] leading-none tracking-wide text-[var(--color-phosphor-dim)] truncate crt-text">
              {log[0]}
            </div>
          </div>

          {/* Floating toast stack */}
          {toasts.length > 0 && (
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className={`border px-4 py-2 bg-black/80 text-[10px] tracking-[0.3em] ${
                    t.level === "error"
                      ? "border-[var(--color-alert)]/50 text-[var(--color-alert)]"
                      : t.level === "success"
                      ? "border-rust text-[var(--color-alert)]"
                      : "border-[var(--color-line-strong)] text-[var(--color-phosphor-dim)]"
                  }`}
                >
                  {t.level === "error" ? "!! " : t.level === "success" ? ">> " : ".. "}
                  {t.message}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ============================================================
// PRESENTATIONAL COMPONENTS — visuals from Task 5, unchanged
// ============================================================
// ── CCTV-style viewport — 3D scene shows through this frame ──────────────────
function OpponentHud({ hp, maxHp }: { hp: number; maxHp: number }) {
  return (
    <div className="mt-3 flex items-center gap-4 border border-rust/60 bg-black/70 px-4 py-2">
      <div className="text-[10px] tracking-[0.4em] text-[var(--color-phosphor-faint)]">OPPONENT</div>
      <HpBar hp={hp} maxHp={maxHp} accent="opponent" />
    </div>
  );
}

// Buckshot-style HP bar: chunky pixelated cells, each cell ~3x4 grid of
// sub-pixels that go dark when that HP unit is gone.
function HpBar({
  hp,
  maxHp,
  accent,
}: {
  hp: number;
  maxHp: number;
  accent: "player" | "opponent";
}) {
  const low = hp <= 1;
  const mid = hp === 2;
  const aliveColor = low ? "#ff2020" : mid ? "#dd6600" : accent === "player" ? "#cc1a1a" : "#aa1010";
  const aliveGlow = low ? "#ff5050" : mid ? "#ff9933" : accent === "player" ? "#ff3030" : "#dd2020";

  return (
    <div className="flex gap-1.5 w-full">
      {Array.from({ length: maxHp }).map((_, i) => {
        const alive = i < hp;
        const cells = 8; // 4×2 sub-pixel grid inside each cell
        return (
          <motion.div
            key={i}
            className="relative flex-1 h-6 border border-[var(--color-line)]"
            style={{ imageRendering: "pixelated" as const }}
            animate={
              alive && low
                ? {
                    boxShadow: [
                      `0 0 8px ${aliveGlow}aa`,
                      `0 0 22px ${aliveGlow}`,
                      `0 0 8px ${aliveGlow}aa`,
                    ],
                  }
                : alive
                ? { boxShadow: `0 0 8px ${aliveGlow}66` }
                : { boxShadow: "none" }
            }
            transition={
              low && alive
                ? { boxShadow: { duration: 0.9, repeat: Infinity, ease: "easeInOut" } }
                : { duration: 0.3 }
            }
          >
            {/* Pixelated cell grid */}
            <div className="absolute inset-0 grid grid-rows-2 grid-cols-4 gap-px p-px">
              {Array.from({ length: cells }).map((_, j) => (
                <motion.div
                  key={j}
                  initial={false}
                  animate={{ scale: alive ? 1 : 0, opacity: alive ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 24 }}
                  style={{
                    backgroundColor: alive ? aliveColor : "#0e0606",
                    boxShadow: alive ? `inset 0 0 2px ${aliveGlow}` : "none",
                  }}
                />
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function CompletedBanner({
  decoded,
  youKey,
  busy,
  rewardSol,
  onSettle,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  decoded: any;
  youKey: string | null;
  busy: boolean;
  rewardSol: string;
  onSettle: () => Promise<unknown>;
}) {
  const youWon =
    youKey && decoded.winner && decoded.winner.toString
      ? decoded.winner.toString() === youKey
      : decoded.playerOneHp > 0
      ? decoded.playerOne === youKey
      : decoded.playerTwo === youKey;

  return (
    <div
      className={`border-2 px-4 py-4 flex items-center justify-between ${
        youWon
          ? "border-[var(--color-alert)]/70 bg-[var(--color-void)] border border-[var(--color-alert)] animate-blood"
          : "border-rust bg-black/70"
      }`}
    >
      <div>
        <div
          className={`text-[10px] tracking-[0.5em] ${
            youWon ? "text-[var(--color-alert)] text-bleed" : "text-rust"
          }`}
        >
          // MATCH RESOLVED
        </div>
        <div
          className={`mt-1 font-display tracking-[0.4em] text-2xl ${
            youWon ? "text-[var(--color-alert)] text-bleed" : "text-[var(--color-phosphor-faint)]"
          }`}
        >
          {youWon ? "YOU WIN" : "GHOST WINS"}
        </div>
        <div className="mt-1 text-[10px] tracking-[0.3em] text-[var(--color-phosphor-faint)]">
          {youWon
            ? `claim your reward · ${rewardSol} SOL will be transferred`
            : "match closed · no reward · character durability decremented"}
        </div>
      </div>
      <button
        onClick={onSettle}
        disabled={busy}
        className={`border-2 px-6 py-3 font-display tracking-[0.4em] text-sm ${
          youWon
            ? "border-[var(--color-alert)]/60 bg-black/60 text-[var(--color-alert)] hover:text-[var(--color-phosphor)]"
            : "border-rust bg-black/40 text-rust hover:text-[var(--color-phosphor-dim)]"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {busy ? "SETTLING…" : youWon ? "▼ CLAIM REWARD ▼" : "▼ ACKNOWLEDGE ▼"}
      </button>
    </div>
  );
}

function TargetButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 border text-[10px] tracking-[0.3em] transition-all ${
        active
          ? "border-[var(--color-alert)]/60 bg-[var(--color-void)] text-[var(--color-alert)] shadow-[0_0_12px_rgba(220,30,30,0.5)]"
          : "border-rust/60 bg-black/40 text-[var(--color-phosphor-faint)] hover:border-rust hover:text-[var(--color-phosphor-dim)]"
      }`}
    >
      {active ? "▣" : "□"} {label}
    </button>
  );
}

// ============================================================
// Shared lobby background + nav bar
// ============================================================
// ============================================================
// LOBBY — server queue. Players do not choose the room.
// ============================================================
type QueueResponse =
  | { ok: true; token?: string; view: QueueView; duplicate?: boolean }
  | { ok: false; error: string };

async function postQueue(body: Record<string, string>): Promise<QueueResponse> {
  const res = await fetch("/api/matchmaking", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<QueueResponse>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function Lobby() {
  const router = useRouter();
  const wallet = useWallet();
  const rolet = useRolet({ ephemeral: false });
  const toasts = useToasts();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"idle" | "signing" | "waiting" | "paired" | "assigned" | "sit" | "opening">("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [seatRole, setSeatRole] = useState<"host" | "guest" | null>(null);
  const queueLock = useRef(false);
  const abortRef = useRef(false);
  const doneRef = useRef(false);
  const openingRef = useRef(false);
  const tokenRef = useRef<string | null>(null);
  const seatWalletRef = useRef<string | null>(null);
  const offerRef = useRef<{ role: "host" | "guest"; matchId: string } | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any | null | undefined>(undefined);
  useEffect(() => {
    if (!rolet.program || !wallet.publicKey) { setProfile(undefined); return; }
    let alive = true;
    (async () => { const p = await rolet.fetchProfile(); if (alive) setProfile(p); })();
    return () => { alive = false; };
  }, [rolet, wallet.publicKey]);

  const handleCreate = useCallback(async () => {
    if (queueLock.current) return;
    if (!wallet.publicKey || !profile) { router.push("/profile"); return; }
    if (profile.durabilityRemaining === 0) {
      emitToast("error", "Character durability exhausted — purchase a new character");
      router.push("/profile");
      return;
    }
    if (!wallet.signMessage) {
      emitToast("error", "This wallet cannot sign the queue message");
      return;
    }

    queueLock.current = true;
    abortRef.current = false;
    setNotice(null);
    setBusy(true);
    setPhase("signing");
    const tell = (message: string) => {
      if (mountedRef.current) emitToast("error", message);
    };
    try {
      const walletKey = wallet.publicKey.toBase58();
      const message = queueMessage(walletKey, Date.now());
      let signature: Uint8Array;
      try {
        signature = await wallet.signMessage(new TextEncoder().encode(message));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        tell(/reject|cancel|denied/i.test(msg) ? "Queue signature was rejected." : "Could not sign the queue message.");
        return;
      }

      const entered = await postQueue({
        action: "enter",
        wallet: walletKey,
        message,
        signature: bs58.encode(signature),
      });
      if (!entered.ok || !entered.token) {
        tell(entered.ok ? "Could not join the queue." : entered.error);
        return;
      }

      if (entered.duplicate && entered.view.status === "waiting") {
        setNotice("This wallet is already waiting in another window. Use a different wallet.");
        return;
      }

      const token = entered.token;
      tokenRef.current = token;
      seatWalletRef.current = walletKey;
      let view: QueueView = entered.view;
      const deadline = Date.now() + 180_000;

      while (!doneRef.current) {
        if (!mountedRef.current) return;
        if (abortRef.current) {
          await postQueue({ action: "leave", token });
          tokenRef.current = null;
          offerRef.current = null;
          return;
        }

        const step = reduceQueueView(view);
        if (step.phase === "idle") {
          tokenRef.current = null;
          offerRef.current = null;
          tell("The queue dropped this seat.");
          return;
        }
        if (step.phase === "enter-host" && step.matchId) {
          doneRef.current = true;
          router.replace(`/duel?lobby=${new BN(step.matchId).toString(16)}`);
          return;
        }
        if (step.phase === "offer-open" && step.matchId) {
          offerRef.current = { role: "host", matchId: step.matchId };
          if (!openingRef.current) {
            setSeatRole("host");
            setPhase("assigned");
          }
        } else if (step.phase === "offer-sit" && step.matchId) {
          offerRef.current = { role: "guest", matchId: step.matchId };
          if (!openingRef.current) {
            setSeatRole("guest");
            setPhase("sit");
          }
        } else if (step.phase === "opponent" && step.matchId) {
          offerRef.current = { role: "guest", matchId: step.matchId };
          if (!openingRef.current) {
            setSeatRole("guest");
            setPhase("paired");
          }
        } else if (!openingRef.current) {
          offerRef.current = null;
          setSeatRole(null);
          setPhase("waiting");
        }

        if (view.status === "waiting" && Date.now() >= deadline) {
          await postQueue({ action: "leave", token });
          tokenRef.current = null;
          offerRef.current = null;
          tell("No opponent sat down.");
          return;
        }

        await sleep(1500);
        if (!mountedRef.current || doneRef.current) return;
        if (abortRef.current) continue;
        const status = await postQueue({ action: "status", token });
        if (!status.ok) {
          tokenRef.current = null;
          offerRef.current = null;
          tell(status.error || "Queue session expired.");
          return;
        }
        view = status.view;
      }
    } catch {
      tell("Could not join the queue.");
    } finally {
      queueLock.current = false;
      abortRef.current = false;
      if (mountedRef.current) {
        setBusy(false);
        setPhase("idle");
      }
    }
  }, [profile, rolet, router, wallet.publicKey, wallet.signMessage]);

  const handleOpenBench = useCallback(async () => {
    const offer = offerRef.current;
    const token = tokenRef.current;
    if (!offer || offer.role !== "host" || !token || openingRef.current || doneRef.current) return;
    if (!wallet.publicKey || wallet.publicKey.toBase58() !== seatWalletRef.current) {
      emitToast("error", "Switch back to the wallet that joined the queue.");
      return;
    }
    openingRef.current = true;
    setPhase("opening");
    try {
      const matchId = new BN(offer.matchId);
      const { secret, commit } = rolet.generateCommitReveal();
      const sig = await rolet.openLobby(matchId, commit, secret);
      let marked = false;
      for (let attempt = 0; attempt < 4; attempt++) {
        const opened = await postQueue({ action: "opened", token });
        if (opened.ok) {
          marked = true;
          break;
        }
        await sleep(400);
      }
      if (!marked) {
        if (sig) emitToast("error", "The bench is open. The other player was not told yet. Try again.");
        return;
      }
      doneRef.current = true;
      router.replace(`/duel?lobby=${matchId.toString(16)}`);
    } finally {
      openingRef.current = false;
      if (mountedRef.current && !doneRef.current) setPhase("assigned");
    }
  }, [rolet, router, wallet.publicKey]);

  const handleSit = useCallback(async () => {
    const offer = offerRef.current;
    if (!offer || offer.role !== "guest" || openingRef.current || doneRef.current) return;
    if (!wallet.publicKey || wallet.publicKey.toBase58() !== seatWalletRef.current) {
      emitToast("error", "Switch back to the wallet that joined the queue.");
      return;
    }
    openingRef.current = true;
    setPhase("opening");
    try {
      const matchId = new BN(offer.matchId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let lobby: any = null;
      for (let attempt = 0; attempt < 20; attempt++) {
        lobby = await rolet.fetchLobby(matchId);
        if (lobby) break;
        await sleep(800);
      }
      if (!lobby) {
        emitToast("error", "The bench is not on-chain yet.");
        return;
      }
      const walletKey = wallet.publicKey.toBase58();
      const go = () => {
        doneRef.current = true;
        router.replace(`/duel?join=${matchId.toString(16)}`);
      };
      const decision = decideSit(guestBase58(lobby.guest), walletKey);
      if (decision === "taken") {
        emitToast("error", "This seat is already taken.");
        return;
      }
      if (decision === "continue") {
        go();
        return;
      }
      const existing = rolet.recallSecret(matchId.toString());
      const secret = secretForSeat(existing, rolet.generateCommitReveal().secret);
      const sig = await rolet.joinLobby(matchId, undefined, secret);
      if (sig) {
        go();
        return;
      }
      const again = await rolet.fetchLobby(matchId);
      if (decideSit(guestBase58(again?.guest), walletKey) === "continue") go();
    } finally {
      openingRef.current = false;
      if (mountedRef.current && !doneRef.current) setPhase("sit");
    }
  }, [rolet, router, wallet.publicKey]);

  const spent = !!profile && profile.durabilityRemaining === 0;
  const looking = busy || rolet.busy;
  const seated = phase === "assigned" || phase === "paired" || phase === "sit" || (phase === "opening" && seatRole != null);
  const note = notice
    ? notice
    : !wallet.connected
    ? "Connect a wallet first."
    : profile === undefined
      ? "Checking…"
      : phase === "opening"
        ? seatRole === "guest" ? "Sitting down." : "Opening the bench."
        : phase === "signing"
          ? "Sign the queue message in your wallet."
          : phase === "assigned"
            ? "You sat first. Open the bench. The other player is waiting."
            : phase === "paired"
              ? "Stay on this screen. The other player opens the bench."
              : phase === "sit"
                ? "The bench is open. Sit down from this wallet."
                : phase === "waiting"
                  ? "Waiting for another player."
                  : undefined;
  const title = phase === "assigned" || (phase === "opening" && seatRole === "host")
    ? "Open the bench."
    : phase === "sit" || (phase === "opening" && seatRole === "guest")
      ? "Sit down."
      : phase === "paired"
        ? "Opponent found."
        : phase === "waiting" || phase === "signing"
          ? "Waiting for another player."
          : "Find a match";

  return (
    <LobbyFrame
      status={phase === "waiting" || phase === "signing" ? "Waiting" : phase === "assigned" || phase === "paired" ? "Opponent found" : phase === "sit" ? "Open seat" : phase === "opening" ? "Opening" : "Idle"}
      kicker="The bench"
      title={title}
      dial={phase !== "opening"}
      toasts={toasts}
    >
      <LobbyNote>
        The next player to sit is your opponent. You do not pick the room.
      </LobbyNote>
      {wallet.connected && profile === null ? (
        <LobbyLink href="/profile" note="A character is required before you sit.">
          Set up a character
        </LobbyLink>
      ) : spent ? (
        <LobbyLink href="/profile" note="Buy another character, then come back.">
          This character is spent
        </LobbyLink>
      ) : seated ? (
        <LobbyButton
          onClick={seatRole === "host" ? handleOpenBench : handleSit}
          disabled={phase === "paired" || phase === "opening" || rolet.busy}
          note={note}
        >
          {phase === "paired"
            ? "Waiting for the bench"
            : phase === "opening" || rolet.busy
              ? "Working…"
              : seatRole === "host"
                ? "Open the bench"
                : "Sit down"}
        </LobbyButton>
      ) : (
        <LobbyButton
          onClick={handleCreate}
          disabled={!wallet.connected || looking || !rolet.program || profile === undefined}
          note={note}
        >
          {looking ? "Looking…" : "Find a match"}
        </LobbyButton>
      )}
      {(phase === "waiting" || phase === "paired" || phase === "assigned" || phase === "sit") && (
        <LobbyQuiet onClick={() => { abortRef.current = true; }}>
          Leave the queue
        </LobbyQuiet>
      )}
      {!wallet.connected && <LobbyWallet />}
    </LobbyFrame>
  );
}

// ============================================================
// LOBBY LAUNCH HELPER — mutual initMatch with SeedSlotNotReached retry
// ============================================================
function isSeedSlotNotReached(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("SeedSlotNotReached") ||
    msg.includes("6037") ||
    msg.includes("0x1795") ||
    msg.includes("Seed slot has not been produced yet")
  );
}

function isAlreadyLaunched(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("LobbyAlreadyLaunched") ||
    msg.includes("already in use") ||
    msg.includes("6033") ||
    msg.includes("0x0")
  );
}

async function launchMatchWithRetry({
  matchId,
  rolet,
  wallet,
  router,
  isHost,
  fallbackLobby,
}: {
  matchId: BN;
  rolet: ReturnType<typeof useRolet>;
  wallet: { publicKey: PublicKey | null };
  router: { replace: (url: string) => void };
  isHost: boolean;
  fallbackLobby?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}): Promise<boolean> {
  if (!wallet.publicKey) return false;
  const matchHex = matchId.toString(16);
  const maxRetries = 12;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 1. Check if match is already created on-chain (e.g. other player succeeded)
      const existing = await rolet.fetchMatch(matchId);
      if (existing) {
        if (isHost) {
          await rolet.closeLobby(matchId).catch(() => {});
        }
        router.replace(`/duel?match=${matchHex}`);
        return true;
      }

      // 2. Fetch fresh lobby state
      const curLobby = (await rolet.fetchLobby(matchId)) ?? fallbackLobby;
      if (curLobby?.launched) {
        if (isHost) {
          await rolet.closeLobby(matchId).catch(() => {});
        }
        router.replace(`/duel?match=${matchHex}`);
        return true;
      }

      // 3. Do not ask the wallet until the seed slot is already in the past.
      const seedRaw = curLobby?.seedSlot;
      const seedSlot =
        seedRaw == null
          ? null
          : typeof seedRaw.toNumber === "function"
            ? seedRaw.toNumber()
            : Number(seedRaw);
      let curSlot = 0;
      try {
        curSlot = await rolet.connection.getSlot("confirmed");
      } catch {
        curSlot = 0;
      }
      if (!seedReady(curSlot, Number.isFinite(seedSlot) ? seedSlot : null)) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }

      // 4. Attempt initMatch
      const hostPk = curLobby?.host;
      const guestPk = curLobby?.guest as PublicKey | undefined;
      const sig = await rolet.initMatch({
        matchId,
        playerOne: hostPk,
        playerTwo: guestPk,
      });

      if (sig) {
        if (isHost) {
          await rolet.delegateMatch(matchId);
          await rolet.closeLobby(matchId).catch(() => {});
        }
        router.replace(`/duel?match=${matchHex}`);
        return true;
      }
    } catch (err: unknown) {
      if (isAlreadyLaunched(err)) {
        if (isHost) {
          await rolet.closeLobby(matchId).catch(() => {});
        }
        router.replace(`/duel?match=${matchHex}`);
        return true;
      }

      if (isSeedSlotNotReached(err)) {
        if (attempt < maxRetries - 1) {
          // Wait ~1.5s before next attempt
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        } else {
          emitToast("error", "Match seed slot not reached yet after retries — tap launch to try again");
          return false;
        }
      }

      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === maxRetries - 1) {
        emitToast("error", `Launch failed: ${msg}`);
        return false;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  emitToast("error", "The seed slot has not arrived yet. Launch the match again.");
  return false;
}

// ============================================================
// HOST WAITING — polls lobby, shows shareable link, launches match
// ============================================================
function HostWaiting({ matchId }: { matchId: BN }) {
  const router = useRouter();
  const wallet = useWallet();
  const rolet = useRolet({ ephemeral: false });
  const toasts = useToasts();
  const matchHex = matchId.toString(16);
  const [lobby, setLobby] = useState<any>(null);  // eslint-disable-line @typescript-eslint/no-explicit-any
  const [launching, setLaunching] = useState(false);
  const [joinUrl, setJoinUrl] = useState(`/duel?join=${matchHex}`);
  useEffect(() => {
    setJoinUrl(`${window.location.origin}/duel?join=${matchHex}`);
  }, [matchHex]);

  // Auto-arm session key while waiting for opponent — one popup now means
  // zero popups during the match itself.
  const autoArmedRef = useRef(false);
  useEffect(() => {
    if (!wallet.publicKey || !rolet.program || rolet.sessionKey || autoArmedRef.current) return;
    const stampKey = `rolet:session-tried:${wallet.publicKey.toBase58()}`;
    const previous = Number(window.sessionStorage.getItem(stampKey));
    if (!sessionAttemptFresh(Number.isFinite(previous) ? previous : null, Date.now())) return;
    autoArmedRef.current = true;
    window.sessionStorage.setItem(stampKey, String(Date.now()));
    rolet.startSession(60 * 60).catch(() => { autoArmedRef.current = false; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!wallet.publicKey, !!rolet.program, !!rolet.sessionKey]);

  // useRolet returns a new object while `busy` changes. The poll must read
  // it through a ref so the timer is not reset on every lobby fetch.
  // Do not scan for another open lobby here. The server assigned this room.
  // A larger pubkey used to abandon it and join a stranger.
  const roletRef = useRef(rolet);
  roletRef.current = rolet;

  const programReady = !!rolet.program;

  useEffect(() => {
    if (!programReady || !wallet.publicKey) return;
    let alive = true;

    let timer = 0;
    let failures = 0;
    const tick = async () => {
      if (!alive) return;
      try {
        const l = await roletRef.current.fetchLobby(matchId);
        if (!alive) return;
        setLobby(l);
        if (l?.hostRevealed && l?.guestRevealed) {
          const m = await roletRef.current.fetchMatch(matchId);
          if (alive && m) router.replace(`/duel?match=${matchHex}`);
        }
        failures = 0;
      } catch {
        failures += 1;
      }
      if (alive) timer = window.setTimeout(tick, pollWaitMs(failures));
    };

    roletRef.current.fetchLobby(matchId).then((l) => { if (alive) setLobby(l); });
    timer = window.setTimeout(tick, pollWaitMs(0));
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programReady, matchId, wallet.publicKey, router]);

  const guestReady = !!lobby?.guest;
  const hostRevealed = !!lobby?.hostRevealed;
  const guestRevealed = !!lobby?.guestRevealed;
  const bothRevealed = hostRevealed && guestRevealed;

  const autoLaunchedRef = useRef(false);
  const revealAttempts = useRef(0);
  const revealing = useRef(false);
  const revealed = useRef(false);
  const revealTold = useRef(false);

  // Auto-reveal host secret as soon as guest arrives. A dropped send retries.
  useEffect(() => {
    const gate = revealGate({
      needed: guestReady && !hostRevealed,
      landed: revealed.current,
      busy: rolet.busy,
      inflight: revealing.current,
      attempts: revealAttempts.current,
    });
    if (
      gate === "stop" &&
      guestReady &&
      !hostRevealed &&
      revealAttempts.current >= 3 &&
      !revealTold.current
    ) {
      revealTold.current = true;
      emitToast("error", "The reveal did not land. The host can close the lobby.");
    }
    if (gate !== "send") return;
    revealing.current = true;
    revealAttempts.current += 1;
    rolet.revealSecret(matchId).then((sig) => {
      revealing.current = false;
      if (sig) revealed.current = true;
    });
  }, [guestReady, hostRevealed, matchId, rolet]);

  const handleLaunch = useCallback(async () => {
    if (!wallet.publicKey) return;
    setLaunching(true);
    try {
      await launchMatchWithRetry({
        matchId,
        rolet,
        wallet,
        router,
        isHost: true,
        fallbackLobby: lobby,
      });
    } finally {
      setLaunching(false);
    }
  }, [wallet, lobby, matchId, rolet, router]);

  // The host publishes the match. The guest only watches for the account.
  useEffect(() => {
    if (launchActor("host") !== "send") return;
    if (bothRevealed && !autoLaunchedRef.current && !launching && !rolet.busy) {
      autoLaunchedRef.current = true;
      handleLaunch();
    }
  }, [bothRevealed, launching, rolet.busy, handleLaunch]);

  const working = launching || rolet.busy;
  const bench = hostBenchView({
    guestReady,
    hostRevealed,
    guestRevealed,
    working,
  });
  const step = !guestReady ? 1 : !bothRevealed ? 2 : 3;
  const opponent = guestReady && lobby?.guest ? (lobby.guest as PublicKey).toBase58() : null;

  return (
    <LobbyFrame
      status={guestReady ? "Opponent found" : "Waiting"}
      kicker="The bench"
      title={bench.title}
      dial={!guestReady && !working}
      farTaken={!!opponent}
      farLabel={opponent ? `${opponent.slice(0, 4)}…${opponent.slice(-4)}` : "Empty seat"}
      toasts={toasts}
    >
      <LobbySteps current={step} />
      <InviteLink url={joinUrl} />
      {opponent && (
        <LobbyNote>
          Opponent {opponent.slice(0, 4)}…{opponent.slice(-4)}
        </LobbyNote>
      )}
      {bench.launch && (
        <LobbyButton onClick={handleLaunch} note="Use this if the start stalled.">
          {working ? "Starting…" : "Launch the match"}
        </LobbyButton>
      )}
      {bench.close && (
        <>
          <LobbyQuiet
            onClick={async () => {
              const sig = await rolet.closeLobby(matchId);
              if (sig) router.replace("/duel");
            }}
          >
            Close the lobby
          </LobbyQuiet>
          <LobbyNote>
            {guestReady ? "Both players get their durability back." : "You get your durability back."}
          </LobbyNote>
        </>
      )}
    </LobbyFrame>
  );
}

// ============================================================
// GUEST LOBBY — joins lobby, reveals secret, and launches match
// ============================================================
function GuestLobby({ matchId, autoJoin = false }: { matchId: BN, autoJoin?: boolean }) {
  const router = useRouter();
  const wallet = useWallet();
  const rolet = useRolet({ ephemeral: false });
  const toasts = useToasts();
  const matchHex = matchId.toString(16);
  const [lobby, setLobby] = useState<any>(null);  // eslint-disable-line @typescript-eslint/no-explicit-any
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [launching, setLaunching] = useState(false);
  // useRef is synchronous — prevents double-fire from React batching setState
  const autoTriggeredRef = useRef(false);
  const autoWatchRef = useRef(false);

  // One registration per wallet. A refresh inside ten minutes does not ask again.
  const guestArmedRef = useRef(false);
  useEffect(() => {
    if (!wallet.publicKey || !rolet.program || rolet.sessionKey || guestArmedRef.current) return;
    const stampKey = `rolet:session-tried:${wallet.publicKey.toBase58()}`;
    const previous = Number(window.sessionStorage.getItem(stampKey));
    if (!sessionAttemptFresh(Number.isFinite(previous) ? previous : null, Date.now())) return;
    guestArmedRef.current = true;
    window.sessionStorage.setItem(stampKey, String(Date.now()));
    rolet.startSession(60 * 60).catch(() => { guestArmedRef.current = false; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!wallet.publicKey, !!rolet.program, !!rolet.sessionKey]);

  const roletRef = useRef(rolet);
  roletRef.current = rolet;

  const handleJoin = useCallback(async () => {
    if (!wallet.publicKey) return;
    const p = await rolet.fetchProfile();
    if (p && p.durabilityRemaining === 0) {
      emitToast("error", "Character durability exhausted — purchase a new character");
      router.push("/profile");
      return;
    }
    const walletKey = wallet.publicKey.toBase58();
    const existingLobby = await rolet.fetchLobby(matchId);
    const decision = decideSit(guestBase58(existingLobby?.guest), walletKey);
    if (decision === "taken") {
      emitToast("error", "This seat is already taken.");
      return;
    }
    if (decision === "continue") {
      setJoined(true);
      return;
    }
    setBusy(true);
    try {
      const existing = rolet.recallSecret(matchId.toString());
      const secret = secretForSeat(existing, rolet.generateCommitReveal().secret);
      rolet.stashSecret(matchId.toString(), secret);
      const sig = await rolet.joinLobby(matchId, undefined, secret);
      if (sig) {
        setJoined(true);
        return;
      }
      const again = await rolet.fetchLobby(matchId);
      if (decideSit(guestBase58(again?.guest), walletKey) === "continue") setJoined(true);
    } finally {
      setBusy(false);
    }
  }, [wallet.publicKey, rolet, matchId, router]);

  const handleJoinRef = useRef(handleJoin);
  handleJoinRef.current = handleJoin;

  // The queue sends the guest here as soon as the host marks the room open.
  // The lobby account can lag the RPC, so wait for it, then join once.
  useEffect(() => {
    if (!autoJoin || !wallet.publicKey || !rolet.program || joined) return;
    if (autoWatchRef.current) return;
    autoWatchRef.current = true;
    let alive = true;
    (async () => {
      for (let attempt = 0; attempt < 20 && alive; attempt++) {
        const found = await roletRef.current.fetchLobby(matchId).catch(() => null);
        if (!alive) return;
        if (found && !autoTriggeredRef.current) {
          autoTriggeredRef.current = true;
          await handleJoinRef.current();
          return;
        }
        await sleep(800);
      }
      if (alive && !autoTriggeredRef.current) {
        emitToast("error", "The bench is not on-chain yet.");
      }
    })();
    return () => {
      alive = false;
      if (!autoTriggeredRef.current) autoWatchRef.current = false;
    };
  }, [autoJoin, wallet.publicKey, rolet.program, joined, matchId]);

  // After joining, reveal secret when guest arrives, then poll for MatchState or launch.
  // A dropped reveal is retried. One swallowed failure used to stop it forever.
  const guestRevealAttempts = useRef(0);
  const guestRevealing = useRef(false);
  const guestRevealLanded = useRef(false);
  const guestRevealTold = useRef(false);
  useEffect(() => {
    if (!rolet.program || !wallet.publicKey) return;
    let alive = true;

    const maybeReveal = (l: { guest?: PublicKey | null; guestRevealed?: boolean }) => {
      const mine = !!(l.guest && wallet.publicKey && l.guest.equals(wallet.publicKey));
      if (mine) setJoined(true);
      const gate = revealGate({
        needed: mine && !l.guestRevealed,
        landed: guestRevealLanded.current,
        busy: roletRef.current.busy,
        inflight: guestRevealing.current,
        attempts: guestRevealAttempts.current,
      });
      if (
        gate === "stop" &&
        mine &&
        !l.guestRevealed &&
        guestRevealAttempts.current >= 3 &&
        !guestRevealTold.current
      ) {
        guestRevealTold.current = true;
        emitToast("error", "The reveal did not land. The host can close the lobby.");
      }
      if (gate !== "send") return;
      guestRevealing.current = true;
      guestRevealAttempts.current += 1;
      roletRef.current.revealSecret(matchId).then((sig) => {
        guestRevealing.current = false;
        if (sig) guestRevealLanded.current = true;
      });
    };

    let timer = 0;
    let failures = 0;
    const tick = async () => {
      if (!alive) return;
      try {
        const l = await roletRef.current.fetchLobby(matchId);
        if (!alive) return;
        if (l) {
          setLobby(l);
          maybeReveal(l);
        }
        if (l?.hostRevealed && l?.guestRevealed) {
          const m = await roletRef.current.fetchMatch(matchId);
          if (alive && m) {
            router.replace(`/duel?match=${matchHex}`);
            return;
          }
        }
        failures = 0;
      } catch {
        failures += 1;
      }
      if (alive) timer = window.setTimeout(tick, pollWaitMs(failures));
    };

    roletRef.current.fetchLobby(matchId).then((l) => {
      if (!alive || !l) return;
      setLobby(l);
      maybeReveal(l);
    });
    timer = window.setTimeout(tick, pollWaitMs(0));

    return () => { alive = false; window.clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, matchHex, router, wallet.publicKey, !!rolet.program]);

  const hostRevealed = !!lobby?.hostRevealed;
  const guestRevealed = !!lobby?.guestRevealed;
  const bothRevealed = hostRevealed && guestRevealed;

  const handleLaunch = useCallback(async () => {
    if (!wallet.publicKey) return;
    setLaunching(true);
    try {
      await launchMatchWithRetry({
        matchId,
        rolet,
        wallet,
        router,
        isHost: false,
        fallbackLobby: lobby,
      });
    } finally {
      setLaunching(false);
    }
  }, [wallet, lobby, matchId, rolet, router]);

  const working = launching || rolet.busy;
  const bench = guestBenchView({
    joined,
    hostRevealed,
    guestRevealed,
    working,
  });
  const step = !joined ? 0 : !bothRevealed ? 2 : 3;
  const hostPk = lobby?.host as PublicKey | undefined;
  const hostLabel = hostPk ? `${hostPk.toBase58().slice(0, 4)}…${hostPk.toBase58().slice(-4)}` : "Host";

  return (
    <LobbyFrame
      status={!joined ? "Open seat" : bothRevealed ? "Ready" : "Joined"}
      kicker="The bench"
      title={bench.title}
      dial={!joined && !working}
      farTaken
      farLabel={hostLabel}
      youSeated={joined}
      toasts={toasts}
    >
      <LobbySteps current={step} />
      {!joined && (
        <LobbyButton
          onClick={handleJoin}
          disabled={!wallet.connected || busy || rolet.busy}
          note={wallet.connected ? undefined : "Connect a wallet first."}
        >
          {busy || rolet.busy ? "Joining…" : "Join the lobby"}
        </LobbyButton>
      )}
      {bench.launch && (
        <LobbyButton onClick={handleLaunch} note="Use this if the start stalled.">
          {working ? "Starting…" : "Launch the match"}
        </LobbyButton>
      )}
      {joined && hostRevealed && !guestRevealed && (
        <LobbyNote>
          The host revealed. Your reveal has not landed. Only the host can close this lobby.
        </LobbyNote>
      )}
      {bench.leave && (
        <>
          <LobbyQuiet onClick={() => router.replace("/duel")}>Leave this screen</LobbyQuiet>
          <LobbyNote>The lobby stays open on-chain.</LobbyNote>
        </>
      )}
      {!wallet.connected && <LobbyWallet />}
    </LobbyFrame>
  );
}
