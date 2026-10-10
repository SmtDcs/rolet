# ROLET — Demo Recording Script

**Target length:** 3–4 minutes  
**Setup:** Two browser windows side by side (Host = left, Guest = right).  
Both wallets on Devnet. Both wallets have ≥0.1 SOL for fees.

---

## Pre-recording checklist

- [ ] Both wallets airdropped devnet SOL (`solana airdrop 1 <pubkey> --url devnet`)
- [ ] Both wallets enrolled (visited /profile, created PlayerProfile)
- [ ] Vault has $ROLET balance (bootstrap-vault.ts run)
- [ ] Browser at 1280×800 or wider — both windows visible
- [ ] Screen recording started, mic ready

---

## Script

### [0:00 – 0:20] Hook

**Show:** Game landing page. Paper-card workshop aesthetic, tactical duel arena, the revolver.

**Say:**
> "This is ROLET — a fully on-chain tactical chamber duel built on Solana.
> No server. No database. Every chamber, every card effect, every payout
> lives on-chain. Let me show you a live match on devnet."

---

### [0:20 – 0:45] Host creates lobby

**Show:** Left window → `/duel` → click **CREATE LOBBY**

- Wallet popup appears → approve (open_lobby transaction)
- Page redirects to `?lobby=<id>` → shows "Waiting for opponent…"
- Copy the invite link

**Say:**
> "Player one opens a lobby. A Lobby PDA is created on Solana — it holds
> a cryptographic commitment to their secret. They share the invite link."

---

### [0:45 – 1:10] Guest joins

**Show:** Right window → paste invite URL → page loads

- Guest sees "Join match" → click **JOIN**
- Wallet popup → approve (join_lobby transaction)
- Guest screen shows "Waiting for secret reveal…"

**Say:**
> "Player two joins. They submit their own secret commitment on-chain.
> Neither player can see the other's secret yet."

---

### [1:10 – 1:30] Reveal secrets (`revealSecret`)

**Show:** Both windows — commitments locked on-chain

- Host and guest execute `revealSecret` transactions on-chain
- Program verifies each secret preimage against its stored commitment in the Lobby PDA
- Both screens update to confirmed revealed status

**Say:**
> "Before the duel seeds, both players execute `revealSecret` on-chain.
> The program checks each preimage against the registered commitment,
> ensuring neither player could change entropy after seeing their opponent."

---

### [1:30 – 1:55] Host launches duel (`initMatch`)

**Show:** Left window — both secrets verified on-chain
- Click **LAUNCH MATCH** → wallet popup → approve (`initMatch`)
- Program combines both verified secrets with Solana slot hashes to seed chamber RNG
- Lobby PDA is closed (rent returned) and both windows redirect to active duel

**Say:**
> "Now the host launches via `initMatch`. Both verified secrets are combined
> with Solana slot hashes on-chain to seed the chamber sequence — provably
> fair and tamper-proof. The Lobby PDA is closed, rent returned, and the duel begins."

---

### [1:55 – 2:25] ARM WEAPON — session keys

**Show:** Left window → click **ARM WEAPON**
- One wallet popup (register_session_key) → approve
- "Armed" status appears

**Say:**
> "Session keys eliminate wallet popups for every turn. One approval
> at the start — then the session keypair signs locally. No friction,
> Web2 speed on top of L1."

*Do the same on the right window quickly.*

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
- `$ROLET` balance increases in wallet

**Say:**
> "Winner claims $ROLET from the GameVault treasury PDA. Loser gets
> nothing. All of this — from match creation to payout — happened
> on Solana. No backend ever touched game state."

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
