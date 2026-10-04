"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { GildedButton } from "@/components/ui/GildedButton";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";
import { Copy, Check, QrCode, Swords, PlusCircle, XCircle } from "lucide-react";

interface LobbyOverlayProps {
  onFindMatch: () => void;
  onCreateMatch: () => void;
  onCancelMatch?: () => void;
  activeLobbyId: string | null;
  isHost: boolean;
  busy: boolean;
  statusText: string;
}

export function LobbyOverlay({
  onFindMatch,
  onCreateMatch,
  onCancelMatch,
  activeLobbyId,
  isHost,
  busy,
  statusText,
}: LobbyOverlayProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined" && activeLobbyId
      ? `${window.location.origin}/play?lobby=${activeLobbyId}`
      : "";

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#070605]/85 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-sm border border-[#c6a15b]/40 bg-gradient-to-b from-[#18110b] to-[#0c0906] p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative">
        {/* Antique corner brackets */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#c6a15b]" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#c6a15b]" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#c6a15b]" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#c6a15b]" />

        {/* Header */}
        <div className="text-center mb-8">
          <ParchmentSeal label="Lobby & Matchmaking" sublabel="Solana Devnet" variant="gold" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#f5ecd8] mt-3">
            {activeLobbyId ? "WAITING FOR OPPONENT" : "SELECT DUEL TABLE"}
          </h2>
          <p className="font-serif text-xs text-[#a68e72] mt-2">
            {activeLobbyId
              ? "Your table is registered on-chain. The duel begins the moment a challenger sits opposite you."
              : "Sit at an existing open table or initialize a fresh table with custom invite."}
          </p>
        </div>

        {/* If Active Lobby is open, show QR Code and Invite Link */}
        {activeLobbyId ? (
          <div className="flex flex-col items-center">
            {/* High-Contrast Occult QR Code Container */}
            <div className="p-4 rounded-sm bg-[#e6d7c3] border-2 border-[#c6a15b] shadow-[0_0_25px_rgba(198,161,91,0.3)] mb-5">
              <QRCodeSVG
                value={inviteUrl}
                size={180}
                bgColor="#e6d7c3"
                fgColor="#140e0a"
                level="M"
              />
            </div>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#52c41a] mb-1">
                <QrCode className="w-3.5 h-3.5 text-[#52c41a]" />
                <span>BOOTH / MOBILE DEMO: SCAN QR WITH PHONE</span>
              </div>
              <span className="text-xs font-serif text-[#b8a68f]">
                or share direct invite URL with your opponent:
              </span>
            </div>

            {/* Copyable link bar */}
            <div className="w-full flex items-center gap-2 p-2 rounded-sm bg-[#120d09] border border-[#3b2b1d] mb-6">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="bg-transparent text-xs font-mono text-[#d6c4ad] w-full px-2 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#c6a15b] text-[#120d09] text-xs font-bold font-sans rounded-sm hover:bg-[#e5c378] transition-colors whitespace-nowrap cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {isHost && onCancelMatch && (
              <GildedButton
                onClick={onCancelMatch}
                variant="crimson"
                size="md"
                disabled={busy}
              >
                <XCircle className="w-4 h-4 mr-2" />
                <span>Cancel Table (Refund Rent)</span>
              </GildedButton>
            )}
          </div>
        ) : (
          /* Matchmaking Action Options */
          <div className="flex flex-col gap-4">
            <GildedButton
              onClick={onFindMatch}
              variant="gold"
              size="lg"
              disabled={busy}
              className="w-full py-4 text-sm"
            >
              <Swords className="w-4 h-4 mr-2 text-[#c6a15b]" />
              <span>Quick Match (Join Open Table)</span>
            </GildedButton>

            <GildedButton
              onClick={onCreateMatch}
              variant="dark"
              size="lg"
              disabled={busy}
              className="w-full py-4 text-sm"
            >
              <PlusCircle className="w-4 h-4 mr-2 text-[#a68e72]" />
              <span>Host New Table (Generate QR)</span>
            </GildedButton>
          </div>
        )}

        {/* Live on-chain status prompt */}
        {statusText && (
          <div className="mt-6 text-center">
            <span className="text-xs font-mono text-[#e5c378] animate-pulse">
              {statusText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
