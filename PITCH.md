# ROLET — Hackathon Pitch

## Problem

On-chain games are either:
- **Fake** — "blockchain game" with a centralized server running the actual logic
- **Slow** — real on-chain games require a wallet popup for every action, killing UX
- **Unfair** — single-player RNG is manipulable by whoever controls the seed

## Solution

ROLET is a **Fully On-Chain Game (FOCG)** that solves all three:

| Problem | ROLET's answer |
|---------|---------------|
| Centralized logic | Every chamber, card, and payout is a Solana instruction. A queue only introduces the two wallets. |
| Wallet popup fatigue | Session keys: one approval, then gasless turns. |
| Manipulable RNG | Commit-reveal: both players commit a secret before the match seeds. |

## How it works (technical)

**1. Lobby PDA rendezvous**  
Host calls `open_lobby` → on-chain PDA created (`seeds: ["lobby", match_id]`).  
Guest calls `join_lobby` → submits secret commitment on-chain.  
Both players call `reveal_secret` → program verifies preimages against commitments.  
Host calls `init_match` → verified secrets combined with slot hashes → RNG seed locked.

**2. Commit-reveal fairness**  
`rng_seed = keccak(host_secret ‖ guest_secret ‖ slot_hash ‖ match_id)`  
The slot hash is taken from a future slot pinned when the second reveal lands (`SEED_DELAY_SLOTS = 2`), so neither player can grind it. Each commit is `keccak(secret ‖ player ‖ match_id)`: copying a commit onto the other seat or another lobby does not verify.

**3. Session keys**  
`register_session_key` stores an ephemeral pubkey on the `PlayerProfile` PDA with an expiry.  
Turns are signed by the session keypair locally — no wallet popups mid-game.

**4. GameVault treasury**  
SOL lives in a treasury PDA. `settle_match` pays the winner a fixed `reward_sol`. A character purchase sends 5% to ops and 95% to that treasury (90% winner pool + 5% insurance reserve, both held there).

## What's built

- Full Anchor program (Rust): `init_match`, `pull_trigger`, `play_card`, `settle_match`, `claim_timeout`, `register_session_key`, `init_player_profile`, `init_vault`, `open_lobby`, `join_lobby`, `reveal_secret`, `close_lobby`
- 12 tactical cards with on-chain effects
- Real 2-player matchmaking (Lobby PDA)
- Session keys (gasless turns)
- Character NFT purchase (Metaplex Core) with durability burn on match entry
- SOL reward payouts from an on-chain treasury PDA
- Paper-card workshop aesthetic frontend
- Live on Solana Devnet

## Demo

[`rolet-web-server.vercel.app`](https://rolet-web-server.vercel.app) · [`github.com/SmtDcs/rolet`](https://github.com/SmtDcs/rolet)

## Roadmap

| Feature | Status |
|---------|--------|
| Character NFT (Metaplex Core) + durability | Done |
| MagicBlock ER delegation | Planned — blocked on SDK dependency conflict; game runs on L1 with session keys |
| Leaderboard / ELO | Planned |
| Match replay (deterministic RNG) | Planned |

## Why Solana?

- Fast enough for turn-based games on L1 (~400ms)
- Session keys via account model (no EIP-like proposal needed)
- Anchor makes PDA-heavy programs ergonomic
- Helius RPC for reliable devnet access
- MagicBlock ER path exists for future sub-second finality (Planned)

---

*ROLET — pull the trigger, trust the chain.*
