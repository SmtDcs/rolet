# ROLET — Demo Recording Script

**Target length:** 3 minutes (Colosseum technical demo cap). Trim the middle turns first.  
**Setup:** Two browser windows side by side (Host = left, Guest = right).  
Both wallets on Devnet. Both wallets have devnet SOL for fees and a character with durability.

---

## Pre-recording checklist

- [ ] Both wallets airdropped devnet SOL (`solana airdrop 1 <pubkey> --url devnet`)
- [ ] Both wallets enrolled (visited /profile, created PlayerProfile)
- [ ] Treasury PDA holds SOL for `reward_sol` (`apps/server/scripts/bootstrap-vault.ts` has been run)
- [ ] Browser at 1280×800 or wider — both windows visible
- [ ] Screen recording started, mic ready

---

## Script

### [0:00 – 0:20] Hook

**Show:** Game landing page. Paper-card workshop aesthetic, tactical duel arena, the revolver.

**Say:**
> "This is ROLET — a fully on-chain tactical chamber duel built on Solana.
> The server only introduces the two wallets. Every chamber, every card
> effect, every payout lives on Solana. Let me show you a live match on devnet."

---

### [0:20 – 0:45] Both sit in the queue

**Show:** Left window → `/duel` → click **Find a match**. Right window does the same.

- Each wallet signs one queue message. That signature does not open a room.
- The server names one wallet the host. That wallet then approves `open_lobby` (1 durability).
- The other wallet stays on Find a match until the room is open, then the page joins that room.
- A second popup may appear: `register_session_key`. Approve it. Turns after that are signed locally.

**Say:**
> "Neither player picks the room. The server only pairs the two wallets.
> One of them opens the lobby on Solana. The commitment goes on-chain.
> The secret does not."

---

### [0:45 – 1:10] Guest joins

**Show:** The second window moves to the open room on its own.

- Wallet popup → approve (`join_lobby` with the guest commit only)
- Guest screen moves through sitting down and revealing

**Say:**
> "Player two joins the room the server named. They submit their own
> commitment on-chain. The secret stays off the join transaction."

---

### [1:10 – 1:30] Reveal secrets (`revealSecret`)

**Show:** Both windows — the client submits `reveal_secret` on its own once the guest has joined

- Each transaction carries that player's secret
- The program checks `keccak(secret ‖ player pubkey ‖ match id)` against the stored commit
- When the second reveal lands, the program pins the seed to a slot two slots ahead

**Say:**
> "Both players reveal on-chain. The program checks each secret against a
> commit bound to that player and this match, then pins the seed to a
> future slot. That slot hash does not exist yet, so neither side can grind it."

---

### [1:30 – 1:55] Host launches duel (`initMatch`)

**Show:** Both windows — after "SECRETS VERIFIED" the page calls `init_match` by itself

- If it stalls, either player can press **LAUNCH MATCH**
- The program waits until the pinned slot exists, then seeds the chambers
- Both windows land on the active duel

**Say:**
> "Either player can launch. The program mixes both secrets with that
> future slot hash and the match id. The chamber order is fixed on-chain
> before the first shot."

---

### [1:55 – 2:25] Session keys

**Show:** The `register_session_key` popup that appeared while each player was waiting. If a window still shows **ARMING SESSION KEY…**, approve that one popup.

**Say:**
> "Session keys remove a wallet popup from every turn. One approval
> while the lobby is waiting — then the session keypair signs locally."

*Approve the same popup on the right window if it is still pending.*

---

### [2:25 – 3:15] Gameplay — cards + trigger pulls

**Show:** Left window — it's Host's turn
- Play **HawkEye** card → chamber revealed (live or blank indicator)
- Pull trigger → HP drops or blank fires
- Right window — Guest's turn
- Guest plays **BulletExtractor** → ejects current chamber
- Guest pulls trigger on host

**Say:**
> "Twelve tactical cards. HawkEye peeks at the next chamber.
> BulletExtractor ejects it. DoubleStrike doubles the next live hit.
> Every card call is a signed Solana transaction — verifiable on-chain."

*(Play 3–4 more turns, mix card plays and trigger pulls. Keep energy up.)*

---

### [3:15 – 3:45] Settle — on-chain payout

**Show:** Final trigger pull → HP hits 0 → winner screen
- "CLAIM REWARD" button appears
- Click → wallet popup (settle_match) → approve
- Winner's SOL balance increases by the treasury's fixed `reward_sol`

**Say:**
> "Winner claims SOL from the treasury PDA. The prize is a fixed
> amount, not a token. All of this — from match creation to payout —
> happened on Solana. No backend ever touched game state."

---

### [3:45 – 4:00] Outro

**Show:** Solana Explorer — show the settle_match transaction, click through
the instruction data.

**Say:**
> "ROLET is a Fully On-Chain Game on Solana. Commit-reveal fairness,
> session-key gasless turns, 2-player PvP via Lobby PDA rendezvous.
> Source on GitHub. Try the live demo on devnet."

**End screen:** `github.com/SmtDcs/rolet` + `https://rolet-web-server.vercel.app`

---

## Editing notes

- Trim wallet approval screens to ~2 seconds each (they're boring)
- Add captions for on-chain terms (PDA, session key) the first time they appear
- Background music: lo-fi / industrial, low volume
- Export at 1080p for submission
