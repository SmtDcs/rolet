# ROLET — CLI Handoff (önce bunu oku)

> Bu dosya Grok CLI (veya herhangi bir yeni AI/geliştirici oturumu) için **tek giriş noktasıdır**.
> Son güncelleme: 10 Ekim 2026 (TR). Branch: `feature/duel-2d`.
> Takibi ve komutları **Samet kendi bilgisayarından** yönetir. Prod deploy, para/kredi harcayan
> işlemler ve dışarıya mesaj göndermek için önce Samet'in onayını al.

---

## 1. ROLET nedir?

Solana üzerinde **1v1, sıra tabanlı, tamamen on-chain taktik hazne düellosu** (Fully On-Chain Game).
Atmosfer: *Buckshot Roulette* gerilimi + *Inscryption* kağıt/ahşap/metal atölye hissi.

- 8 hazneli tabanca: **5 canlı + 3 boş** mermi (sıra gizli, oran açık).
- Her oyuncu **4 HP** ile başlar; 0 HP olan kaybeder.
- Her oyuncuya 12 kart tipinden **4 kart** dağıtılır.
- Sıradaki oyuncu: kart oynar ve/veya tetiği çeker.
  - Rakibe ateş: canlıysa 1 hasar (DoubleStrike ile 2), sıra geçer.
  - Kendine ateş: boşsa **sıra sende kalır**; canlıysa 1 hasar alırsın, sıra geçer.
- Sıradaki oyuncu `TURN_TIMEOUT_SLOTS = 150` slot boyunca oynamazsa bekleyen oyuncu `claim_timeout` ile kazanır.

Sabitler (`apps/server/programs/rolet/src/lib.rs`): `STARTING_HP=4`, `CHAMBER_COUNT=8`, `LIVE_ROUNDS=5`,
`BLANK_ROUNDS=3`, `HAND_SIZE=4`, `CARD_VARIANTS=12`, `SEED_DELAY_SLOTS=2`, `LAUNCH_WINDOW_SLOTS=300`.

### 12 kart
HawkEye (mevcut hazneyi gör), BulletExtractor (hazneyi at), DoubleStrike (sonraki canlı 2 hasar),
Blocker (sonraki hasarı engelle), Healer (+1 HP, max 4), RestoreBullet (boş hazneye canlı koy),
Shuffler (kalanları karıştır), CardThief (rakipten rastgele kart çal), RandomInsight (rastgele bir hazneyi gör),
LastChance (sadece 1 HP'deyken; rakibin sırasını atlat), HandOfFate (mevcut hazneyi tersine çevir),
Silence (rakip sonraki turunda kart oynayamaz). Detay: `docs/ROLET_MASTER_HANDOFF_PROMPT.md` §2.

---

## 2. Ekonomi (koddan doğrulandı)

- **Gerçek SOL stake / bahis YOK.** Maça giriş SOL ile değil, karakterin **durability**'si ile ödenir.
- **Karakter NFT (Metaplex Core):** `purchase_character` — fiyat `vault.character_price_sol`.
  Gelirin **%5'i ops**, **%95'i treasury** (kodda yorum: %90 kazanan havuzu + %5 sigorta rezervi).
  Karakter `durability` taşır (spec: 10); her maç girişi 1 durability yakar.
- **Ödül:** `settle_match` kazanana treasury PDA'dan **sabit** `vault.reward_sol` öder (SOL; inflasyonist token yok, `$ROLET` token kaldırıldı).
- **`close_lobby` iadesi:**
  - Guest yokken host kapatırsa: host'a +1 durability iade, lobby kapanır.
  - Guest katıldı ama iki reveal tamamlanmadıysa: iki tarafa +1 iade.
  - **İki taraf da reveal ettiyse:** `close_lobby` reddedilir (`LobbyMustLaunch`) — re-roll yok (RİSK-A).
    `seed_slot + LAUNCH_WINDOW_SLOTS` geçtikten sonra sadece rent iadesi, durability iadesi YOK.
- Şu an her şey **devnet**.

---

## 3. Oyun akışı (on-chain)

```
init_player_profile (bir kez, /profile)
open_lobby(host_commit)          -> LobbyState PDA
join_lobby(guest_commit)         -> guest SADECE commit gönderir (secret yok)
reveal_secret(secret) x2         -> commit = lobby_commitment(secret, player, match_id)
init_match(match_id)             -> seed slot hash'ine bağlı RNG, MatchState PDA, lobby kapanır
register_session_key             -> tek popup, sonra turlar popup'sız
play_card / pull_trigger(target_self)  ... (turlar)
settle_match                     -> kazanan treasury'den reward_sol alır
claim_timeout                    -> rakip 150 slot oynamazsa
```

Diğer instruction'lar: `init_vault`, `update_vault_params`, `set_character_nft`, `purchase_character`.

**Güvenlik düzeltmeleri (bu branch'te, devnet'e redeploy edildi):**
- **RİSK-B:** Commit oyuncuya + `match_id`'ye bağlı (`lobby_commitment`). Commit kopyalama (`DuplicateCommit`),
  başka koltukta/başka lobide reveal (`InvalidReveal`) engelli; eski bağsız `keccak(secret)` commit açılmaz.
- **RİSK-A:** İki reveal sonrası `close_lobby` ile sonucu görüp iptal etme engelli.
- Entropi: son reveal'dan `SEED_DELAY_SLOTS` sonra üretilen slot hash'i — reveal anında henüz yok, grind edilemez.
- `/duel` tarafında guest otomatik `initMatch` + `handleLaunch` retry eklendi.
- Testler: `apps/server/tests/rolet-security-audit.ts` (32 case: join/reveal/init_match kapıları, close_lobby iadesi,
  claim_timeout, RİSK-A, RİSK-B), `tests/rolet.ts`, `tests/economy-core.ts`. Devnet e2e: `apps/server/scripts/devnet-e2e.ts`.
  Önceki oturumda yeşil raporlandı; değişiklik yaparsan yeniden koş.

**Program ID (devnet):** `Gwh17ftx2mhKNV7BFgGXDYbtpxC1gw6gJbXEk3xYE792`

---

## 4. Mimari / repo

pnpm monorepo (`packageManager: pnpm@10.33.2`).

```
apps/server/   Anchor workspace (Anchor 0.30.1 toolchain, Rust)
  programs/rolet/src/lib.rs   tüm program
  tests/                      rolet.ts, economy-core.ts, rolet-security-audit.ts
  scripts/                    bootstrap-vault.ts, devnet-e2e.ts
apps/web/      Next 16.2.4, React 19.2, R3F 9, drei, postprocessing, Tailwind 4, GSAP, Lenis
  app/          / (landing), /duel (gerçek on-chain demo), /play, /profile, /leaderboard, /api/actions/duel (Blink)
  hooks/useRolet.ts           Anchor client + oyun mantığı
  lib/lobbyCommit.ts          bağlı commit hesaplama (RİSK-B)
  idl/rolet.json              program IDL (programla senkron tutulmalı)
  components/landing/         yeni landing (aşağıda)
  public/art/landing/         landing görselleri + workshop-hq.glb
packages/shared/
docs/          spec, planlar, stil rehberleri, bu dosya
```

**Landing (`apps/web/app/page.tsx`):** LandingNavbar, HeroSection, HowItWorksSection, CardsSection,
WorkshopNote, LandingFooter, WorkshopBackground. 3D arka plan: `components/landing/WorkshopScene3D.tsx`
(şu an `/art/landing/workshop-hq.glb` yüklüyor, tek titreyen pointLight). Eski Axie-tarzı landing bileşenleri silindi.

**Env (`apps/web/.env.local`, git'e girmez):** `NEXT_PUBLIC_RPC_ENDPOINT`, `NEXT_PUBLIC_SOLANA_NETWORK`,
`NEXT_PUBLIC_ROLET_PROGRAM_ID`, `NEXT_PUBLIC_MAGICBLOCK_ER_ENDPOINT`, `RPCFAST_BACKEND_URL`, `RPCFAST_API_KEY`.
Değerleri asla commit'leme / log'a basma.

**Canlı:** https://rolet-web-server.vercel.app (Vercel projesi `rolet-web-server`; hem repo kökü hem `apps/web` linkli).

---

## 5. Komutlar

```bash
pnpm install                          # kökte
cd apps/web && pnpm dev               # Next dev (varsayılan :3000; terminal çıktısındaki portu kullan)
cd apps/web && pnpm build             # prod build kontrolü (deploy öncesi şart)

cd apps/server && pnpm anchor:build   # anchor build --no-idl
cd apps/server && pnpm anchor:test    # anchor test --skip-local-validator
cd apps/server && npx tsx scripts/devnet-e2e.ts

vercel ls                             # deploy listesi
vercel --prod                         # SADECE Samet onayından sonra
```

Program redeploy (devnet) gerekiyorsa: `anchor build` -> `solana program deploy target/deploy/rolet.so --url devnet`
-> IDL'yi `apps/web/idl/rolet.json`'a senkronla. Keypair dosyaları (`target/deploy/*-keypair.json`, `~/.config/solana/id.json`,
`.player*.json`) asla commit'lenmez.

---

## 6. Yapılanlar (özet)

- Kontrat: commit-reveal + `close_lobby` RİSK-A/B düzeltildi, güvenlik testleri, devnet redeploy + e2e.
- `/duel` gerçek zincir demo yolu; guest auto-initMatch.
- Kasino dili + emoji temizliği (README/PITCH/client).
- Blink endpoint: `apps/web/app/api/actions/duel/route.ts` (planned/kısmi).
- Landing yeniden yapıldı: paper-card workshop, HD kart/duelist görselleri, "How it works", insan dili copy,
  3D workshop arka plan + ışık flicker. Scrollytelling bölümü kaldırıldı (Samet beğenmedi).
- HD restyle Vercel prod'a deploy edildi.

---

## 7. ŞİMDİKİ İŞ: Landing arka planı (3D)

**Konsept (Samet + Game Art Director onaylı):** Kapalı karanlık atölye. Önde boş, yağlı ahşap masa; masanın
**ön kenarında (kameraya yakın) 5–8 küçük mermi kovanı** — 2–3 parlak canlı pirinç (`#B88A2E`) + 3–5 mat/kararmış boş,
dağınık, sıra yok. Arkada Gunmetal dolap; bir kapak çapraz aralık; kapaktan **yarım görünen yıpranmış revolver**
(kahraman ürün fotoğrafı değil). Tek ışık: kapaktan sızan sıcak sodium `#D9963A` flicker; geri kalan Soot `#141414`.

> Not: `docs/design/landing-bg/ROLET-landing-bg-cabinet-brief.md` hâlâ "dolapta yarım silindir" diyor.
> **Samet bunu değiştirdi: silindir yerine revolver + masaya kovanlar.** Brief'in kompozisyon/kamera/ışık/malzeme/yasak
> kısımları geçerli; silindir kısmı geçersiz.

**Kilitli 2D konsept (Art Director ONAY):** `docs/design/landing-bg/locked-2d-revolver-shells.png`
(kaynağı Meshy image-to-image task `01a1253c-6ee6-7368-9446-0910e5a36621`; oran ~1:1, landing 16:9 → crop/üretimde 16:9).

**KULLANMA:** Meshy image-to-3D task `01a12579` — sonucu bozuk (sadece iki metal çubuk/kanca; masa/dolap/revolver/kovan yok).
Bu GLB repoda değil ve repoya eklenmeyecek.

**Yapılacaklar:**
1. Kilitli 2D'den **yeni image-to-3D** (Meshy, textured/PBR GLB). Meshy kredisi harcar → Samet onayı.
   Tek görselden tüm oda çıkmayabilir; sonuç sahne değilse alternatif: 2D kilitli görseli düzlem arka plan olarak kullanıp
   üstüne three.js ışık flicker + hafif parallax (önce Samet'e sor).
2. GLB'yi viewer'da doğrula: masa boş hissi + ön kenar kovanlar, kapaktan yarım revolver, sodium ışık, clutter yok.
3. Optimize et (draco/meshopt, texture boyutu) → `apps/web/public/art/landing/` → `WorkshopScene3D.tsx` içinde `MODEL_URL`'yi değiştir
   (eski `workshop-hq.glb` yerine), kamera 16:9, flicker ışığını kapak açıklığına konumla.
4. `pnpm dev` ile yerelde kontrol, `pnpm build` geçsin, FPS'i kontrol et (Samet önceki scrollytelling'i FPS yüzünden reddetti).
5. Samet onayı → `vercel --prod`.

---

## 8. Colosseum teslim

- Son tarih: **13 Ekim 2026, 09:59 (TR)**.
- Paket: kısa açıklama, GitHub linki, **pitch videosu ≤2 dk**, **teknik demo videosu ≤3 dk**, canlı ürün linki.
- Demo yolu: `/duel` (iki cüzdan, devnet). Senaryo: `DEMO-SCRIPT.md`. Pitch metni: `PITCH.md`.
- **MagicBlock Ephemeral Rollups: planned/blocked** (SDK–Anchor tip çakışması); oyun L1 + session keys ile çalışıyor. Aktifmiş gibi iddia etme.
- **Blinks: planned.**

**Bilinen eski/çelişkili metinler (düzelt veya dikkat et):**
- `README.md` "Known Limitations" hâlâ "join_lobby guest_secret'ı düz metin gönderiyor" diyor — **kod artık sadece commit alıyor** (RİSK-B düzeltildi); README tablosundaki `join_lobby` satırı da eski.
- `DEMO-SCRIPT.md` "$ROLET" ödülünden bahsediyor — ödül artık **SOL** (`reward_sol`).
- `docs/ROLET_MASTER_HANDOFF_PROMPT.md` §4 Axie-tarzı landing'i anlatıyor — **geçersiz**; landing artık Buckshot/Inscryption workshop. Oyun mekaniği/ekonomi kısımları referans olarak geçerli.
- `ROADMAP.md` eski (v0.1 dönemi); branch kuralları hâlâ faydalı.

---

## 9. Yasaklar

- **Kasino / kumar dili yok** (bet, gamble, casino, jackpot vb.). "Tactical chamber duel", "duelist", "prize pool" kullan.
- Emoji yok (UI, copy, dokümanda). Lucide ikon / SVG kullan.
- Masada **kocaman 8 hazneli silindir yok**; ürün kataloğu fotoğrafı yok.
- Neon, mor glow, poker chip, felt, kan, kafatası, clutter yığını yok.
- Vinyl-toy / oyuncak karakterler yok (Samet reddetti).
- "AI yazmış gibi" copy yok — kısa, insan dili.
- Secret/keypair/env değeri commit'leme. Force-push yapma.
- Gerçek SOL stake ekleme.

## 10. Referans dosyalar

- `docs/design/ROLET-stil-rehberi-v1.2.md` — güncel stil rehberi (renkler, tipografi, materyal)
- `docs/design/landing-bg/` — kilitli 2D + BG brief
- `docs/ROLET_MASTER_HANDOFF_PROMPT.md` — orijinal master spec (mekanik/ekonomi)
- `README.md`, `PITCH.md`, `DEMO-SCRIPT.md`, `ROADMAP.md`, `CHECKPOINT-v0.1.md`
