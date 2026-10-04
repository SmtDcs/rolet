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

// Dynamic import for the Diegetic 3D Arena (Zero 2D HUD)
const DuelArenaDiegetic3D = dynamic(
  () => import("@/components/play/DuelArenaDiegetic3D").then((m) => m.DuelArenaDiegetic3D),
  { ssr: false }
);

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
    pullTrigger,
    playCard,
    sessionKey,
    busy,
  } = useRolet();

  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(queryLobby);
  const [isHost, setIsHost] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [inMatch, setInMatch] = useState(false);

  // In-Game Diegetic State
  const [isYourTurn, setIsYourTurn] = useState(true);
  const [gunHeld, setGunHeld] = useState(false);
  const [target, setTarget] = useState<"self" | "opponent">("opponent");
  const [firing, setFiring] = useState<"live" | "blank" | null>(null);
  const [playerHp, setPlayerHp] = useState(3);
  const [opponentHp, setOpponentHp] = useState(3);
  const [liveCount, setLiveCount] = useState(2);
  const [blankCount, setBlankCount] = useState(2);
  const [handCards, setHandCards] = useState<string[]>(["HawkEye", "DoubleStrike"]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

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

  // Handle Diegetic Trigger Pull
  const handleFire = useCallback(async () => {
    if (!isYourTurn || firing !== null) return;
    sound.play("triggerCock");

    // On-chain execution if in match
    if (activeLobbyId && wallet.publicKey) {
      const sig = await pullTrigger({
        matchId: new BN(activeLobbyId),
        targetSelf: target === "self",
        currentTurnAuthority: wallet.publicKey,
      });
      if (sig) {
        // Recoil simulation
        setFiring("live");
        sound.play("gunshotLive");
        setTimeout(() => setFiring(null), 300);
      }
      return;
    }

    // Local duel simulation fallback
    const isLive = Math.random() < liveCount / Math.max(1, liveCount + blankCount);
    if (isLive) {
      setFiring("live");
      sound.play("gunshotLive");
      if (target === "self") {
        setPlayerHp((hp) => Math.max(0, hp - 1));
      } else {
        setOpponentHp((hp) => Math.max(0, hp - 1));
      }
      setLiveCount((c) => Math.max(0, c - 1));
    } else {
      setFiring("blank");
      sound.play("clickBlank");
      setBlankCount((c) => Math.max(0, c - 1));
    }

    setTimeout(() => {
      setFiring(null);
      // Turn switches if self shot was live or shot opponent
      if (!(target === "self" && !isLive)) {
        setIsYourTurn(false);
        setTimeout(() => setIsYourTurn(true), 2000);
      }
    }, 400);
  }, [isYourTurn, firing, activeLobbyId, wallet.publicKey, pullTrigger, target, liveCount, blankCount, sound]);

  // Handle Card Play
  const handleSelectCard = useCallback((index: number, cardName: string) => {
    sound.play("cardPlay");
    setSelectedCardIndex(index);
    emitToast("info", `Tarot Oynandı: ${cardName}`);
    setTimeout(() => {
      setHandCards((cards) => cards.filter((_, i) => i !== index));
      setSelectedCardIndex(null);
    }, 600);
  }, [sound]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070605] text-[#e6d7c3]">
      {/* Top in-game HUD bar (minimal: volume & durability) */}
      <PlayNavbar
        durabilityRemaining={durability}
        durabilityMax={10}
        hasSessionKey={Boolean(sessionKey)}
      />

      {/* Main Diegetic 3D FPS Duel Arena (Zero 2D HUD on the play table) */}
      <div className="w-full h-full pt-14 flex items-center justify-center relative">
        <DuelArenaDiegetic3D
          isYourTurn={isYourTurn}
          gunHeld={gunHeld}
          setGunHeld={setGunHeld}
          target={target}
          setTarget={setTarget}
          firing={firing}
          onFire={handleFire}
          playerHp={playerHp}
          opponentHp={opponentHp}
          playerPubkey={wallet.publicKey?.toBase58() ?? "YOU"}
          opponentPubkey="DEALER.SOL"
          liveCount={liveCount}
          blankCount={blankCount}
          cards={handCards}
          onSelectCard={handleSelectCard}
          selectedCardIndex={selectedCardIndex}
          disabled={busy}
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
    <Suspense fallback={<div className="min-h-screen bg-[#070605] flex items-center justify-center font-serif text-[#c6a15b]">Kutsal Masaya Giriliyor…</div>}>
      <PlayContent />
    </Suspense>
  );
}
