"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_SLOT_HASHES_PUBKEY,
  Keypair,
  Transaction,
  LAMPORTS_PER_SOL,
  type Commitment,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  blockhashExpired,
  expiredChainError,
  readSignature,
  sessionArmMessage,
  sessionFundPlan,
  shouldArmSession,
  turnRoute,
} from "@/lib/chainPace";
import { keccak_256 } from "@noble/hashes/sha3.js";
import bs58 from "bs58";

import idl from "@/idl/rolet.json";
import type { Rolet } from "@/idl/rolet_types";
import { treasurySolPda } from "@/lib/economy";
import { computeLobbyCommit } from "@/lib/lobbyCommit";

export { computeLobbyCommit };

// ============================================================
// Constants
// ============================================================
const ROLET_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ROLET_PROGRAM_ID ??
  (idl as { address: string }).address
);

/**
 * Turn traffic goes straight to the validator that holds the match. The EU
 * validator is the one the program pins in delegate_match. The router answers
 * for delegated accounts only, so a turn that also reads PlayerProfile is sent
 * to the validator itself.
 */
const ER_ENDPOINT =
  process.env.NEXT_PUBLIC_MAGICBLOCK_ER_ENDPOINT ??
  "https://devnet-eu.magicblock.app";
const DELEGATION_PROGRAM_ID = new PublicKey(
  "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
);
const MAGIC_PROGRAM_ID = new PublicKey("Magic11111111111111111111111111111111111111");
const MAGIC_CONTEXT_ID = new PublicKey("MagicContext1111111111111111111111111111111");

const MATCH_SEED = Buffer.from("match");
const PROFILE_SEED = Buffer.from("profile");
const VAULT_SEED = Buffer.from("vault");
const LOBBY_SEED = Buffer.from("lobby");

// ============================================================
// Types — mirror the on-chain Card enum (camelCase per Anchor 0.30 IDL)
// ============================================================
export type RoletCard =
  | "restoreBullet"
  | "hawkEye"
  | "silence"
  | "blocker"
  | "bulletExtractor"
  | "shuffler"
  | "doubleStrike"
  | "healer"
  | "cardThief"
  | "randomInsight"
  | "lastChance"
  | "handOfFate";

const cardArg = (c: RoletCard) => ({ [c]: {} } as Record<string, object>);

export type Toast = {
  id: number;
  level: "success" | "error" | "info";
  message: string;
};

type CommitReveal = {
  secret: Uint8Array;
  commit: Uint8Array;
};

// ============================================================
// Mock toast bus
// ============================================================
let toastSeq = 0;
const toastListeners = new Set<(t: Toast) => void>();
export function emitToast(level: Toast["level"], message: string) {
  const t: Toast = { id: ++toastSeq, level, message };
  toastListeners.forEach((l) => l(t));
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log(`[rolet:${level}] ${message}`);
  }
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const cb = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(
        () => setToasts((prev) => prev.filter((x) => x.id !== t.id)),
        4000
      );
    };
    toastListeners.add(cb);
    return () => {
      toastListeners.delete(cb);
    };
  }, []);
  return toasts;
}

// ============================================================
// Session-key helpers (MagicBlock gasless turns)
// ============================================================
type SessionKeyState = {
  keypair: Keypair;
  expiresAt: number;
};

function loadSessionKey(walletKey: string): SessionKeyState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`rolet:session:${walletKey}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { secret: number[]; expiresAt: number };
    if (parsed.expiresAt * 1000 < Date.now()) return null;
    return {
      keypair: Keypair.fromSecretKey(Uint8Array.from(parsed.secret)),
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

function persistSessionKey(walletKey: string, sk: SessionKeyState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `rolet:session:${walletKey}`,
    JSON.stringify({
      secret: Array.from(sk.keypair.secretKey),
      expiresAt: sk.expiresAt,
    })
  );
}

// ============================================================
// PDA helpers
// ============================================================
function matchPda(matchId: BN) {
  return PublicKey.findProgramAddressSync(
    [MATCH_SEED, matchId.toArrayLike(Buffer, "le", 8)],
    ROLET_PROGRAM_ID
  )[0];
}

function profilePda(authority: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [PROFILE_SEED, authority.toBuffer()],
    ROLET_PROGRAM_ID
  )[0];
}

function vaultPda() {
  return PublicKey.findProgramAddressSync([VAULT_SEED], ROLET_PROGRAM_ID)[0];
}

function lobbyPda(matchId: BN) {
  return PublicKey.findProgramAddressSync(
    [LOBBY_SEED, matchId.toArrayLike(Buffer, "le", 8)],
    ROLET_PROGRAM_ID
  )[0];
}

// ============================================================
// Commit-Reveal generator
// ============================================================
/**
 * Generates a fresh secret. When `player` + `matchId` are given, `commit` is
 * the bound on-chain commitment. Without them `commit` is NOT valid on-chain;
 * openLobby / joinLobby always recompute the bound commit from the secret.
 */
function generateCommitReveal(player?: PublicKey, matchId?: BN): CommitReveal {
  const secret = new Uint8Array(32);
  crypto.getRandomValues(secret);
  const commit =
    player && matchId ? computeLobbyCommit(secret, player, matchId) : keccak_256(secret);
  return { secret, commit };
}

/**
 * Resolve the secret for this lobby seat (explicit > stashed > fresh), stash
 * it for reveal_secret, and return the commitment bound to (player, matchId).
 * The caller-supplied commit is ignored so every call site stays aligned
 * with the on-chain preimage.
 */
function boundCommitFor(matchId: BN, player: PublicKey, secret?: Uint8Array): Uint8Array {
  let s = secret ?? recallSecret(matchId.toString());
  if (!s) {
    s = new Uint8Array(32);
    crypto.getRandomValues(s);
  }
  stashSecret(matchId.toString(), s);
  return computeLobbyCommit(s, player, matchId);
}

function stashSecret(matchId: string, secret: Uint8Array) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    `rolet:secret:${matchId}`,
    Buffer.from(secret).toString("hex")
  );
}

function recallSecret(matchId: string): Uint8Array | null {
  if (typeof window === "undefined") return null;
  const hex = window.sessionStorage.getItem(`rolet:secret:${matchId}`);
  return hex ? Uint8Array.from(Buffer.from(hex, "hex")) : null;
}

// ============================================================
// useRolet — main integration hook
// ============================================================
function installHttpConfirmation(conn: Connection) {
  const marked = conn as Connection & { __roletHttpConfirm?: true };
  if (marked.__roletHttpConfirm) return;
  marked.__roletHttpConfirm = true;
  // web3.js confirms through a devnet websocket and logs "ws error" when it drops.
  // Poll the signature over HTTP instead. Nothing here opens that socket.
  marked.confirmTransaction = (async (strategy: unknown, commitment?: string) => {
    const signature =
      typeof strategy === "string" ? strategy : (strategy as { signature: string }).signature;
    const lastValid =
      strategy && typeof strategy === "object" && "lastValidBlockHeight" in strategy
        ? Number((strategy as { lastValidBlockHeight: number }).lastValidBlockHeight)
        : null;
    const want = (commitment || conn.commitment || "confirmed") as Commitment;
    for (let i = 0; i < 40; i++) {
      const res = await conn.getSignatureStatuses([signature]);
      const value = res.value[0];
      const read = readSignature(value);
      if (read === "failed") {
        const err = value?.err;
        throw new Error(typeof err === "string" ? err : "Transaction failed");
      }
      if (read === "landed" && value) {
        return { context: res.context, value };
      }
      if (lastValid != null && i % 2 === 1) {
        const height = await conn.getBlockHeight(want).catch(() => -1);
        if (height > 0 && blockhashExpired(height, lastValid)) {
          throw new Error(`Signature ${signature} has expired: block height exceeded.`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error(`Signature ${signature} has expired: block height exceeded.`);
  }) as Connection["confirmTransaction"];
}

export function useRolet({ ephemeral = false }: { ephemeral?: boolean } = {}) {
  const { connection: l1Connection } = useConnection();
  installHttpConfirmation(l1Connection);
  const wallet = useWallet();

  const [busy, setBusy] = useState(false);
  const [sessionKey, setSessionKey] = useState<SessionKeyState | null>(null);

  const erConnection = useMemo(() => {
    const conn = new Connection(ER_ENDPOINT, {
      commitment: "confirmed",
      disableRetryOnRateLimit: true,
    });
    installHttpConfirmation(conn);
    return conn;
  }, []);

  const connection = ephemeral && erConnection ? erConnection : l1Connection;

  useEffect(() => {
    if (!wallet.publicKey) {
      setSessionKey(null);
      return;
    }
    const cached = loadSessionKey(wallet.publicKey.toBase58());
    if (cached) setSessionKey(cached);
  }, [wallet.publicKey]);

  /**
   * Build two Program instances:
   *  - programL1: always points at the base layer (devnet / localnet). Used
   *    for every instruction that touches an account NOT delegated to the ER
   *    (PlayerProfile, GameVault, MatchState before delegate, settle_match).
   *  - programER: points at the MagicBlock ER endpoint when ephemeral mode
   *    is on. Only play_card / pull_trigger use it (after delegate).
   *
   * Untyped Program because hand-rolled IDL's literal types don't satisfy
   * the Idl constraint at compile time.
   */
  const buildProgram = useCallback(
    (conn: Connection, fast: boolean): Program | null => {
      if (
        !wallet.publicKey ||
        !wallet.signTransaction ||
        !wallet.signAllTransactions
      ) {
        return null;
      }
      const provider = new AnchorProvider(
        conn,
        {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions,
        },
        {
          commitment: fast ? "processed" : "confirmed",
          skipPreflight: fast,
        }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new Program(idl as any, provider);
    },
    [wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]
  );

  const programL1 = useMemo(
    () => buildProgram(l1Connection, false),
    [buildProgram, l1Connection]
  );

  const programER = useMemo(
    () => buildProgram(erConnection, true),
    [buildProgram, erConnection]
  );

  // Backwards-compat: existing call sites read `program`. Default to L1.
  const program = programL1;

  const sendWithSessionKey = useCallback(
    async (tx: Transaction, conn: Connection = l1Connection): Promise<string> => {
      if (!sessionKey) throw new Error("No active session key");
      const keypair = sessionKey.keypair;
      let lastErr: unknown;
      // A 429 can hold the first signature past its block height. The session
      // key signs the replacement. The wallet is not asked again.
      for (let attempt = 0; attempt < 2; attempt++) {
        tx.signatures = [];
        tx.feePayer = keypair.publicKey;
        const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.sign(keypair);
        try {
          const sig = await conn.sendRawTransaction(tx.serialize(), {
            skipPreflight: true,
            maxRetries: 2,
          });
          await conn.confirmTransaction(
            { signature: sig, blockhash, lastValidBlockHeight },
            "confirmed"
          );
          return sig;
        } catch (err) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          if (attempt === 0 && expiredChainError(msg)) continue;
          throw err;
        }
      }
      throw lastErr;
    },
    [l1Connection, sessionKey]
  );

  /**
   * Arms a gasless session: generates a local keypair, registers it on-chain
   * via `register_session_key` (single Phantom popup), then airdrops it a
   * small amount of SOL so it can pay tx fees inside the ER.
   */
  const startSession = useCallback(
    async (durationSeconds = 60 * 60) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Connect wallet first");
      }
      setBusy(true);
      try {
        const kp = Keypair.generate();

        // Fund from the devnet faucet only. Never pull SOL out of the player's wallet.
        let funded = false;
        try {
          const airdropSig = await l1Connection.requestAirdrop(kp.publicKey, 0.005 * LAMPORTS_PER_SOL);
          await l1Connection.confirmTransaction(airdropSig, "confirmed");
          funded = true;
        } catch {
          funded = false;
        }
        if (sessionFundPlan(funded) === "skip") {
          emitToast("info", sessionArmMessage(false));
          return null;
        }

        const regSig = await program.methods
          .registerSessionKey(kp.publicKey, new BN(durationSeconds))
          .accounts({
            profile: profilePda(wallet.publicKey),
            authority: wallet.publicKey,
          } as never)
          .rpc({ commitment: "confirmed" });
        emitToast("success", `Session registered · ${regSig.slice(0, 6)}…`);

        if (shouldArmSession(funded)) {
          const state: SessionKeyState = {
            keypair: kp,
            expiresAt: Math.floor(Date.now() / 1000) + durationSeconds,
          };
          setSessionKey(state);
          persistSessionKey(wallet.publicKey.toBase58(), state);
        }
        emitToast("info", sessionArmMessage(funded));
        return funded ? kp.publicKey : null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emitToast("error", `start_session failed · ${msg}`);
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [program, wallet, l1Connection]
  );

  const matchIsDelegated = useCallback(
    async (matchId: BN) => {
      const info = await l1Connection.getAccountInfo(matchPda(matchId));
      return turnRoute(!!info && info.owner.equals(DELEGATION_PROGRAM_ID)) === "rollup";
    },
    [l1Connection]
  );

  /**
   * One devnet transaction. The program CPIs the delegation program and
   * locks MatchState on the EU rollup. Lobby instructions stay here.
   */
  const delegateMatch = useCallback(
    async (matchId: BN) => {
      if (!programL1 || !wallet.publicKey) {
        emitToast("error", "Wallet not connected");
        return null;
      }
      setBusy(true);
      try {
        const matchState = matchPda(matchId);
        const [bufferMatchState] = PublicKey.findProgramAddressSync(
          [Buffer.from("buffer"), matchState.toBuffer()],
          ROLET_PROGRAM_ID
        );
        const [delegationRecordMatchState] = PublicKey.findProgramAddressSync(
          [Buffer.from("delegation"), matchState.toBuffer()],
          DELEGATION_PROGRAM_ID
        );
        const [delegationMetadataMatchState] = PublicKey.findProgramAddressSync(
          [Buffer.from("delegation-metadata"), matchState.toBuffer()],
          DELEGATION_PROGRAM_ID
        );
        const sig = await programL1.methods
          .delegateMatch(matchId)
          .accounts({
            payer: wallet.publicKey,
            matchState,
            bufferMatchState,
            delegationRecordMatchState,
            delegationMetadataMatchState,
            ownerProgram: ROLET_PROGRAM_ID,
            delegationProgram: DELEGATION_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as never)
          .rpc({ commitment: "confirmed" });
        emitToast("success", `Match delegated · ${sig.slice(0, 6)}…`);
        return sig;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emitToast("error", `delegate_match failed · ${msg}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [programL1, wallet.publicKey]
  );

  const commitAndUndelegateMatch = useCallback(
    async (matchId: BN) => {
      if (!programER || !wallet.publicKey) {
        emitToast("error", "Wallet not connected");
        return null;
      }
      setBusy(true);
      try {
        const sig = await programER.methods
          .commitAndUndelegateMatch()
          .accounts({
            payer: wallet.publicKey,
            matchState: matchPda(matchId),
            magicProgram: MAGIC_PROGRAM_ID,
            magicContext: MAGIC_CONTEXT_ID,
          } as never)
          .rpc({ commitment: "confirmed" });
        for (let i = 0; i < 15; i++) {
          const info = await l1Connection.getAccountInfo(matchPda(matchId));
          if (info && info.owner.equals(ROLET_PROGRAM_ID)) break;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        emitToast("success", `Match returned to devnet · ${sig.slice(0, 6)}…`);
        return sig;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emitToast("error", `commit_and_undelegate failed · ${msg}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [programER, wallet.publicKey, l1Connection]
  );

  /**
   * Scans the network for an open LobbyState (guest == None)
   * The Option<Pubkey> for guest starts at offset 80:
   * 8 (disc) + 8 (match_id) + 32 (host) + 32 (host_commit) = 80 bytes.
   * If byte 80 is 0, the option is None.
   */
  const findOpenLobby = useCallback(async (excludeHost?: PublicKey): Promise<{ matchId: BN; host: PublicKey } | null> => {
    if (!programL1) return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lobbies = await (programL1.account as any).lobbyState.all([
        { memcmp: { offset: 80, bytes: bs58.encode(Uint8Array.from([0])) } },
      ]);
      // Only consider lobbies opened in the last 5 minutes.
      // matchId = Date.now() so stale lobbies from previous sessions have
      // much smaller values and are automatically excluded.
      const fiveMinutesAgo = new BN(Date.now() - 5 * 60 * 1000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filtered = lobbies.filter((l: any) => {
        if (excludeHost && l.account.host.equals(excludeHost)) return false;
        return (l.account.matchId as BN).gt(fiveMinutesAgo);
      });
      if (filtered.length > 0) {
        return {
          matchId: filtered[0].account.matchId as BN,
          host: filtered[0].account.host as PublicKey,
        };
      }
      return null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[findOpenLobby] error:", err);
      return null;
    }
  }, [programL1]);

  const initMatch = useCallback(
    async ({
      matchId,
      playerOne,
      playerTwo,
      opponent,
    }: {
      matchId: BN;
      playerOne?: PublicKey;
      playerTwo?: PublicKey;
      opponent?: PublicKey;
      opponentCommit?: Uint8Array;
      opponentSecret?: Uint8Array;
    }) => {
      if (!program || !wallet.publicKey) {
        emitToast("error", "Wallet not connected");
        return null;
      }
      setBusy(true);
      try {
        let p1 = playerOne;
        let p2 = playerTwo ?? opponent;
        if (!p1 || !p2) {
          const l: any = await ((programL1 ?? program)!.account as any).lobbyState.fetch(lobbyPda(matchId));
          p1 = p1 ?? l.host;
          p2 = p2 ?? l.guest;
        }
        if (!p1 || !p2) {
          throw new Error("Lobby missing host or guest");
        }

        const sig = await program.methods
          .initMatch(matchId)
          .accounts({
            matchState: matchPda(matchId),
            lobby: lobbyPda(matchId),
            playerOne: p1,
            playerTwo: p2,
            payer: wallet.publicKey,
            slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
            systemProgram: SystemProgram.programId,
          } as never)
          .rpc({ commitment: "confirmed" });

        emitToast("success", `Match seeded · ${sig.slice(0, 8)}…`);
        return sig;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const isBenign =
          msg.includes("SeedSlotNotReached") ||
          msg.includes("6037") ||
          msg.includes("0x1795") ||
          msg.includes("Seed slot has not been produced yet") ||
          msg.includes("LobbyAlreadyLaunched") ||
          msg.includes("already in use") ||
          msg.includes("6033") ||
          msg.includes("0x0");
        if (!isBenign) {
          emitToast("error", `init_match failed · ${msg}`);
        }
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [program, programL1, wallet.publicKey]
  );


  const playCard = useCallback(
    async ({
      matchId,
      slot,
      card,
      currentTurnAuthority,
    }: {
      matchId: BN;
      slot: number;
      card: RoletCard;
      /** The wallet pubkey of whoever's turn it currently is (from MatchState) */
      currentTurnAuthority: PublicKey;
    }) => {
      if (!program || !wallet.publicKey) {
        emitToast("error", "Wallet not connected");
        return null;
      }
      if (slot < 0 || slot > 3) {
        emitToast("error", "Invalid slot index");
        return null;
      }

      setBusy(true);
      try {
        const accounts = {
          matchState: matchPda(matchId),
          currentProfile: profilePda(currentTurnAuthority),
          actor: sessionKey
            ? sessionKey.keypair.publicKey
            : wallet.publicKey,
        };

        // The session key signs when it is armed. A delegated match is sent
        // to the router. A base-layer match stays on devnet.
        const rollup = await matchIsDelegated(matchId);
        const turnProgram = rollup ? programER : programL1;
        if (!turnProgram) {
          emitToast("error", "Wallet not connected");
          return null;
        }
        let sig: string;
        if (sessionKey) {
          const ix = await turnProgram.methods
            .playCard(slot, cardArg(card) as never)
            .accounts(accounts as never)
            .instruction();
          const tx = new Transaction().add(ix);
          sig = await sendWithSessionKey(tx, rollup ? erConnection : l1Connection);
        } else {
          sig = await turnProgram.methods
            .playCard(slot, cardArg(card) as never)
            .accounts(accounts as never)
            .rpc();
        }

        emitToast("success", `Played ${card} · ${sig.slice(0, 6)}…`);
        return sig;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emitToast("error", `play_card failed · ${msg}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [programL1, programER, wallet.publicKey, sessionKey, ephemeral, sendWithSessionKey, matchIsDelegated, erConnection, l1Connection]
  );

  const pullTrigger = useCallback(
    async ({
      matchId,
      targetSelf,
      currentTurnAuthority,
    }: {
      matchId: BN;
      targetSelf: boolean;
      currentTurnAuthority: PublicKey;
    }) => {
      if (!program || !wallet.publicKey) {
        emitToast("error", "Wallet not connected");
        return null;
      }
      setBusy(true);
      try {
        const accounts = {
          matchState: matchPda(matchId),
          currentProfile: profilePda(currentTurnAuthority),
          actor: sessionKey
            ? sessionKey.keypair.publicKey
            : wallet.publicKey,
        };

        const rollup = await matchIsDelegated(matchId);
        const turnProgram = rollup ? programER : programL1;
        if (!turnProgram) {
          emitToast("error", "Wallet not connected");
          return null;
        }
        let sig: string;
        if (sessionKey) {
          const ix = await turnProgram.methods
            .pullTrigger(targetSelf)
            .accounts(accounts as never)
            .instruction();
          const tx = new Transaction().add(ix);
          sig = await sendWithSessionKey(tx, rollup ? erConnection : l1Connection);
        } else {
          sig = await turnProgram.methods
            .pullTrigger(targetSelf)
            .accounts(accounts as never)
            .rpc();
        }

        emitToast(
          targetSelf ? "info" : "success",
          `Trigger pulled → ${targetSelf ? "SELF" : "OPPONENT"
          } · ${sig.slice(0, 6)}…`
        );
        return sig;
      } catch (err: unknown) {
        // Anchor errors arrive as nested objects ({ error: { errorCode: … } })
        // or plain Error — extract the most readable message either way.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyErr = err as any;
        const msg =
          anyErr?.error?.errorMessage ??
          anyErr?.error?.errorMsg ??
          (anyErr?.error?.errorCode?.number
            ? `error code ${anyErr.error.errorCode.number}`
            : undefined) ??
          (err instanceof Error ? err.message : String(err));
        emitToast("error", `pull_trigger failed · ${msg}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [programL1, programER, wallet.publicKey, sessionKey, ephemeral, sendWithSessionKey, matchIsDelegated, erConnection, l1Connection]
  );

  const fetchVault = useCallback(async () => {
    if (!program) return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (program.account as any).gameVault.fetch(vaultPda());
    } catch {
      return null;
    }
  }, [program]);

  const setCharacterNft = useCallback(
    async ({
      snsDomain,
      characterNft,
      durabilityMax = 10,
    }: {
      snsDomain: string;
      characterNft: PublicKey;
      durabilityMax?: number;
    }) => {
      if (!program || !wallet.publicKey) {
        emitToast("error", "Wallet not connected");
        return null;
      }
      setBusy(true);
      try {
        const sig = await program.methods
          .setCharacterNft(snsDomain, durabilityMax)
          .accounts({
            profile: profilePda(wallet.publicKey),
            characterNft,
            authority: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          } as never)
          .rpc({ commitment: "confirmed" });
        emitToast("success", `Character equipped · ${sig.slice(0, 8)}…`);
        return sig;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emitToast("error", `set_character_nft failed · ${msg}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [program, wallet.publicKey]
  );

  const purchaseCharacter = useCallback(
    async ({
      snsDomain,
      characterNft,
      durabilityMax = 10,
    }: {
      snsDomain: string;
      characterNft: PublicKey;
      durabilityMax?: number;
    }) => {
      if (!program || !wallet.publicKey) {
        emitToast("error", "Wallet not connected");
        return null;
      }
      setBusy(true);
      try {
        const v = await fetchVault();
        if (!v) throw new Error("vault not initialised");
        const sig = await program.methods
          .purchaseCharacter(snsDomain, durabilityMax)
          .accounts({
            profile: profilePda(wallet.publicKey),
            characterNft,
            vault: vaultPda(),
            treasurySol: treasurySolPda(vaultPda(), ROLET_PROGRAM_ID),
            opsWallet: v.opsWallet,
            buyer: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          } as never)
          .rpc({ commitment: "confirmed" });
        emitToast("success", `Character purchased · ${sig.slice(0, 8)}…`);
        return sig;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emitToast("error", `purchase_character failed · ${msg}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [program, wallet.publicKey, fetchVault]
  );

  const fetchProfile = useCallback(
    async (authority?: PublicKey) => {
      if (!program) return null;
      const who = authority ?? wallet.publicKey;
      if (!who) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (program.account as any).playerProfile.fetch(profilePda(who));
      } catch {
        return null;
      }
    },
    [program, wallet.publicKey]
  );

  /**
   * Finalize a Completed match. Reads the winner from on-chain state and the
   * SOL treasury from the GameVault, then calls settle_match to pay the winner
   * in SOL and decrement both characters' durability.
   * Anyone can call — the winner's wallet doesn't have to be the signer.
   */
  const settleMatch = useCallback(
    async (matchId: BN) => {
      if (!programL1 || !wallet.publicKey || !wallet.signTransaction) {
        emitToast("error", "Wallet not connected");
        return null;
      }
      setBusy(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m: any = await (programL1.account as any).matchState.fetch(
          matchPda(matchId),
        );
        if (!m.winner) {
          emitToast("error", "Match has no winner recorded");
          return null;
        }
        const winnerPk: PublicKey = m.winner;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const v: any = await (programL1.account as any).gameVault.fetch(vaultPda());
        const treasurySol: PublicKey = v.treasurySol;

        const settleIx = await programL1.methods
          .settleMatch()
          .accounts({
            matchState: matchPda(matchId),
            profileOne: profilePda(m.playerOne),
            profileTwo: profilePda(m.playerTwo),
            vault: vaultPda(),
            treasurySol,
            winner: winnerPk,
            rentRefund: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          } as never)
          .instruction();

        const tx = new Transaction().add(settleIx);
        tx.feePayer = wallet.publicKey;
        tx.recentBlockhash = (await l1Connection.getLatestBlockhash()).blockhash;
        const signed = await wallet.signTransaction(tx);
        const sig = await l1Connection.sendRawTransaction(signed.serialize());
        await l1Connection.confirmTransaction(sig, "confirmed");
        emitToast("success", `Match settled · ${sig.slice(0, 6)}…`);
        return sig;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("does not exist") || msg.includes("has no data")) {
          // The match account is closed after settle — someone (the winner,
          // or the loser's ACKNOWLEDGE path) already settled it. That is a
          // SUCCESS for the caller: the reward is paid, stats are written.
          // Return a sentinel so the UI can dismiss the claim banner.
          emitToast("info", "Match already settled — reward paid");
          return "already-settled";
        }
        emitToast("error", `settle_match failed · ${msg}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [programL1, wallet, l1Connection]
  );

  const openLobby = useCallback(
    // `_hostCommit` is kept for call-site compatibility; the bound commit is
    // derived from the (explicit / stashed / fresh) secret — see boundCommitFor.
    async (matchId: BN, _hostCommit?: Uint8Array, hostSecret?: Uint8Array) => {
      if (!programL1 || !wallet.publicKey) {
        emitToast("error", "Wallet not connected");
        return null;
      }
      setBusy(true);
      try {
        const hostCommit = boundCommitFor(matchId, wallet.publicKey, hostSecret);
        const sig = await programL1.methods
          .openLobby(matchId, Array.from(hostCommit))
          .accounts({
            lobby: lobbyPda(matchId),
            hostProfile: profilePda(wallet.publicKey),
            host: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          } as never)
          .rpc({ commitment: "confirmed" });
        emitToast("success", `Lobby opened · ${sig.slice(0, 6)}…`);
        return sig;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emitToast("error", `open_lobby failed · ${msg}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [programL1, wallet.publicKey]
  );

  const joinLobby = useCallback(
    async (matchId: BN, _guestCommit?: Uint8Array, guestSecret?: Uint8Array) => {
      if (!programL1 || !wallet.publicKey) {
        emitToast("error", "Wallet not connected");
        return null;
      }
      setBusy(true);
      try {
        const guestCommit = boundCommitFor(matchId, wallet.publicKey, guestSecret);
        const sig = await programL1.methods
          .joinLobby(Array.from(guestCommit))
          .accounts({
            lobby: lobbyPda(matchId),
            guestProfile: profilePda(wallet.publicKey),
            guest: wallet.publicKey,
          } as never)
          .rpc({ commitment: "confirmed" });
        emitToast("success", `Joined lobby · ${sig.slice(0, 6)}…`);
        return sig;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emitToast("error", `join_lobby failed · ${msg}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [programL1, wallet.publicKey]
  );

  const revealSecret = useCallback(
    async (matchId: BN, secret?: Uint8Array) => {
      if (!programL1 || !wallet.publicKey) {
        emitToast("error", "Wallet not connected");
        return null;
      }
      setBusy(true);
      try {
        const s = secret ?? recallSecret(matchId.toString());
        if (!s) {
          throw new Error("No secret found for match to reveal");
        }
        const sig = await programL1.methods
          .revealSecret(Array.from(s))
          .accounts({
            lobby: lobbyPda(matchId),
            player: wallet.publicKey,
          } as never)
          .rpc({ commitment: "confirmed" });
        emitToast("success", `Secret revealed · ${sig.slice(0, 6)}…`);
        return sig;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emitToast("error", `reveal_secret failed · ${msg}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [programL1, wallet.publicKey]
  );

  const fetchLobby = useCallback(
    async (matchId: BN) => {
      if (!programL1) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (programL1.account as any).lobbyState.fetch(lobbyPda(matchId));
      } catch {
        return null;
      }
    },
    [programL1]
  );

  const closeLobby = useCallback(
    async (matchId: BN) => {
      if (!programL1 || !wallet.publicKey) return null;
      setBusy(true);
      try {
        let guestProfile: PublicKey | null = null;
        try {
          const l: any = await (programL1.account as any).lobbyState.fetch(lobbyPda(matchId));
          if (l?.guest) {
            guestProfile = profilePda(l.guest as PublicKey);
          }
        } catch {
          // lobby state might already be closed or unreadable
        }

        const sig = await programL1.methods
          .closeLobby()
          .accounts({
            lobby: lobbyPda(matchId),
            hostProfile: profilePda(wallet.publicKey),
            guestProfile,
            host: wallet.publicKey,
          } as never)
          .rpc({ commitment: "confirmed" });
        emitToast("info", `Lobby closed · ${sig.slice(0, 6)}…`);
        return sig;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emitToast("error", `close_lobby failed · ${msg}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [programL1, wallet.publicKey]
  );

  const claimTimeout = useCallback(
    async (matchId: BN) => {
      if (!programL1 || !wallet.publicKey) {
        emitToast("error", "Wallet not connected");
        return null;
      }
      setBusy(true);
      try {
        const rollup = await matchIsDelegated(matchId);
        const turnProgram = rollup ? programER : programL1;
        if (!turnProgram) {
          emitToast("error", "Wallet not connected");
          return null;
        }
        const sig = await turnProgram.methods
          .claimTimeout()
          .accounts({
            matchState: matchPda(matchId),
            claimant: wallet.publicKey,
          } as never)
          .rpc({ commitment: "confirmed" });
        emitToast("success", `Timeout claimed · ${sig.slice(0, 6)}…`);
        return sig;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emitToast("error", `claim_timeout failed · ${msg}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [programL1, programER, wallet.publicKey, matchIsDelegated]
  );

  const subscribeMatch = useCallback(
    (_matchId: BN, _onChange: (state: unknown) => void) => {
      // PLAN_B: Helius free tier blocks WebSocket. The HTTP poll inside
      // ActiveDuel covers state updates without console-spamming the user
      // with `Connection._wsOnError` events. Subscribe is now a no-op.
      return () => { };
    },
    []
  );

  const fetchMatch = useCallback(
    async (matchId: BN) => {
      if (!programL1) return null;
      const pda = matchPda(matchId);
      try {
        const info = await l1Connection.getAccountInfo(pda);
        if (info && info.owner.equals(ROLET_PROGRAM_ID)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return await (programL1.account as any).matchState.fetch(pda);
        }
      } catch {
        // A delegated account is not readable as MatchState on devnet.
      }
      if (!programER) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (programER.account as any).matchState.fetch(pda);
      } catch {
        return null;
      }
    },
    [programL1, programER, l1Connection]
  );

  const fetchMatchHistory = useCallback(async (limit = 10) => {
    if (!programL1 || !wallet.publicKey) return [];
    const me = wallet.publicKey;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accountClient = (programL1.account as any).matchState;
    const [asPlayerOne, asPlayerTwo] = await Promise.all([
      accountClient.all([{ memcmp: { offset: 16, bytes: me.toBase58() } }]),
      accountClient.all([{ memcmp: { offset: 48, bytes: me.toBase58() } }]),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const all = [...asPlayerOne, ...asPlayerTwo] as any[];
    const seen = new Set<string>();
    const unique = all.filter((m) => {
      const k = m.publicKey.toBase58();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    unique.sort((a, b) => (b.account.matchId as BN).cmp(a.account.matchId as BN));
    return unique.slice(0, limit);
  }, [programL1, wallet.publicKey]);

  // Memoize the return object — call sites use `rolet` as an effect
  // dependency, and a fresh object every render causes infinite effect loops.
  return useMemo(
    () => ({
      program,
      connection,
      isEphemeral: ephemeral,
      sessionKey: sessionKey?.keypair.publicKey ?? null,
      busy,
      startSession,
      pda: { match: matchPda, profile: profilePda, vault: vaultPda, lobby: lobbyPda },
      initMatch,
      delegateMatch,
      commitAndUndelegateMatch,
      settleMatch,
      playCard,
      pullTrigger,
      setCharacterNft,
      purchaseCharacter,
      fetchProfile,
      fetchVault,
      fetchMatch,
      fetchMatchHistory,
      subscribeMatch,
      generateCommitReveal,
      openLobby,
      joinLobby,
      revealSecret,
      claimTimeout,
      findOpenLobby,
      fetchLobby,
      closeLobby,
      stashSecret,
      recallSecret,
    }),
    [
      program,
      connection,
      ephemeral,
      sessionKey,
      busy,
      startSession,
      initMatch,
      delegateMatch,
      commitAndUndelegateMatch,
      settleMatch,
      playCard,
      pullTrigger,
      setCharacterNft,
      purchaseCharacter,
      fetchProfile,
      fetchVault,
      fetchMatch,
      fetchMatchHistory,
      subscribeMatch,
      generateCommitReveal,
      openLobby,
      joinLobby,
      revealSecret,
      claimTimeout,
      findOpenLobby,
      fetchLobby,
      closeLobby,
    ]
  );
}
