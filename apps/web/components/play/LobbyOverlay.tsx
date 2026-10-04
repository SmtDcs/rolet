"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { GildedButton } from "@/components/ui/GildedButton";
import { ParchmentSeal } from "@/components/ui/ParchmentSeal";

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
          <ParchmentSeal label="Lobi & Eşleşme" sublabel="Solana Devnet" variant="gold" />
          <h2 className="font-['Cinzel_Decorative',serif] text-2xl sm:text-3xl font-bold tracking-tight text-[#f5ecd8] mt-3">
            {activeLobbyId ? "MASADA RAKİP BEKLENİYOR" : "DÜELLO MASASI SEÇİMİ"}
          </h2>
          <p className="font-['Cinzel',serif] text-xs text-[#a68e72] mt-2">
            {activeLobbyId
              ? "Odanız açıldı. Karşı koltuğa bir rakip oturduğu an düello başlayacaktır."
              : "Solana ağındaki açık masalardan birine katılın veya yeni bir masa açın."}
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
              <span className="text-[11px] font-['Space_Mono',monospace] text-[#52c41a] block mb-1">
                ✦ FUAR / STAND DEMOSU: TELEFON İLE QR OKUTUN
              </span>
              <span className="text-xs font-['Cinzel',serif] text-[#b8a68f]">
                veya aşağıdaki linki rakibinize gönderin:
              </span>
            </div>

            {/* Copyable link bar */}
            <div className="w-full flex items-center gap-2 p-2 rounded-sm bg-[#120d09] border border-[#3b2b1d] mb-6">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="bg-transparent text-xs font-['Space_Mono',monospace] text-[#d6c4ad] w-full px-2 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-[#c6a15b] text-[#120d09] text-xs font-bold font-['Cinzel',serif] rounded-sm hover:bg-[#e5c378] transition-colors whitespace-nowrap"
              >
                {copied ? "Kopyalandı!" : "Kopyala"}
              </button>
            </div>

            {/* Status indicator with spinning bullet animation */}
            <div className="flex items-center gap-3 text-xs font-['Space_Mono',monospace] text-[#e5c378] mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e5c378] animate-ping" />
              <span>{statusText || "Ağ taranıyor, misafir bekleniyor..."}</span>
            </div>

            {/* Cancel Button */}
            {onCancelMatch && (
              <GildedButton onClick={onCancelMatch} variant="crimson" size="sm" disabled={busy}>
                Masayı İptal Et (Dayanıklılığı Geri Al)
              </GildedButton>
            )}
          </div>
        ) : (
          /* Initial Choice: Find vs Create Match */
          <div className="flex flex-col gap-5">
            <div className="p-5 rounded-sm border border-[#3b2b1d] bg-[#140e0a] hover:border-[#c6a15b] transition-all group">
              <h3 className="font-['Cinzel',serif] text-base font-bold text-[#f5ecd8] group-hover:text-[#ffdca8] flex items-center justify-between mb-2">
                <span>HIZLI MASA BUL</span>
                <span className="text-sm font-['Space_Mono',monospace] text-[#52c41a]">● Otomatik Eşleş</span>
              </h3>
              <p className="font-['Cinzel',serif] text-xs text-[#a68e72] leading-relaxed mb-4">
                Solana ağındaki açık lobileri tarar ve bekleme yapmadan ilk müsait masaya misafir olarak oturur.
              </p>
              <GildedButton onClick={onFindMatch} variant="gold" size="md" className="w-full" disabled={busy}>
                {busy ? "Masa Aranıyor..." : "Açık Masaya Katıl"}
              </GildedButton>
            </div>

            <div className="p-5 rounded-sm border border-[#3b2b1d] bg-[#140e0a] hover:border-[#c6a15b] transition-all group">
              <h3 className="font-['Cinzel',serif] text-base font-bold text-[#f5ecd8] group-hover:text-[#ffdca8] flex items-center justify-between mb-2">
                <span>YENİ MASA OLUŞTUR (QR KOD)</span>
                <span className="text-sm font-['Space_Mono',monospace] text-[#c6a15b]">✦ Fuar / 1v1 İçin</span>
              </h3>
              <p className="font-['Cinzel',serif] text-xs text-[#a68e72] leading-relaxed mb-4">
                Kendi masanızı açın. Ekranda beliren QR kodu yanınızdaki arkadaşınıza veya stand ziyaretçisine okutarak anında maça başlayın.
              </p>
              <GildedButton onClick={onCreateMatch} variant="dark" size="md" className="w-full" disabled={busy}>
                {busy ? "Masa Açılıyor..." : "Masa Aç & QR Üret"}
              </GildedButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
