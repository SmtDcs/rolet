"use client";

// ROLET — 2D card hand. CSS/HTML playing-card faces that mirror the parked
// 3D rack (same rank/suit/glyph data), with lift / select / consume states
// and larger touch targets on mobile.

import { useEffect, useState } from "react";
import type { RoletCard } from "@/hooks/useRolet";

const CARD_GLYPH: Record<RoletCard, string> = {
  restoreBullet: "▲",
  hawkEye: "◉",
  silence: "✕",
  blocker: "▣",
  bulletExtractor: "↧",
  shuffler: "↻",
  doubleStrike: "✦",
  healer: "+",
  cardThief: "⌖",
  randomInsight: "?",
  lastChance: "!",
  handOfFate: "✧",
};

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

const CARD_RANK: Record<RoletCard, string> = {
  hawkEye: "A",
  doubleStrike: "K",
  bulletExtractor: "Q",
  cardThief: "J",
  silence: "10",
  shuffler: "9",
  blocker: "8",
  healer: "7",
  lastChance: "6",
  restoreBullet: "5",
  randomInsight: "4",
  handOfFate: "3",
};

const CARD_SUIT: Record<RoletCard, "♠" | "♥" | "♣" | "♦"> = {
  hawkEye: "♠",
  doubleStrike: "♠",
  bulletExtractor: "♠",
  cardThief: "♠",
  silence: "♣",
  blocker: "♥",
  healer: "♥",
  shuffler: "♣",
  lastChance: "♥",
  restoreBullet: "♦",
  randomInsight: "♣",
  handOfFate: "♦",
};

const isRed = (suit: string) => suit === "♥" || suit === "♦";

type HandRack2DProps = {
  hand: (RoletCard | null)[];
  selectedSlot: number | null;
  onSelect: (i: number | null) => void;
  disabled: boolean;
  playedSlot?: number | null;
  playSignal?: number;
};

export default function HandRack2D({
  hand,
  selectedSlot,
  onSelect,
  disabled,
  playedSlot = null,
  playSignal,
}: HandRack2DProps) {
  const [consumed, setConsumed] = useState<Map<number, RoletCard>>(new Map());
  const [consuming, setConsuming] = useState<{ slot: number; card: RoletCard } | null>(null);

  useEffect(() => {
    if (playSignal === undefined || playedSlot == null) return;
    const card = hand[playedSlot];
    if (card) setConsuming({ slot: playedSlot, card });
    // Intentionally keyed to the play signal only — `hand` is read at fire time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSignal, playedSlot]);

  useEffect(() => {
    if (!consuming) return;
    const timer = setTimeout(() => {
      setConsumed((prev) => {
        const next = new Map(prev);
        next.set(consuming.slot, consuming.card);
        return next;
      });
      setConsuming(null);
    }, 520);
    return () => clearTimeout(timer);
  }, [consuming]);

  return (
    <div
      className="flex h-full w-full items-end justify-center gap-1.5 sm:gap-2.5"
      style={{ perspective: "900px" }}
    >
      {hand.slice(0, 4).map((card, i) => {
        const isConsuming = consuming?.slot === i;
        const shown: RoletCard | null = isConsuming && consuming
          ? consuming.card
          : card && consumed.get(i) === card
          ? null
          : card;
        const offset = i - (hand.length - 1) / 2;
        return (
          <div
            key={i}
            style={{
              transform: `rotate(${offset * 2.4}deg) rotateX(12deg) translateY(${Math.abs(offset) * 3}px)`,
            }}
          >
            <Card2D
              card={shown}
              selected={selectedSlot === i}
              disabled={disabled || !shown}
              consuming={isConsuming}
              onSelect={() => onSelect(i === selectedSlot ? null : i)}
            />
          </div>
        );
      })}
    </div>
  );
}

function Card2D({
  card,
  selected,
  disabled,
  consuming,
  onSelect,
}: {
  card: RoletCard | null;
  selected: boolean;
  disabled: boolean;
  consuming: boolean;
  onSelect: () => void;
}) {
  if (!card) {
    return (
      <div className="h-[92px] w-[64px] border border-dashed border-rust/30 bg-black/25 sm:h-[118px] sm:w-[82px]" />
    );
  }

  const rank = CARD_RANK[card];
  const suit = CARD_SUIT[card];
  const suitColor = isRed(suit) ? "#cc1818" : "#1a0e08";

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onSelect}
      aria-label={`${CARD_LABEL[card]} — select card`}
      className={`group relative block h-[92px] w-[64px] transition-all duration-300 ease-out sm:h-[118px] sm:w-[82px] ${
        consuming
          ? "-translate-y-10 scale-110 opacity-0"
          : selected
          ? "-translate-y-3"
          : !disabled
          ? "hover:-translate-y-2"
          : ""
      } ${disabled && !consuming ? "cursor-default" : "cursor-pointer"}`}
    >
      {disabled && !consuming ? (
        <CardBack />
      ) : (
        <CardFace
          rank={rank}
          suit={suit}
          suitColor={suitColor}
          glyph={CARD_GLYPH[card]}
          label={CARD_LABEL[card]}
        />
      )}
      {selected && !consuming && (
        <div className="pointer-events-none absolute inset-0 border-2 border-red-500/80 animate-[rolet-card-glow_1.2s_ease-in-out_infinite]" />
      )}
    </button>
  );
}

function CardFace({
  rank,
  suit,
  suitColor,
  glyph,
  label,
}: {
  rank: string;
  suit: string;
  suitColor: string;
  glyph: string;
  label: string;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden border border-[#3a2418] bg-[linear-gradient(180deg,#f4e6c8_0%,#d8c5a0_100%)] shadow-[0_12px_24px_rgba(0,0,0,0.65)]">
      <div className="absolute inset-[3px] border border-[#3a2418]/70" />
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-multiply"
        style={{ filter: "url(#rolet-noise)" }}
      />
      {/* top-left corner */}
      <div
        className="absolute left-[6px] top-[4px] text-left leading-none"
        style={{ color: suitColor }}
      >
        <div className="text-[15px] font-bold sm:text-[18px]">{rank}</div>
        <div className="text-[12px] font-bold sm:text-[15px]">{suit}</div>
      </div>
      {/* centre glyph */}
      <div
        className="absolute inset-0 flex items-center justify-center text-[34px] leading-none sm:text-[44px]"
        style={{ color: "#8b3a1a" }}
      >
        {glyph}
      </div>
      {/* label + wordmark */}
      <div className="absolute inset-x-0 bottom-[16px] px-4 text-center text-[6.5px] font-bold tracking-[0.1em] text-[#2a180e] sm:text-[8px]">
        {label.toUpperCase()}
      </div>
      <div className="absolute inset-x-0 bottom-[5px] text-center text-[5.5px] tracking-[0.2em] text-[#6b4a30] sm:text-[6.5px]">
        / ROLET /
      </div>
      {/* bottom-right corner (rotated) */}
      <div
        className="absolute bottom-[4px] right-[6px] rotate-180 text-right leading-none"
        style={{ color: suitColor }}
      >
        <div className="text-[15px] font-bold sm:text-[18px]">{rank}</div>
        <div className="text-[12px] font-bold sm:text-[15px]">{suit}</div>
      </div>
    </div>
  );
}

function CardBack() {
  return (
    <div className="absolute inset-0 overflow-hidden border border-[#3a1212] bg-[#280505] shadow-[0_12px_24px_rgba(0,0,0,0.65)]">
      <div
        className="absolute inset-[3px] border border-[#5a1010]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #1a0303 0 6px, #280505 6px 12px), repeating-linear-gradient(-45deg, rgba(90,16,16,0.25) 0 2px, transparent 2px 8px)",
        }}
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#cc4422] bg-[#1a0000] px-2 py-1 text-[8px] tracking-[0.3em] text-[#dd5533]">
        ROLET
      </div>
    </div>
  );
}
