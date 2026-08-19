# ROLET Checkpoint v0.2 — Economy Core

**Date:** 2026-08-20
**Status:** Full economy loop verified end-to-end on devnet (SOL payouts, character NFT durability, treasury split)

---

## What works (verified on chain)

1. **Character purchase** — Metaplex Core V1 mint + `purchase_character` in one tx; program validates the asset (owner + update_authority == program), charges the configured price, and splits it **70% treasury / 30% ops** via system-program CPI
2. **Durability burn on lobby entry** — `open_lobby` / `join_lobby` decrement exactly 1; `settle_match` does NOT (double-charge fixed)
3. **NoDurability gate** — at 0 durability lobby open fails with `NoDurability` (code 6031); verified by exhausting all 9 remaining durability and hitting the wall on attempt #10
4. **SOL payouts** — `settle_match` pays the winner from the treasury PDA (seeds-signed transfer); winner balance increased by exactly +0.02 SOL
5. **Re-purchase flow** — after exhaustion, a new character purchase resets durability to 10 and the player can play again (verified: full second match after reset)
6. **Stats accumulation** — wins / losses / matches_played / total_rewards_claimed persist across matches (A: 1W-1L, B: 1W-1L, both 0.02 SOL claimed)
7. **Vault params live-update** — `update_vault_params` lets the vault authority change character price / reward without redeploy (devnet currently 0.1 SOL price, 0.02 SOL reward)
8. **Anti-refill** — re-equipping the same NFT does NOT refill durability; re-purchasing the same NFT is rejected (`CharacterNftInUse`)

## Devnet on-chain state (as of checkpoint)

| Resource            | Value                                              |
|---------------------|----------------------------------------------------|
| Program ID          | `Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792`      |
| Vault PDA           | `8tJ7bo9b92GFbFAHKTjYk8q6uHRya4cGwuBSAuBHg33z`      |
| Treasury SOL PDA    | `4xck81pxoELvZsCm94JshR7X6QtKthZhRjfyo88ua3e9`      |
| Ops wallet          | `CeoeQQj6233aJ1SMKzrdVrVeLZVJ8C5zwXT7JNdfj8f4`      |
| Character price     | 0.1 SOL (test value; production target 1 SOL)      |
| Reward per match    | 0.02 SOL (test value; production target 0.12 SOL)  |
| Treasury balance    | ~0.85 SOL (growing from purchases)                 |
| Matches settled     | 2                                                  |

> The old `2ePEU…` program (checkpoint v0.1) is abandoned: its upgrade authority keypair is lost and its state layout predates the economy core. The devnet program now lives at `Gwh17…`.

## E2E test script

`apps/server/scripts/devnet-e2e.ts` runs the whole loop: two wallets → two character purchases → lobby → match → pull loop → settle → balance report. Run with:

```fish
cd apps/server
env RPC_URL=https://api.devnet.solana.com \
    ANCHOR_WALLET=~/.config/solana/id.json \
    PLAYER_B_KEY=~/.config/solana/player-b.json \
    npx tsx scripts/devnet-e2e.ts
```

Both wallets need ~1 SOL (fees + 0.1 purchase each).

## Known MVP limitations (unchanged from the code review)

- **Self-attested NFT authority** — the program trusts the Core asset's `update_authority` field written by the minter; a program-signed mint (CPI) or program-owned collection check is the production fix (documented in README Known Limitations)
- **Commit-reveal griefing** — `join_lobby` submits `guest_secret` in plain text; a 3-step commit → init → reveal flow is the post-hackathon fix
- **Ops-share observation artifact** — in the E2E script the ops wallet IS player A's wallet, so the "ops delta" prints as negative (the purchase price includes what player A receives back). In production the ops wallet is separate.

---

## Critical state NOT in git

These files are gitignored but contain values you'd want if rebuilding from scratch:

### `apps/web/.env.local`
```
NEXT_PUBLIC_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=<REDACTED>
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_ROLET_PROGRAM_ID=Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792
NEXT_PUBLIC_MAGICBLOCK_ER_ENDPOINT=https://devnet.magicblock.app
```

### `apps/server/target/deploy/rolet-keypair.json`
The program-ID keypair for `Gwh17…`. **DO NOT LOSE** — losing it means the program becomes unupgradeable. If lost, deploy with a new keypair (new program ID), update IDL `address` field, update `.env.local`, and re-bootstrap vault.
