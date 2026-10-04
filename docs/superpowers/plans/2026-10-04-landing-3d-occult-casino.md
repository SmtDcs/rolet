# ROLET — Occult Casino Landing & 3D Diegetic Game Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform ROLET into a flagship Axie Infinity-style Web3 gaming portal with an Occult Casino landing page at `/` and a fully diegetic 3D FPS duel arena at `/play`, featuring Meshy AI-generated assets, 90/5/5 economics, and Dialect Solana Blinks.

**Architecture:** Next.js 16 App Router separates marketing/landing (`/`) from the full-screen dApp portal (`/play`). Three.js / React Three Fiber powers the interactive 3D hero canvas on the landing page and the zero-2D-HUD diegetic duel arena in `/play`. Solana Anchor smart contract (`Gwh17...`) handles commit-reveal RNG, Metaplex Core NFTs, session keys, and 90/5/5 vault distribution.

**Tech Stack:** Next.js 16 (React 19), Tailwind CSS v4, Three.js / React Three Fiber / Drei, Anchor 0.30.1 / Rust, Metaplex Core, Bonfida SNS, Dialect Actions/Blinks, Meshy AI (MCP).

## Global Constraints
- Primary Palette: `#0B0907` (Deep Obsidian), `#1E1611` (Dark Mahogany), `#152B1E` (Casino Baize Felt), `#C6A15B` (Antique Brass/Gold), `#8C2727` (Dried Blood/Crimson), `#E6D7C3` (Aged Parchment).
- Fonts: `Cinzel` for headings/seals, `Space Mono` for monospace stats/readouts.
- Economic Split: 90% Treasury SOL / 5% Ops Wallet / 5% Insurance Fund PDA.
- Game HUD: Zero floating 2D HUD during 3D duels; all status (HP, bullets, turn) lives diegetically on the table (candles, ammo tray, sliding coin).
- Solana Network: Devnet (`Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792`).

---

### Task 1: Occult Casino Design System & Theme Foundations

**Files:**
- Modify: `apps/web/app/layout.tsx` (Add Google Fonts `Cinzel` and `Space Mono`)
- Modify: `apps/web/app/globals.css` (Define Occult Casino CSS variables, candle flicker keyframes, gold glow utilities)
- Create: `apps/web/components/ui/GildedButton.tsx` (Gold foil border, brass sheen, hover sound)
- Create: `apps/web/components/ui/ParchmentSeal.tsx` (Vintage wax seal badge for stats and logos)
- Create: `apps/web/components/ui/AmbientAudio.tsx` (Toggleable vinyl crackle/candle ambient audio)

**Interfaces:**
- Produces: `<GildedButton variant="gold" | "crimson" onClick={...}>`, `<ParchmentSeal text="..." />`, `<AmbientAudio />`

- [ ] **Step 1: Configure Google Fonts in `layout.tsx`**
  Add `Cinzel` and `Space_Mono` from `next/font/google` and attach them to CSS variables `--font-cinzel` and `--font-mono`.
- [ ] **Step 2: Add theme tokens and custom utilities in `globals.css`**
  Define color tokens (`--color-obsidian: #0b0907`, `--color-mahogany: #1e1611`, `--color-felt: #152b1e`, `--color-brass: #c6a15b`, `--color-crimson: #8c2727`, `--color-parchment: #e6d7c3`). Add `@keyframes candle-flicker` and text glow utilities.
- [ ] **Step 3: Implement `GildedButton.tsx` and `ParchmentSeal.tsx`**
  Build reusable antique-styled buttons with brass border styling, hover sound integration via `useSound`, and wax seal badges.
- [ ] **Step 4: Implement `AmbientAudio.tsx`**
  Add a discrete toggle button in the bottom right corner of the layout that plays atmospheric background audio.
- [ ] **Step 5: Verify build & commit**
  Run `pnpm --filter web build` to ensure font loaders and CSS tokens compile cleanly. Commit with message `feat(ui): add occult casino theme tokens, typography and gilded button components`.

---

### Task 2: Axie Infinity-Style Landing Page Sections (`/`)

**Files:**
- Modify: `apps/web/app/page.tsx` (Assemble the 7 landing sections)
- Create: `apps/web/components/landing/LandingNavbar.tsx` (Logo, section anchors, devnet pill, Launch App CTA)
- Create: `apps/web/components/landing/HeroSection.tsx` (Headline, live on-chain stats ticker, Launch App + Rules buttons)
- Create: `apps/web/components/landing/Hero3DCanvas.tsx` (Interactive rotating 3D revolver & floating tarot cards preview)
- Create: `apps/web/components/landing/RulesSection.tsx` (3-step visual storyboard: Mint, Spin & Fire, Claim Vault)
- Create: `apps/web/components/landing/GrimoireSection.tsx` (Interactive 12 tarot cards gallery with 3D tilt and tooltips)
- Create: `apps/web/components/landing/EconomySection.tsx` (90% Treasury / 5% Ops / 5% Insurance Fund visual diagram & Provably Fair commit-reveal explanation)
- Create: `apps/web/components/landing/HallOfFameSection.tsx` (Leaderboard spotlight with Bonfida `.sol` domains)
- Create: `apps/web/components/landing/LandingFooter.tsx` (Socials, Solana ecosystem badge, MIT license)

**Interfaces:**
- Consumes: `useRolet` (for live treasury balance & matches settled)
- Produces: Complete flagship landing page at `/`

- [ ] **Step 1: Build `LandingNavbar.tsx`**
  Logo with antique revolver seal, nav links (`#rules`, `#grimoire`, `#economy`, `#leaderboard`, docs link), live Devnet badge, and glowing **[LAUNCH APP]** button linking to `/play`.
- [ ] **Step 2: Build `HeroSection.tsx` & `Hero3DCanvas.tsx`**
  Display bold title *"SEKİZ HAZNE. ON İKİ KART. KAZANAN TÜM KASAYI ALIR."*, integrate lightweight Three.js canvas with mouse parallax, and render the live On-Chain Ticker reading from `GameVault` PDA (`reward_sol`, `total_paid_out`, `matches_settled`).
- [ ] **Step 3: Build `RulesSection.tsx`**
  3-step onboarding cards with brass borders: 1. Masaya Otur (Metaplex Core NFT), 2. Tetiği Çek (5 Canlı, 3 Kuru, Session Keys), 3. Kasayı Kazan (Anında SOL transferi).
- [ ] **Step 4: Build `GrimoireSection.tsx`**
  12 tactical tarot cards with category filters and hover tilt. Each card reveals its occult card art, on-chain mechanics, and tactical tips.
- [ ] **Step 5: Build `EconomySection.tsx` & `HallOfFameSection.tsx`**
  Visual 90/5/5 distribution pie/flowchart, commit-reveal cryptographic guarantee, and top winning `.sol` duelists.
- [ ] **Step 6: Assemble in `apps/web/app/page.tsx` and verify**
  Test in browser, verify responsive layout on mobile/desktop, ensure "Launch App" navigates to `/play`. Commit with message `feat(web): build Axie-style occult casino landing page`.

---

### Task 3: Game Portal Layout & Lobi Overlay (`/play`)

**Files:**
- Create: `apps/web/app/play/page.tsx` (Dedicated 100vh dApp entry)
- Create: `apps/web/components/play/PlayNavbar.tsx` (Compact in-game bar: wallet, durability, session key status)
- Create: `apps/web/components/play/LobbyOverlay.tsx` (Find lobby, create lobby, fair-ready QR code modal)
- Create: `apps/web/components/play/CharacterDurabilityCard.tsx` (10/10 Durability tracker & 90/5/5 re-purchase trigger)

**Interfaces:**
- Consumes: `useRolet` (`openLobby`, `joinLobby`, `profile`, `durabilityRemaining`, `sessionKey`)
- Produces: State machine managing `LOBBY_SELECTION` -> `IN_MATCH` -> `SETTLEMENT`

- [ ] **Step 1: Create `/play` page with 100vh layout**
  Full-viewport game container that suppresses global page scroll and sets up the stage for the 3D table.
- [ ] **Step 2: Build `PlayNavbar.tsx`**
  Minimal top HUD: Back to Landing button, WalletConnect button, Character durability badge (`10/10`), Session Key active indicator.
- [ ] **Step 3: Build `LobbyOverlay.tsx` with QR Code Generator**
  Options to "Masa Bul" (scan open lobbies) and "Masa Aç" (open new lobby). When a lobby is opened, render a high-contrast QR code (`https://<domain>/play?lobby=<id>`) so fair/booth visitors can instantly scan and connect.
- [ ] **Step 4: Build `CharacterDurabilityCard.tsx`**
  Displays current equipped Core NFT and durability bar. When at 0, provides one-click `purchase_character` transaction with 90/5/5 split explanation.
- [ ] **Step 5: Verify build & commit**
  Verify page routing, lobby opening and QR generation. Commit with message `feat(play): add dedicated game portal layout with QR matchmaking`.

---

### Task 4: Meshy AI 3D Asset Generation Pipeline (via MCP)

**Files:**
- Target Directory: `apps/web/public/models/`
- Output Files:
  - `revolver_occult.glb` (8-chamber brass & dark gunmetal engraved revolver)
  - `casino_table.glb` (Dark mahogany gambling table with circular green baize felt)
  - `bullet_cartridges.glb` (Brass live round & blank spent casing)
  - `candelabra_props.glb` (Antique brass candelabra with wax drips)
  - `opponent_gambler.glb` (Victorian masked gambler in formal coat)

**Interfaces:**
- Consumes: MCP tool `call_mcp_tool` with `ServerName: "meshy"`, `ToolName: "meshy_text_to_3d"` and `meshy_download_model`.
- Produces: Optimized GLB model files loaded by Three.js `useGLTF`.

- [ ] **Step 1: Check Meshy balance & status**
  Call `meshy_check_balance` to verify credits.
- [ ] **Step 2: Generate Revolver model (`revolver_occult`)**
  Prompt: *"Antique heavy 8-chamber Western occult revolver, dark gunmetal cylinder, intricate polished brass engravings, PBR, game ready"*. Download GLB to `public/models/revolver_occult.glb`.
- [ ] **Step 3: Generate Table model (`casino_table`)**
  Prompt: *"Antique dark mahogany circular gambling table with worn green velvet baize top, brass corner inlays, Victorian style, game asset"*. Download GLB to `public/models/casino_table.glb`.
- [ ] **Step 4: Generate Candelabra & Props (`candelabra_props`)**
  Prompt: *"Ornate antique brass candelabra with melting wax candles, vintage poker chip stack"*. Download GLB to `public/models/candelabra_props.glb`.
- [ ] **Step 5: Generate Opponent Character (`opponent_gambler`)**
  Prompt: *"Dark Victorian high-stakes gambler wearing formal frock coat, seated pose, sinister porcelain mask, occult undertones"*. Download GLB to `public/models/opponent_gambler.glb`.
- [ ] **Step 6: Optimize GLB meshes with gltf-transform or Draco compression**
  Ensure each model is under 5MB for rapid WebGL streaming. Commit with message `feat(assets): generate and bundle occult 3D models via Meshy AI`.

---

### Task 5: Diegetic 3D FPS Game Arena (`/play`)

**Files:**
- Create: `apps/web/components/play/DuelArenaDiegetic3D.tsx` (R3F Scene container, lighting, camera controls)
- Create: `apps/web/components/play/DiegeticCandleHP.tsx` (4 candles per player; flame extinguishes on damage)
- Create: `apps/web/components/play/DiegeticAmmoTray.tsx` (Brass tray holding live & blank rounds)
- Create: `apps/web/components/play/DiegeticTurnCoin.tsx` (Brass coin sliding across table to active player)
- Create: `apps/web/components/play/DiegeticRevolver.tsx` (Interactive gun: aim at self or opponent, trigger pull)
- Create: `apps/web/components/play/DiegeticCardHand.tsx` (Physical 3D tarot cards lying on table edge)
- Create: `apps/web/components/play/NameplateSNS.tsx` (Engraved brass plate displaying verified `.sol` domain)

**Interfaces:**
- Consumes: `useRolet` match state (`matchState`, `currentTurn`, `playerOneHp`, `playerTwoHp`, `pullTrigger`, `playCard`)
- Produces: Zero-2D-HUD gameplay where all interactions occur on the 3D tabletop.

- [ ] **Step 1: Build `DuelArenaDiegetic3D.tsx` scene**
  Setup Three.js Canvas, FPS camera with subtle idle breathing motion, dark ambient lighting, and warm key light on the table center.
- [ ] **Step 2: Implement `DiegeticCandleHP.tsx`**
  Place 4 candles on player's tray and 4 on opponent's tray. Bind candle flame shader / point light to player HP; trigger puff-of-smoke animation when damage is taken.
- [ ] **Step 3: Implement `DiegeticAmmoTray.tsx` & `DiegeticTurnCoin.tsx`**
  Render brass tray showing unspent live/blank cartridges. Render coin that smoothly animates and slides across the baize felt to whoever's turn it is.
- [ ] **Step 4: Implement `DiegeticRevolver.tsx`**
  When player clicks the revolver on the table, it enters aiming state. Hovering towards player's side aims at player; hovering towards opponent aims across the table. Clicking fires the shot via `pullTrigger(targetSelf)`.
- [ ] **Step 5: Implement `DiegeticCardHand.tsx`**
  Render 4 3D tarot cards fanned on the table edge. Hovering lifts the card; clicking slides it into the center with an occult flare animation and calls `playCard(slot, card)`.
- [ ] **Step 6: Implement `NameplateSNS.tsx`**
  Engrave the player's Bonfida `.sol` name (or shortened pubkey) on a brass plate fixed to the table edge.
- [ ] **Step 7: Connect to live match state and verify end-to-end**
  Test in browser, verify animations, sound effects, and zero 2D HUD interference. Commit with message `feat(play): implement zero-2D-HUD diegetic 3D FPS duel arena`.

---

### Task 6: Smart Contract & Web3 Upgrades (90/5/5, Refund, Blinks)

**Files:**
- Modify: `apps/server/programs/rolet/src/lib.rs` (90/5/5 split, `close_lobby` durability refund, `join_lobby` commit privacy)
- Modify: `apps/server/tests/economy-core.ts` (Update tests for 90/5/5 and durability refund)
- Create: `apps/web/app/api/actions/duel/route.ts` (Dialect Solana Blink API endpoint for 1-click Twitter duels)

**Interfaces:**
- Produces: Updated Anchor program & Dialect Actions JSON specification

- [ ] **Step 1: Write test for durability refund on `close_lobby`**
  In `economy-core.ts`, assert that closing a lobby refunds 1 durability to the host profile.
- [ ] **Step 2: Update `lib.rs` for 90/5/5 revenue split & durability refund**
  - In `purchase_character`: split payment as 90% treasury, 5% ops wallet, 5% insurance fund PDA.
  - In `close_lobby`: add `host_profile.durability_remaining = host_profile.durability_remaining.saturating_add(1)`.
- [ ] **Step 3: Update `join_lobby` commit-reveal privacy**
  Ensure `guest_secret` is not revealed during `join_lobby` (host cannot precompute seed to grief).
- [ ] **Step 4: Implement Dialect Solana Action at `/api/actions/duel`**
  Return standard Solana Actions headers and JSON metadata allowing users on Twitter/X to join or view a ROLET duel directly in their feed.
- [ ] **Step 5: Run tests and compile Anchor program**
  Run `anchor build` and `pnpm --filter server test`. Commit with message `feat(solana): implement 90/5/5 split, lobby durability refund, and Dialect Blink action`.

---

### Task 7: Full System Integration, Build & Polish

**Files:**
- Modify: `README.md` (Update architecture, screenshots, 90/5/5 economics, live links)
- Modify: `apps/web/app/dev/arena/page.tsx` (Dev playground for testing 3D assets in isolation)

- [ ] **Step 1: Complete end-to-end duel test**
  Run two browser windows on Devnet: Host creates lobby -> Guest joins via QR code -> Gasless turn loop via Session Keys -> Winner claims SOL from 90% treasury.
- [ ] **Step 2: Verify responsive design and asset loading performance**
  Confirm 60 FPS on desktop and clean fallback on mobile.
- [ ] **Step 3: Final documentation and checkpoint update**
  Update `README.md` and `CHECKPOINT-v0.1.md` with new features and architecture diagram. Commit with message `chore: polish documentation and complete occult casino 3D system integration`.
