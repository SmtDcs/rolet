# MagicBlock on Anchor 1

Rollback is `feature/duel-2d` at `cf4f43d`. Do not upgrade program
`Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792`. This branch deploys a second
devnet program only after `anchor build` succeeds.

## Pins

MagicBlock's Anchor guide, not the 0.32 guess:

- Anchor 1.0.2
- Solana CLI 3.1.9
- Rust 1.89 or newer (1.96 is already installed)
- `ephemeral-rollups-sdk` 0.17.3, feature `anchor` only. Do not enable `anchor-compat`.
- Router: `https://devnet-router.magicblock.app`
- Devnet validator: EU `MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e` (`devnet-eu.magicblock.app`)

## What changes

- Match account only. After `init_match`, one delegate transaction locks `MatchState` on the rollup. `play_card` and `pull_trigger` go through the router. Commit and undelegate run when the match ends, then `settle_match` stays on devnet.
- Lobby instructions stay on devnet: open, join, reveal, init, close. Those wallet prompts remain.
- The session key still signs turns. The rollup does not remove that signature. It removes the devnet confirmation wait.
- Character check is one byte (`AssetV1` = 1). Drop the `mpl-core` crate from the program so Anchor 1's borsh 1.x does not fight `mpl-core` 0.10. The web client keeps minting with mpl-core.

## Order

1. Install Anchor 1.0.2 and Solana 3.1.9 beside the current 0.30.1 and 1.18.17. Leave 0.30.1 selected until this branch builds.
2. Point this branch's toolchain and Cargo.toml at the pins above.
3. Fix Anchor 1 compile errors. Add delegate, commit, and undelegate for `MatchState` only.
4. `anchor build`. No deploy if the build fails.
5. New program keypair, deploy to devnet, write the id into this branch's env only.
6. Web client on this branch: router for turns, delegate after init, commit before settle.
7. One two-wallet match on the new id. If it fails, checkout `feature/duel-2d`.

## Cutover (2026-10-11)

The demo now runs on the MagicBlock program.

- `apps/web/.env.local`: `NEXT_PUBLIC_ROLET_PROGRAM_ID=mspQcUFhmAGYUsnBbcUndhaZiris53KtwYCjDHU91oH`, `NEXT_PUBLIC_MAGICBLOCK_ER_ENDPOINT=https://devnet-eu.magicblock.app`. The file is gitignored.
- The server is `pnpm build && pnpm exec next start --port 3001` on this branch. Tunnel `https://cuts-resort-compute-naturally.trycloudflare.com`.
- Vault: reward 0.02 SOL, character price 0.1 SOL, ops wallet `CeoeQQj6233aJ1SMKzrdVrVeLZVJ8C5zwXT7JNdfj8f4`, treasury `FykUPLero34cmYj5CFG2gZ1URHC9DCNLR5rYTaVxGprG` funded with 0.33 SOL.
- Two profiles exist on the new program: `CeoeQQj6233aJ1SMKzrdVrVeLZVJ8C5zwXT7JNdfj8f4` and `GoeHXdTuSeJVeX9AREqtyMJ7SYuABbdGnsCbSRSs1XMv`. Any other wallet needs a character first; `/duel` sends it to `/profile`, which mints and charges the vault price.
- Rollback: `git checkout feature/duel-2d`, set `NEXT_PUBLIC_ROLET_PROGRAM_ID=Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792`, and restart the server.

## Resume point (2026-10-11)

Branch `experiment/magicblock-anchor1`. Commits: `5faa78a` (plan), `aae989d` (program + web).

Done:

- Anchor CLI 1.0.2 is installed. `avm` still selects 0.30.1. Binary: `~/.avm/bin/anchor-1.0.2`.
- Solana 3.1.9 is at `~/.local/share/solana/install/releases/3.1.9`. Active `solana` stays 1.18.17.
- `cargo check -p rolet` passed. Cargo resolved `anchor-lang` 1.2.1 from the 1.0.2 requirement. SDK 0.17.3 with feature `anchor` compiled.
- `mpl-core` is removed from the program. `CORE_ASSET_V1` is 1. Keccak uses `solana_keccak_hasher`. SlotHashes id is `solana_sysvar::slot_hashes::ID`. `CpiContext` takes `system_program.key()`.
- `delegate_match` and `commit_and_undelegate_match` are in `lib.rs`. `#[ephemeral]` is on the program module. Match account only. EU validator is pinned. Lobby instructions stay on devnet.
- `anchor build` succeeded and the program is deployed: `mspQcUFhmAGYUsnBbcUndhaZiris53KtwYCjDHU91oH`, ProgramData `Dwn4SBwhsawarL8gnDDN8oEEzpSGdPdJFt5hoi2Kw18e`, authority `CeoeQQj6233aJ1SMKzrdVrVeLZVJ8C5zwXT7JNdfj8f4`.
- A full two-wallet match ran end to end on the new program: open, join, reveal x2, init, delegate on devnet; 11 pull_trigger turns on `https://devnet-eu.magicblock.app`; commit_and_undelegate on the rollup; settle on devnet. Match `1791714224465`, winner `GoeHXdTuSeJVeX9AREqtyMJ7SYuABbdGnsCbSRSs1XMv`.
- The rollup serves non-delegated accounts. `PlayerProfile` was read on the rollup with owner `mspQc...` even though only `MatchState` is delegated. The Magic Router does not answer `getAccountInfo` for that profile, so turns go to the EU validator endpoint directly. `ER_ENDPOINT` in `useRolet.ts` takes `NEXT_PUBLIC_MAGICBLOCK_ER_ENDPOINT`, default `https://devnet-eu.magicblock.app`.
- 34 unit tests passed. `tsc --noEmit` passed.
- Platform-tools v1.52 are extracted under `~/.cache/solana/v1.52/platform-tools`.
- `declare_id` on this branch is `mspQcUFhmAGYUsnBbcUndhaZiris53KtwYCjDHU91oH`. The keypair is `apps/server/target/deploy/rolet-er-keypair.json`, and that same key is currently `target/deploy/rolet-keypair.json` so Anchor deploys the new id.
- The live program keypair was copied to `apps/server/target/deploy/rolet-keypair.live-backup.json` before that swap. Both files are under `target/` and must not be committed. Do not deploy the backup. Do not upgrade `Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792`.
- Live demo now runs from this branch on port 3001, tunnel `https://cuts-resort-compute-naturally.trycloudflare.com`. `feature/duel-2d` keeps the pre-MagicBlock code and is the rollback path.

Known issues:

- `claim_timeout` compares `last_action_slot` with the ER clock, whose slots are not the base-layer slots. Timeout claims need a separate look.
- The delegate transaction costs the player a deposit (about 0.0029 SOL of rent for the match account plus the delegation accounts).
- A wallet without a character on the new program is sent to `/profile`, which mints one and charges the vault price (0.1 SOL).

## Out of scope

- Merging to `main`
- Redeploying the current demo program
- Vercel
- Rewriting the landing
