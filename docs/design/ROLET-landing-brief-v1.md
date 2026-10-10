# ROLET — Landing Brief (v1)

**One page. No code. No 3D. No Axie. No old site.**  
**Delete:** entire current site design and any Axie / creature-battler / old landing concept. Start from a blank soot page.

**Locked identity (do not invent a new look):**
- Env: workshop table **v3** (Gunmetal cylinder, 8 bored chambers, Brass hub, amber practical light, no mesh numbers)
- Character: **Paper duelist A** — 2D paper-cut card figure (hunched cloak; treat as card art, not vinyl toy)
- Cards: **HawkEye / Blocker / Healer** faces **v2** (Worn paper, Brass rivets, deckle, HEALER 8-chamber wax seal)
- System: crunchy **960×540** world + nearest-neighbor; **sharp DOM HUD** (labels, never baked-on card text)
- Type: **Big Shoulders Display** (titles) · **IBM Plex Sans** (body) · **IBM Plex Mono** (numbers / chamber indices)
- Palette: Soot `#141414` · Gunmetal `#1E2227` · Graphite `#2E333A` · Bone `#E6E1D6` · Worn paper `#C8BFA8` · Brass `#B88A2E` metallic · Signal `#D2462B` / Patina `#3F7F74` **chamber state only** · Sodium `#D9963A` light only
- Banned: casino, “roulette”, chips, felt, neon, purple, vinyl-toy astronaut, gore, Axie-style creatures

**Product one-liner (only line that may say the fantasy):**  
*8 chambers. Paper cards. Dark workshop.*  
Never say “roulette.”

---

## Page structure (single scroll)

### 1. Hero
- Full-bleed **table v3** as background (crop/letterbox to 16:9; keep cylinder readable).
- Overlay: heavy Soot vignette so type stays Bone-legible.
- Title (Big Shoulders Display, short): **ROLET**
- Sub (IBM Plex Sans, one line): **8 chambers. Paper cards. Dark workshop.**
- Primary CTA (Graphite button, Bone label, Brass 1px edge): **Enter the workshop** → duel / play
- Secondary (text link only): **How it works** → anchor `#how`
- No carousel, no creature parade, no casino chips, no neon glow.

### 2. How it works (`#how`)
Three equal columns on Graphite panels. Each column = one locked asset + one sentence.

| Column | Asset | Copy (EN, short) |
|--------|--------|------------------|
| Chambers | Crop of table v3 cylinder / 8 holes | Spin the cylinder. Eight chambers. One truth. |
| Cards | HawkEye / Blocker / Healer strip (separate sprites, not the fan overlap sheet) | Play paper. Roles read at a glance. |
| Duel | Paper duelist A as card portrait | Face a paper rival in the workshop. |

Chamber fill states in any diagram: **Patina = empty**, **Signal = loaded** — nowhere else.

### 3. The cards
- Horizontal row of the three locked faces on Soot.
- Names as **DOM labels** under each card (IBM Plex Sans Medium) — do not rely on banner text inside the art.
- One line under the row: *HawkEye sees. Blocker holds. Healer mends.*
- No fourth “mystery” card art until designed; empty slots stay Graphite placeholders.

### 4. Workshop note (optional, keep short)
- Thin oiled-wood `#3A2A1F` rule + Bone body copy (2–3 sentences max): handmade paper, mechanical click, no casino floor.
- Motion note for implementers: staggered mechanical click only; **no fade-up**.

### 5. Footer
- IBM Plex Mono small: `ROLET` · Solana · workshop
- Links: How it works · Cards · Enter
- No social icon soup; no “powered by” Axie/casino badges.

---

## What to delete (explicit)

- Entire existing landing / marketing layout
- Axie Infinity–inspired creature grid, egg/axie mascots, pastel or neon crypto-pet language
- Any prior “old landing” sections, stock hero videos, casino motifs, roulette wheels, poker chips, green felt
- Vinyl-toy / astronaut / EOD character art (retired)
- Baked chamber numbers on the cylinder mesh (numbers live in DOM only)
- Blurry upscales; apply posterize 16–24 + light grain/vignette to **world/sprites only**, never to HUD type

---

## Build constraints (for whoever implements — still no code in this brief)

- Internal canvas **960×540**, scale with **nearest-neighbor**
- HUD = sharp DOM above the crunchy layer
- Brass accents metallic `#B88A2E`, not mustard paint
- One page, one scroll, one primary CTA
- Mobile: stack the three How-it-works columns; keep hero title + CTA above the fold

---

## Done when

1. Old site / Axie landing is gone.  
2. Hero reads as table v3 workshop, not a casino or pet battler.  
3. Three card roles match locked v2 art.  
4. Paper duelist appears only as 2D card art.  
5. No “roulette” string anywhere on the page.  
6. Type and Brass/Bone contrast pass on Soot without glow crutches.

**Owner:** Game Art Director (visual lock) · ROLET (implement) · Samet (final taste).
