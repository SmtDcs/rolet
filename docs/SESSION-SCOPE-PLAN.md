# Session Scope Implementation Plan

## Result (2026-10-11)

Shipped on `feat/session-scope`, commits `cbe3d98` and `24df042`. Program upgraded in place on devnet (`mspQcUFhmAGYUsnBbcUndhaZiris53KtwYCjDHU91oH`).

What changed in the program: every game instruction takes the wallet as an unsigned `authority` (PDA seeds and participant checks) plus a `signer` that may be the wallet's registered session key. `init` pays rent from `signer`, so the funded session key covers it. `open_lobby`, `join_lobby`, `reveal_secret`, `init_match`, `delegate_match`, `close_lobby`, `commit_and_undelegate_match` and `settle_match` all run on the session key.

What did not need building: the server relayer. `settle_match` already accepted any signer, so the session key settles the match; its rent refund goes to the key. Session funding also stayed on the wallet: the transfer and `register_session_key` share one transaction, so opening a session costs exactly the one prompt the old flow already paid for `register_session_key`.

Verified with a scripted two-wallet match on devnet: lobby, reveals, init, delegate, 11 turns on the EU rollup, commit and settle. Only the queue message and the session open touched a wallet. `tsc --noEmit` and 33 unit tests pass.

Remaining: the queue message signature is still one prompt per player. Batching (`open+reveal`, `init+delegate+close`) was not needed for the onay count and is left out.

---

> **For the agent:** the task list below is the original plan, kept for reference. Steps already delivered are noted above.

## Goal

One wallet prompt per player for the whole match. A session key signs the lobby, the match setup, every turn and the end of the match.

**Architecture:** Programda PDA tohumu için `authority` (cüzdan, imzasız) ile `signer` (session key veya cüzdan) ayrılır; `resolve_actor` ikisini eşler. Web tek oturum açma işleminde session key'i fonlar ve kaydeder, sonra bütün akış o anahtarla gider. Maç sonu `settle_match` sunucu relayer'ına verilir.

**Tech Stack:** Anchor 1.0.2 / Solana 3.1.9 (program), Next.js 16 / React 19 / @coral-xyz/anchor 0.32.1 (web), MagicBlock ER SDK 0.17.3, node:test (birim testleri).

## Global Constraints

- Canlı eski program `Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792` güncellenmeyecek.
- Program ID bu iş boyunca `mspQcUFhmAGYUsnBbcUndhaZiris53KtwYCjDHU91oH` kalır; değişiklik `solana program deploy --program-id ...` ile upgrade edilir.
- Demo `experiment/magicblock-anchor1` branch'inde ve 3001 portunda ayakta kalır; bu iş `feat/session-scope` branch'inde yürür.
- İngilizce ürün metni. "Roulette" kelimesi yasak. Kumar dili, emoji, neon/mor/keçe/kan/kurukafa yok.
- Sırlar, özel anahtarlar ve env değerleri yazdırılmaz; keypair'ler `target/` altında ve commit edilmez.
- ER ucu `https://devnet-eu.magicblock.app`.
- `TURN_TIMEOUT_SLOTS` L1 slot'una göre; rollup saatinde zaman aşımı talebi yapılmaz.

---

## File Structure

- `apps/server/programs/rolet/src/lib.rs` — authority/signer deseni, tüm talimatlar
- `apps/web/hooks/useRolet.ts` — oturum açma, session key ile gönderim, işlem gruplama
- `apps/web/lib/chainPace.ts` — saf kurallar (session fon planı, gruplama kararları)
- `apps/web/lib/sessionPlan.ts` — yeni: oturum açma işlemini kuran saf fonksiyonlar
- `apps/web/app/api/session-fund/route.ts` — yeni: sunucu session key'i fonlar
- `apps/web/app/api/settle/route.ts` — yeni: sunucu relayer olarak maçı kapatır
- `apps/web/app/duel/page.tsx` — akıştan tek onaylık oturum açmaya geçiş
- `apps/server/.session-faucet.json` — yeni, gitignored sunucu fon cüzdanı

---

### Task 1: Program — `authority` + `signer` deseni

**Files:**
- Modify: `apps/server/programs/rolet/src/lib.rs`

**Interfaces:**
- Produces: her talimatta iki hesap — `authority: SystemAccount<'info>` (PDA tohumu, imzasız) ve `signer: Signer<'info>` (session key ya da cüzdan).

- [ ] **Step 1: `resolve_actor`'ü `authority` alacak şekilde sadeleştir**

`resolve_actor(signer: Pubkey, profile: &Account<PlayerProfile>, expected: Pubkey, now: i64)` imzası kalır; çağıranlar artık `expected` olarak `authority.key()` verir.

- [ ] **Step 2: `open_lobby` hesap yapısını değiştir**

```rust
pub struct OpenLobby<'info> {
    #[account(init, payer = authority, space = 8 + LobbyState::INIT_SPACE,
        seeds = [b"lobby", match_id.to_le_bytes().as_ref()], bump)]
    pub lobby: Account<'info, LobbyState>,
    #[account(mut, seeds = [b"profile", authority.key().as_ref()], bump = host_profile.bump,
        constraint = host_profile.authority == authority.key() @ RoletError::ProfileMismatch)]
    pub host_profile: Box<Account<'info, PlayerProfile>>,
    #[account(mut)]
    pub authority: SystemAccount<'info>,
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

Handler başında: `let host = resolve_actor(ctx.accounts.signer.key(), &ctx.accounts.host_profile, ctx.accounts.authority.key(), Clock::get()?.unix_timestamp)?;` ve `lobby.host = host;`.

- [ ] **Step 3: `join_lobby` aynı desen**

`guest_profile` PDA'sı `authority.key()`'den; `authority: SystemAccount`, `signer: Signer`.

- [ ] **Step 4: `reveal_secret`'a profil ekle**

```rust
pub struct RevealSecret<'info> {
    #[account(mut, seeds = [b"lobby", lobby.match_id.to_le_bytes().as_ref()], bump = lobby.bump)]
    pub lobby: Box<Account<'info, LobbyState>>,
    #[account(seeds = [b"profile", authority.key().as_ref()], bump = player_profile.bump,
        constraint = player_profile.authority == authority.key() @ RoletError::ProfileMismatch)]
    pub player_profile: Box<Account<'info, PlayerProfile>>,
    pub authority: SystemAccount<'info>,
    pub signer: Signer<'info>,
}
```

Handler: `let actor = resolve_actor(...)`; `require!(actor == lobby.host || lobby.guest == Some(actor), RoletError::NotAParticipant)`.

- [ ] **Step 5: `init_match`, `delegate_match`, `commit_and_undelegate_match`, `close_lobby`**

Her birinde `payer`/`host` yerine `authority: SystemAccount<'info>` (mut) + `signer: Signer<'info>`; PDA tohumları `authority.key()`; handler `resolve_actor` ile aktörü bulur ve `lobby.host` / `match_state.player_one|player_two` ile karşılaştırır.

`delegate_match` ve `commit_and_undelegate_match` için `payer` = `authority` (kira ve commit ücretini cüzdan öder, imza session key'den gelir).

- [ ] **Step 6: `settle_match` relayer kabul etsin**

`rent_refund: Signer<'info>` kalır (artık sunucu), `winner` constraint'i değişmez. Başka değişiklik yok.

- [ ] **Step 7: Derle ve doğrula**

Run: `cd apps/server && PATH=".../3.1.9/bin:$PATH" ~/.avm/bin/anchor-1.0.2 build`
Expected: exit 0, `target/deploy/rolet.so` yenilenir, IDL'de yeni hesap listeleri.

- [ ] **Step 8: Commit**

```bash
git add apps/server/programs/rolet/src/lib.rs apps/server/target/idl/rolet.json
git commit -m "feat(program): accept a session key signer on every game instruction"
```

---

### Task 2: Web — tek onaylık oturum açma

**Files:**
- Create: `apps/web/lib/sessionPlan.ts`, `apps/web/lib/sessionPlan.test.ts`
- Modify: `apps/web/hooks/useRolet.ts`, `apps/web/lib/chainPace.ts`

**Interfaces:**
- Produces: `sessionOpenInstructions(...)` — session key'i cüzdandan fonlayan transfer + `register_session_key` talimatlarını döner; `sendWithSessionKey(tx, conn)` tüm oyun işlemlerinde kullanılır.

- [ ] **Step 1: Testi yaz** (`sessionPlan.test.ts`)

```ts
test("session open funds the key and registers it in one transaction", () => {
  const plan = sessionOpenPlan({ sessionPubkey: "S", wallet: "W", lamports: 5_000_000 });
  assert.equal(plan.legs.length, 2);
  assert.equal(plan.legs[0].kind, "transfer");
  assert.equal(plan.legs[1].kind, "register");
  assert.equal(plan.legs[0].lamports, 5_000_000);
});

test("a funded key is not funded twice inside the session window", () => {
  assert.equal(needsFunding({ balance: 5_000_000, threshold: 1_000_000 }), false);
  assert.equal(needsFunding({ balance: 0, threshold: 1_000_000 }), true);
});
```

- [ ] **Step 2: Testin düştüğünü gör**

Run: `cd apps/web && ../../apps/server/node_modules/.bin/tsx --test lib/sessionPlan.test.ts`
Expected: FAIL, modül yok.

- [ ] **Step 3: `sessionPlan.ts` yaz**

Saf fonksiyonlar: `sessionOpenPlan`, `needsFunding`, `sessionOpenMessage`. Airdrop çağrısı yok.

- [ ] **Step 4: Testin geçtiğini gör**

Run: aynı komut. Expected: PASS.

- [ ] **Step 5: `useRolet.startSession`'ı yeniden yaz**

Cüzdan transferi (0.005 SOL) + `register_session_key` tek `Transaction` içinde, cüzdan imzasıyla. Airdrop yolu kaldırılır. Session secret `sessionStorage`'a yazılır.

- [ ] **Step 6: Tüm oyun işlemlerini session key'e çevir**

`openLobby`, `joinLobby`, `revealSecret`, `initMatch`, `delegateMatch`, `commitAndUndelegateMatch`, `closeLobby` — hepsi `sendWithSessionKey` ile. Her biri `authority` hesabını (cüzdan pubkey) ve yeni IDL hesap adlarını geçirir.

- [ ] **Step 7: Test ve tip kontrolü**

Run: `cd apps/web && ../../apps/server/node_modules/.bin/tsx --test lib/*.test.ts && pnpm exec tsc --noEmit`
Expected: hepsi geçer.

- [ ] **Step 8: Commit**

---

### Task 3: İşlem gruplama

**Files:**
- Modify: `apps/web/app/duel/page.tsx`, `apps/web/lib/chainPace.ts`, `apps/web/lib/chainPace.test.ts`

- [ ] **Step 1: Testleri yaz** — `open+reveal` tek listede, `init+delegate+close` tek listede.

- [ ] **Step 2: Düşüşü gör.**

- [ ] **Step 3: Akışı gruplara çevir** — host `open_lobby` ile `reveal_secret`'ı, guest `join_lobby` ile `reveal_secret`'ı, host `init_match` + `delegate_match` + `close_lobby`'yi tek işlemde gönderir.

- [ ] **Step 4: Geçişi gör, commit.**

---

### Task 4: Sunucu — session fonlama ve settle relayer

**Files:**
- Create: `apps/web/app/api/session-fund/route.ts`, `apps/web/app/api/settle/route.ts`

- [ ] **Step 1: Fon cüzdanı oluştur ve devnette fonla** (sır yazdırılmaz, `apps/server/.session-faucet.json`, gitignore'a eklenir).

- [ ] **Step 2: `/api/session-fund`** — gövdede session pubkey; IP başına dakikada 1 istek; 0.005 SOL transfer; yanıt `{ ok, signature }`.

- [ ] **Step 3: `/api/settle`** — gövdede match id; L1'den maçı okur; `winner` ve `rent_refund` ile `settle_match` gönderir; yanıt `{ ok, signature, winner }`.

- [ ] **Step 4: Uçtan uca test** — iki cüzdanla tam maç; sayılan onay: host 2, guest 2, turlar 0.

- [ ] **Step 5: Commit.**

---

### Task 5: Cutover

- [ ] **Step 1: Programı upgrade et** — `solana program deploy target/deploy/rolet.so --program-id target/deploy/rolet-er-keypair.json`.
- [ ] **Step 2: Yeni IDL'i web'e kopyala**, sunucuyu yeni koddan başlat.
- [ ] **Step 3: Tarayıcıda iki cüzdanla doğrula** ve onay sayısını ölç.
- [ ] **Step 4: Commit + plan dosyasını güncelle.**

## Self-Review

- Kapsam: onay azaltma (Task 1-3), güvenilir fonlama (Task 2, 4), relayer (Task 4) — hepsi bir göreve bağlı.
- Placeholder: kod gösterilen adımlarda gövde var; Task 4 adımlarında rota sözleşmesi yazılı.
- Tip tutarlılığı: `authority` / `signer` adları Task 1'de tanımlandı, Task 2 ve 3 aynı adları kullanır.
