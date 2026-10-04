"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRolet, emitToast } from "@/hooks/useRolet";
import { useSound } from "@/hooks/useSound";
import { PlayNavbar } from "@/components/play/PlayNavbar";
import { LobbyOverlay } from "@/components/play/LobbyOverlay";
import { CharacterDurabilityCard } from "@/components/play/CharacterDurabilityCard";

// Dynamic imports for the board & cards
const DuelBoard2D = dynamic(() => import("@/components/DuelBoard2D"), { ssr: false });
const HandRack2D = dynamic(() => import("@/components/HandRack2D"), { ssr: false });

function PlayContent() {
  const searchParams = useSearchParams();
  const queryLobby = searchParams.get("lobby");
  const wallet = useWallet();
  const sound = useSound();

  const {
    openLobby,
    joinLobby,
    findOpenLobby,
    closeLobby,
    fetchProfile,
    purchaseCharacter,
    generateCommitReveal,
    sessionKey,
    busy,
  } = useRolet();

  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(queryLobby);
  const [isHost, setIsHost] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [inMatch, setInMatch] = useState(false);

  // Profile & Durability
  const [durability, setDurability] = useState(10);
  const [showBuyCharacter, setShowBuyCharacter] = useState(false);

  // Load profile durability
  useEffect(() => {
    if (wallet.publicKey) {
      fetchProfile(wallet.publicKey).then((p: any) => {
        if (p) {
          const rem = typeof p.durabilityRemaining === "number" ? p.durabilityRemaining : 10;
          setDurability(rem);
          if (rem <= 0) {
            setShowBuyCharacter(true);
          }
        }
      });
    }
  }, [wallet.publicKey, fetchProfile]);

  // Handle Find Match (Join available lobby)
  const handleFindMatch = useCallback(async () => {
    if (!wallet.publicKey) {
      emitToast("error", "Önce Solana cüzdanınızı bağlayın");
      return;
    }
    if (durability <= 0) {
      setShowBuyCharacter(true);
      return;
    }

    setStatusText("Açık lobi aranıyor...");
    const open = await findOpenLobby();
    if (!open) {
      emitToast("info", "Açık masa bulunamadı. Yeni bir masa oluşturuluyor...");
      handleCreateMatch();
      return;
    }

    setStatusText(`Masaya oturuluyor: ${open.matchId.toString()}...`);
    const { secret, commit } = generateCommitReveal();
    const sig = await joinLobby(open.matchId, commit, secret);
    if (sig) {
      sound.play("triggerCock");
      setActiveLobbyId(open.matchId.toString());
      setIsHost(false);
      setInMatch(true);
    }
  }, [wallet.publicKey, durability, findOpenLobby, joinLobby, generateCommitReveal, sound]);

  // Handle Create Match (Host lobby)
  const handleCreateMatch = useCallback(async () => {
    if (!wallet.publicKey) {
      emitToast("error", "Önce Solana cüzdanınızı bağlayın");
      return;
    }
    if (durability <= 0) {
      setShowBuyCharacter(true);
      return;
    }

    const newId = new BN(Date.now());
    setStatusText("Masa Solana Devnet üzerinde açılıyor...");
    const { commit } = generateCommitReveal();
    const sig = await openLobby(newId, commit);
    if (sig) {
      sound.play("triggerCock");
      setActiveLobbyId(newId.toString());
      setIsHost(true);
      setStatusText("Masa açıldı. Karşı koltuğa misafir bekleniyor...");
    }
  }, [wallet.publicKey, durability, openLobby, generateCommitReveal, sound]);

  // Handle Cancel Match (Host cancels and gets durability back)
  const handleCancelMatch = useCallback(async () => {
    if (!activeLobbyId) return;
    setStatusText("Masa kapatılıyor ve kira iade ediliyor...");
    const sig = await closeLobby(new BN(activeLobbyId));
    if (sig) {
      sound.play("clickBlank");
      setActiveLobbyId(null);
      setIsHost(false);
      setStatusText("");
      emitToast("info", "Masa iptal edildi");
    }
  }, [activeLobbyId, closeLobby, sound]);

  // Handle Character Purchase
  const handlePurchaseCharacter = async (snsDomain: string) => {
    if (!wallet.publicKey) return;
    const fakeNft = PublicKey.default;
    const sig = await purchaseCharacter({ snsDomain, characterNft: fakeNft });
    if (sig) {
      setDurability(10);
      setShowBuyCharacter(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070605] text-[#e6d7c3]">
      {/* Top in-game HUD bar */}
      <PlayNavbar
        durabilityRemaining={durability}
        durabilityMax={10}
        hasSessionKey={Boolean(sessionKey)}
      />

      {/* Main 3D / 2.5D Duel Stage Container */}
      <div className="w-full h-full pt-16 flex items-center justify-center relative">
        <DuelBoard2D
          isYourTurn={false}
          gunHeld={false}
          target="opponent"
          firing={null}
          opponentPubkey=""
          opponentHp={3}
          opponentHitSignal={0}
          liveCount={0}
          blankCount={0}
        />
      </div>

      {/* Lobby Overlay (Shown when not actively in a match) */}
      {!inMatch && (
        <LobbyOverlay
          onFindMatch={handleFindMatch}
          onCreateMatch={handleCreateMatch}
          onCancelMatch={activeLobbyId && isHost ? handleCancelMatch : undefined}
          activeLobbyId={activeLobbyId}
          isHost={isHost}
          busy={busy}
          statusText={statusText}
        />
      )}

      {/* Buy Character Modal (Shown when durability is 0) */}
      {showBuyCharacter && (
        <CharacterDurabilityCard
          durabilityRemaining={durability}
          durabilityMax={10}
          characterPriceSol={0.1}
          onPurchase={handlePurchaseCharacter}
          busy={busy}
        />
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070605] flex items-center justify-center font-['Cinzel',serif] text-[#c6a15b]">Kumarhane Masası Yükleniyor...</div>}>
      <PlayContent />
    </Suspense>
  );
}
