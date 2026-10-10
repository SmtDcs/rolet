# ROLET — MASTER PROJECT SPECIFICATION & SYSTEM PROMPT
> **Handoff Document for Autonomous AI Agents & Lead Engineers**  
> **Protocol Name:** ROLET  
> **Tagline:** Tactical Turn-Based Chamber Duel Protocol on Solana  
> **Target Track:** Colosseum Hackathon / Solana Foundation / Web3 Gaming Track  

---

## 1. SYSTEM ROLE & OBJECTIVE

You are an expert **Web3 Game Architect, Senior Solana Rust Engineer, and Creative Technologist**. Your objective is to design, develop, and deploy **ROLET**: a high-tension, fully on-chain (FOCG) turn-based tactical strategy duel protocol on Solana, inspired by the tension of turn-based chamber duels and the tactile aesthetics of *Inscryption*.

### Strict Brand & Narrative Directives (Non-Negotiable)
1. **Zero Regulated-Gaming Language:**
   - **STRICT PROHIBITION:** Regulated gaming-industry vocabulary is banned across all copy, metadata, and documentation. The canonical banned-terms list is maintained privately for compliance review.
   - **Mandatory Terminology:** Use **"Tactical Chamber Duel"**, **"Turn-Based Probability Strategy"**, **"Championship Prize Pool"**, and **"Duelist Arena"**. "Staked Match" may appear only in descriptive technical prose, never as a lobby or payment label.
   - **Rationale:** Compliance with Solana Foundation grants, Colosseum judging criteria, App Store guidelines, and global regulatory frameworks. This is an adversarial turn-based game of probability and card strategy.
2. **Language & Typography:**
   - All client-facing interfaces must be strictly in **English**.
   - **Zero Emojis:** Do not use any consumer emojis. Use crisp **Lucide icons**, custom inline **SVGs**, or diegetic brass/metal engravings.
   - Heading font: Antique Serif (`Cinzel` or `Playfair Display`). Data/code font: Monospace (`Space Mono` or `JetBrains Mono`).

---

## 2. CORE GAME MECHANICS & PROBABILITY ENGINE

### A. The Duel Arena Setup
- **Match Format:** 1v1 Synchronous Turn-Based Chamber Duel.
- **Health Pool (HP):** Both duelists start with **4 HP**. First player to reach 0 HP loses.
- **The Cylinder:** A shared 8-chamber occult revolver cylinder.
  - Standard Loadout: **5 Live Rounds** (full metal jacket, copper tip, deals damage) + **3 Blank Rounds** (crimped wax/paper, harmless).
  - The ratio of live to blank rounds is publicly visible via the tabletop ammo tray, but the exact order in the cylinder is hidden.

### B. Turn Actions & The "Shoot Self" Tactical Gambit
On their turn, the active duelist has two primary mechanical choices:
1. **Discharge at Rival (Shoot Opponent):**
   - If **Live**: Deals **1 HP damage** to the opponent (or 2 HP if buffed by `DoubleStrike`). Turn passes to the rival.
   - If **Blank**: No damage dealt. Turn passes to the rival.
2. **Discharge at Self (Shoot Self — Tactical Risk/Reward):**
   - If **Blank**: Player survives without damage AND **retains their turn for an immediate consecutive action**. This is the core tactical advantage mechanic.
   - If **Live**: Player takes **1 HP damage** to themselves and **turn passes immediately** to the rival.

### C. The 12 Tactical Tarot Relics (Relic Cards)
Each duelist starts the match with **4 cards** dealt from a 12-card tactical grimoire. Players may play cards before discharging the revolver.

| Relic Name | Classification | On-Chain Effect | Tactical Synergies |
|---|---|---|---|
| **HawkEye** | Intel | Scans the current chamber cartridge state (Reveals: Live or Blank). | Perfect combo before choosing to Shoot Self vs Shoot Rival. |
| **BulletExtractor** | Utility | Safely racks the slide, ejecting and discarding the current chamber round without firing. | Burns a lethal round when you are forced into bad odds. |
| **DoubleStrike** | Offense | Saws down the barrel; doubles the damage of the next live shot (**2 HP damage**). | Devastating when combined with `HawkEye` or confirmed Live round. |
| **Blocker** | Defense | Deploys an arcane ward; cancels out the next instance of incoming damage taken. | Survival shield against opponent's `DoubleStrike`. |
| **Healer** | Recovery | Restores **+1 HP** to the caster (capped at maximum starting HP of 4). | Sustains player during prolonged battle attrition. |
| **RestoreBullet** | Sabotage | Seeds an empty chamber with a live cartridge, shifting the chamber ratio. | Increases lethal odds when opponent has the gun. |
| **Shuffler** | Chaos | Thoroughly spins and randomizes the order of all remaining rounds in the cylinder. | Destroys the opponent's memory of count/odds. |
| **CardThief** | Espionage | Steals 1 random unplayed relic card from the rival's hand. | Starves the opponent of tactical defensive options. |
| **RandomInsight** | Intel | Reveals the polarity (Live/Blank) of a random remaining chamber position. | Builds probability trees for future turns. |
| **LastChance** | Climax | Can ONLY be played when caster is at **1 HP**. Skips the rival's next turn. | High-tension comeback turnaround card. |
| **HandOfFate** | Transmutation | Inverts the polarity of the current chamber cartridge (Live $\leftrightarrow$ Blank). | Turns an imminent self-death into a free extra turn. |
| **Silence** | Control | Shackles the rival; prevents them from activating any cards on their next turn. | Locks the rival into pure mechanical probability. |

---

## 3. DIEGETIC 3D TABLETOP ARCHITECTURE (ZERO 2D OVERLAYS)

### Visual Philosophy: "If It's in the Game, It's on the Table"
The game takes place inside a dimly lit, atmospheric underground chamber. The camera is locked in a **First-Person Perspective (FPS)** sitting at a round mahogany table inlaid with dark forest-green baize felt. A mysterious, masked rival sits across the table in deep shadow.

**Strict Rule:** No floating 2D HUDs, health bars, or generic web-game modals during live combat. All telemetry is diegetically represented in the physical 3D scene:

```
+-------------------------------------------------------------------------+
|                              [ RIVAL ]                                  |
|                 (Shadowy Masked Figure Across Table)                    |
|                                                                         |
|  [Brass Nameplate: opponent.sol]             [Rival HP: Nixie Tube]     |
|                                                                         |
|                     +-----------------------------+                     |
|                     |     BRASS AMMO TRAY         |                     |
|                     | (Remaining Live & Blank)    |                     |
|                     +-----------------------------+                     |
|                                                                         |
|                          [ 3D REVOLVER ]                                |
|                   (Heavy Occult 8-Chamber Weapon)                       |
|                                                                         |
|  [Brass Nameplate: player.sol]               [Player HP: Nixie Tube]    |
|                                                                         |
|                   +-------------------------------+                     |
|                   |   PHYSICAL TAROT HAND (4)     |                     |
|                   |  [Card 1] [Card 2] [Card 3]   |                     |
|                   +-------------------------------+                     |
|                                                                         |
|                              [ YOU ]                                    |
+-------------------------------------------------------------------------+
```

1. **Electro-Mechanical Life Counter Box (`life_counter_box.glb`):**
   - A heavy vintage tabletop unit with glowing amber/crimson Nixie tubes displaying `YOU: 4` and `RIVAL: 4`.
   - When damage is sustained, the Nixie filament flickers violently, sparks, and ticks down with a heavy mechanical click.
2. **Diegetic Ammo Tray (`DiegeticAmmoTray.tsx`):**
   - A divided brass and aged oak tray holding the remaining rounds:
     - **Live rounds:** Polished brass casings with copper jacket tips.
     - **Blank rounds:** Weathered brass casings with crimped wax/paper seals.
3. **The Weapon Interaction (`DiegeticRevolver.tsx`):**
   - A custom 4K PBR 8-chamber occult revolver model (`revolver_occult.glb`).
   - Hovering over the revolver gives physical affordances:
     - Pulling weapon toward camera rotates the barrel directly toward the player (**Discharge at Self**).
     - Pushing weapon forward points the barrel at the rival's chest (**Discharge at Rival**).
4. **Physical Tarot Hand (`DiegeticCardHand.tsx`):**
   - Cards lie flat on the wooden table rim. Hovering elevates a card smoothly in 3D space. Playing a card causes it to slide into the center of the table and burn to occult ash as the transaction confirms.
5. **SNS Engraved Brass Nameplates (`NameplateSNS.tsx`):**
   - Machined brass plates fastened with aged screws to the table rim, displaying resolved Bonfida `.sol` names (e.g., `alice.sol` vs `bob.sol`).

---

## 4. LANDING PAGE EXPERIENCE (`/`) — AXIE INFINITY BLUEPRINT

The landing page must follow the structure of premier Web3 games like **Axie Infinity**, adapted to a dark occult luxury aesthetic.

### Key Sections:
1. **Header / Navigation:**
   - Brand Seal: Occult 8-chamber brass cylinder logo.
   - Links: *Rules of Engagement*, *The Grimoire (Cards)*, *Protocol Economy*, *Hall of Fame*, *Docs*.
   - Devnet Status Indicator + Glowing Brass **[LAUNCH APP]** CTA button.
2. **Hero Section (Interactive 3D Scrollytelling):**
   - Headline: *"EIGHT CHAMBERS. TWELVE RELICS. ONE SURVIVOR."*
   - Subhead: *"Solana's premier fully on-chain tactical turn-based chamber duel protocol. Zero server. Provably fair entropy. Gasless session-key turns."*
   - **Central 3D Canvas:** Interactive 3D Occult Revolver. As the user scrolls, the revolver rotates, opens cylinder, chambers a live round, and snaps shut.
   - Live Telemetry Banner:
     - **Total Championship Pool:** `X SOL` (live read from `GameVault` PDA).
     - **Completed Duels:** Live counter.
     - **Turn Execution:** Gasless via session keys on Solana L1. MagicBlock ER delegation is planned, not active.
3. **"How to Duel" (3-Step Onboarding):**
   - *Step 1: Mint Duelist Character* (Metaplex Core NFT with 10 Durability).
   - *Step 2: Enter the Arena* (each entry burns 1 Durability on-chain — there is no SOL stake).
   - *Step 3: Outwit & Claim the Pool* (Zero wallet popups, winner claims the SOL reward from the GameVault).
4. **"The Grimoire" (Interactive 12-Card Catalog):**
   - Horizontal interactive deck displaying all 12 Tarot Relic cards.
   - 3D hover tilt (CSS 3D / Framer Motion), revealing card lore, rarity, and on-chain tactical effect.
5. **The 90/5/5 Sustainable Economy Model:**
   - Visual breakdown diagram demonstrating why ROLET is sustainable without inflationary tokens.
6. **Hall of Fame:**
   - Top `.sol` duelists ranked by net SOL won and victory streaks.

---

## 5. SOLANA SMART CONTRACT & WEB3 PROTOCOL ARCHITECTURE

### A. Anchor Program Specifications
- **Framework:** Anchor `0.30.1`, Solana CLI `1.18+`.
- **Target Network:** Solana Devnet / Mainnet-Beta.
- **State Machine PDAs:**
  - `LobbyState` (`["lobby", host_pubkey]`): Matchmaking parameters, entry requirements, host & guest status.
  - `MatchState` (`["match", lobby_pubkey]`): Round index, cylinder composition (bitmask/array of chambers), current turn pointer, player HP, card inventories, modifier flags.
  - `PlayerProfile` (`["profile", player_pubkey]`): Stats, win streaks, registered session key.
  - `GameVault` (`["vault"]`): Protocol custody PDA holding championship rewards.

### B. Session Keys (Zero Wallet Popup Gaming)
- **The Problem:** In standard dApps, signing a wallet transaction on every single turn destroys the psychological tension of a fast-paced duel.
- **The Solution:** Upon entering a match, the client generates a local ephemeral `Keypair`. The player executes a single approval transaction (`register_session_key`) delegating turn-signing authority for that specific match PDA.
- All subsequent `pull_trigger` and `play_card` transactions are signed instantly in the background by the session key.

### C. MagicBlock Ephemeral Rollups (Planned — Not Active)
- Target design only: at `init_match` the `MatchState` PDA would be delegated to a **MagicBlock Ephemeral Rollup (ER)** validator.
- The ER path is currently disabled (Rust SDK dependency conflict — see README Known Limitations). Matches run on Solana L1, and gasless turns already work via session keys.
- When the ER path ships, a finished match would commit back to L1 before `settle_match` releases funds from the `GameVault`.

### D. Dialect Solana Actions & Blinks (Viral Social Duels)
- Implements the Solana Actions API specification (`/api/actions/duel`).
- Allows any player to create a duel lobby and share an unfurlable link on **X (Twitter)** or **Telegram**.
- Any viewer on X can click *"Accept Duel [0.1 SOL]"* directly inside their social feed to join and launch into the match.

### E. Metaplex Core Character NFT (Durability & Economic Sinks)
- Duelists are represented by **Metaplex Core** NFTs (the newest, ultra-light Solana NFT standard).
- **Durability Attribute:** Each minted character has an on-chain attribute `durability: 10`.
- Each match entry burns **1 Durability**. When durability hits 0, the character is exhausted; the player must purchase a new character to enter ranked arenas.
- **Critical Safety Guard (`close_lobby`):** If a host opens a lobby and closes it before an opponent joins, the 1 durability is **refunded immediately** (`saturating_add(1)`).

### F. The 90 / 5 / 5 Economic Distribution
Instead of printing an inflationary utility token that collapses to zero, ROLET operates purely in native **SOL**:
- **90% $\rightarrow$ Championship Treasury & Match Winner:** Distributed directly to victorious duelists.
- **5% $\rightarrow$ Protocol Operations & Infrastructure:** Dedicated to RPC costs, infrastructure, and core development.
- **5% $\rightarrow$ On-Chain Insurance Reserve:** Locked in the protocol vault to guarantee solvency and anti-griefing coverage.

### G. Cryptographic Commit-Reveal Entropy
To eliminate front-running and host griefing:
1. **Host Commit:** Host generates secret $S_{host}$, submits hash $H_{host} = \text{keccak256}(S_{host})$ at `open_lobby`.
2. **Guest Commit:** Guest generates secret $S_{guest}$, submits hash $H_{guest} = \text{keccak256}(S_{guest})$ at `join_lobby`.
3. **Reveal & Seed:** Both secrets are revealed and XOR-hashed with the Solana `slot_hashes` sysvar to seed the revolver cylinder shuffling. Neither player can predict or manipulate chamber order.

---

## 6. PROJECT DIRECTORY STRUCTURE & TECH STACK

```
rolet/
├── apps/
│   ├── server/                         # Solana Smart Contracts (Anchor)
│   │   ├── programs/
│   │   │   └── rolet/
│   │   │       ├── src/
│   │   │       │   ├── lib.rs          # Main program instructions & handlers
│   │   │       │   ├── state.rs        # Account structs (MatchState, LobbyState, Vault)
│   │   │       │   ├── errors.rs       # Custom error codes
│   │   │       │   └── cards.rs        # Card resolution logic
│   │   │       └── Cargo.toml
│   │   ├── tests/                      # Mocha / TypeScript Integration Tests
│   │   │   ├── rolet.ts                # Turn & chamber mechanics test suite
│   │   │   └── economy-core.ts         # 90/5/5 split & durability lifecycle tests
│   │   └── Anchor.toml
│   │
│   └── web/                            # Next.js 15+ Frontend
│       ├── app/
│       │   ├── page.tsx                # Axie-style Landing Page (English, No Emojis)
│       │   ├── play/page.tsx           # Full-screen 100vh Diegetic 3D Duel Portal
│       │   ├── api/actions/duel/       # Dialect Solana Actions & Blinks endpoint
│       │   └── layout.tsx
│       ├── components/
│       │   ├── landing/                # Landing page sections
│       │   │   ├── HeroRevolver3D.tsx  # Scrollytelling 3D revolver canvas
│       │   │   ├── GrimoireDeck.tsx    # 12-Card interactive tarot carousel
│       │   │   ├── EconomyDiagram.tsx  # 90/5/5 tokenomics visualizer
│       │   │   └── DuelistHall.tsx     # Bonfida SNS Leaderboard
│       │   └── play/diegetic/          # Diegetic 3D Scene Components
│       │       ├── TabletopScene.tsx   # Three.js / R3F Canvas & lighting
│       │       ├── DiegeticRevolver.tsx# Interactive 3D revolver with FPV aiming
│       │       ├── DiegeticLifeBox.tsx # Electro-mechanical Nixie tube HP box
│       │       ├── DiegeticAmmoTray.tsx# Live/blank cartridge wooden tray
│       │       ├── DiegeticCardHand.tsx# Physical tarot hand resting on table
│       │       └── NameplateSNS.tsx    # Engraved brass SNS plaques
│       ├── hooks/
│       │   ├── useRolet.ts             # Program polling & Anchor client hook
│       │   ├── useSessionKey.ts        # Ephemeral keypair signer
│       │   └── useMagicBlock.ts        # Ephemeral Rollup delegation hook
│       └── public/
│           ├── models/                 # 4K PBR Meshy AI GLB assets
│           │   ├── revolver_occult.glb
│           │   ├── life_counter_box.glb
│           │   └── table_props.glb
│           └── audio/                  # Diegetic sound effects (click, hammer, blast)
```

---

## 7. EXECUTION ROADMAP FOR THE AGENT

When implementing this codebase, execute through these 6 chronological phases:

- [ ] **Phase 1: Brand & Theme Alignment (Zero Emojis, English UI)**
  - Establish Tailwind configuration with Occult Palette: `#0B0907` (Deep Obsidian), `#1E1611` (Aged Mahogany), `#152B1E` (Baize Green), `#C6A15B` (Burnished Brass), `#8C2727` (Occult Crimson).
  - Enforce Lucide icons & SVGs across all components. Remove all emojis and regulated-gaming vocabulary.
- [ ] **Phase 2: Axie-Style Scrollytelling Landing Page (`/`)**
  - Implement `HeroRevolver3D.tsx` with GSAP `ScrollTrigger` and Three.js canvas.
  - Implement `GrimoireDeck.tsx` showcasing all 12 cards with tilt physics.
  - Connect live Solana RPC reader for `GameVault` championship balance.
- [ ] **Phase 3: Diegetic 3D Arena (`/play`)**
  - Mount R3F Canvas with First-Person camera angle facing the masked rival.
  - Integrate `revolver_occult.glb` and `life_counter_box.glb` into the table setup.
  - Bind Nixie tube numbers to reactive on-chain `player_hp` and `rival_hp`.
  - Implement 3D click interactions: Self-aim vs Rival-aim.
- [ ] **Phase 4: Anchor Smart Contract Verification & Hardening**
  - Enforce the **90% Treasury / 5% Team / 5% Insurance** distribution on settlement.
  - Ensure `close_lobby` refunds 1 character durability on cancellation.
  - Implement strict 3-phase Commit-Reveal entropy generation.
- [ ] **Phase 5: Web3 Superchargers (MagicBlock + Blinks + SNS)**
  - Planned: integrate MagicBlock Ephemeral Rollup delegation for zero-latency gameplay (currently blocked by the SDK dependency conflict).
  - Deploy Dialect Solana Blink endpoint (`/api/actions/duel`).
  - Resolve `.sol` domains onto table brass nameplates via Bonfida SNS SDK.
- [ ] **Phase 6: End-to-End Devnet Duel Validation**
  - Simulate dual-wallet duels using Session Keys.
  - Verify smooth state synchronization without any wallet confirmation popups during combat.

---
*End of Master Specification. Pass this prompt to the AI agent to begin immediate execution.*
