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

## Resume point (2026-10-11)

Branch `experiment/magicblock-anchor1`, plan commit `5faa78a`. Working tree after that is uncommitted.

Done:

- Anchor CLI 1.0.2 is installed. `avm` still selects 0.30.1. Binary: `~/.avm/bin/anchor-1.0.2`.
- Solana 3.1.9 is at `~/.local/share/solana/install/releases/3.1.9`. Active `solana` stays 1.18.17.
- `cargo check -p rolet` passed. Cargo resolved `anchor-lang` 1.2.1 from the 1.0.2 requirement. SDK 0.17.3 with feature `anchor` compiled.
- `mpl-core` is removed from the program. `CORE_ASSET_V1` is 1. Keccak uses `solana_keccak_hasher`. SlotHashes id is `solana_sysvar::slot_hashes::ID`. `CpiContext` takes `system_program.key()`.
- `delegate_match` and `commit_and_undelegate_match` are in `lib.rs`. `#[ephemeral]` is on the program module. Match account only. EU validator is pinned. Lobby instructions stay on devnet.
- The web hook routes turns and the commit through `https://devnet-router.magicblock.app` only when the match account owner is the delegation program. `settle_match` stays on devnet. 34 unit tests passed. `tsc --noEmit` passed. The IDL in `apps/web/idl` does not yet contain the new instructions, so do not restart `next start` until a successful build copies a new IDL and a new program id.
- Platform-tools v1.52 are extracted under `~/.cache/solana/v1.52/platform-tools`. The SBF build of this branch was restarted after that.
- `declare_id` on this branch is `mspQcUFhmAGYUsnBbcUndhaZiris53KtwYCjDHU91oH`. The keypair is `apps/server/target/deploy/rolet-er-keypair.json`, and that same key is currently `target/deploy/rolet-keypair.json` so Anchor deploys the new id.
- The live program keypair was copied to `apps/server/target/deploy/rolet-keypair.live-backup.json` before that swap. Both files are under `target/` and must not be committed. Do not deploy the backup. Do not upgrade `Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792`.
- Live demo is still `next start` on port 3001 and tunnel `https://limit-printing-meal-florists.trycloudflare.com`.

## Out of scope

- Merging to `main`
- Redeploying the current demo program
- Vercel
- Rewriting the landing
