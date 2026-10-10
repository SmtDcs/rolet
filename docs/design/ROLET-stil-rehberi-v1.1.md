# ROLET — Stil Rehberi (v1.1)

**Oyun:** Solana tactical chamber duel · 8 hazne · 4 can · 12 kart  
**Konsept:** Karanlık atölye / mekanizma. Ana görsel: 8 hazneli silindir (+ scroll öğesi).  
**Karakter dili (v1.1):** Buckshot Roulette + Inscryption — hafif karıncalı/gerilimli, el yapımı kâğıt-kart hissi. Horror-gore yok. Kasino dili yasak.  
**İptal (v1):** vinyl-toy / chibi astronaut / EOD suit karakterleri — Samet RET.

---

## 1. Renk paleti *(korunur)*

| Rol | Ad | Hex | Kullanım |
|-----|-----|-----|----------|
| Zemin | Gunmetal | `#1E2227` | UI zemini, çerçeve, gövde arka plan |
| Yüzey | Graphite | `#2E333A` | Kart yüzü, panel, düğme zemini |
| Metin / kâğıt | Bone | `#E6E1D6` | Başlık, gövde, kâğıt/kart yüzeyi |
| Vurgu | Pirinç | `#B88A2E` | İnce metal çizgi, mühür, seçili durum — **metallic**, hardal boya değil |
| Doluluk | Signal | `#D2462B` | **Sadece dolu hazne** |
| Boşluk | Patina | `#3F7F74` | **Sadece boş hazne** |

**Katı yasaklar:** mor, neon, krem–terracotta, yeşil çuha / casino green; horror kan/gore; vinyl-toy parlak plastik “designer toy” parıltısı.

**Oran:** Gunmetal ~55% · Graphite ~25% · Bone ~12% · Pirinç ~5% · Signal/Patina ~3%.

---

## 2. Tipografi *(korunur)*

| Kullanım | Font | Ağırlık | Not |
|----------|------|---------|-----|
| Başlık | **Big Shoulders Display** | Bold–Black | Kısa etiket |
| Gövde | **IBM Plex Sans** | Regular–Medium | Okunaklı |
| Sayılar | **IBM Plex Mono** | Medium | Tabular |

Ölçek: başlık 28–40px · gövde 14–16px · mono 12–18px.

---

## 3. Hareket *(korunur)*

- Varsayılan: kademeli **mekanik tık** (~80–140ms, gecikme ~40–60ms).
- Yasak: fade-up, bounce, neon pulse, casino chip spin, sürekli glow.
- Hazne: Patina→Signal anlık + tek tık.

---

## 4. Görsel dil — karakter (v1.1)

**Referans ruhu (çalınma yok, his):**
- *Buckshot Roulette:* gerilim, kirli atölye, silindir mekaniği, “bir sonraki tık” hissi — masanın üzerinde değil, atölyenin içinde.
- *Inscryption:* el kesilmiş / baskı kartı, lekeli kâğıt, mühür, kabin-atölye gizemi — occult kart dili, kanlı kurban sahnesi değil.

**Karakter = kâğıt varlık / baskı figürü**, plastik figür değil:
- El yapımı kart veya kesilmiş illüstrasyon hissi (tooth, deckle kenar, hafif mürekkep lekesi OK).
- Siluet okunaklı; yüz nötr veya hafif karıncalı (kapalı yüz / basit maske / boş bakış) — tehditkâr diş/göz oyuğu yok.
- Malzeme: matte kâğıt, mürekkep, ince pirinç mühür — parlak vinyl, astronaut helmet, EOD zırh, jetpack yok.
- Ölçek: oyun içi “kart parçası gibi duran” figür; chibi toy oranı zorunlu değil.

**UI / dünya:** aynı karanlık atölye; silindir kahraman nesne; kartlar Graphite + Bone yüzey, ince Pirinç çerçeve veya mühür.

---

## 5. Meshy prompt seti — karakter (EN only)

Ortak negatif (her prompt’un sonuna ekle):  
`no vinyl toy, no chibi plastic, no astronaut helmet, no EOD armor, no jetpack, no neon, no purple, no green felt, no casino, no roulette table, no poker chips, no gore, no blood, no skull teeth, no horror scream, no hyper-realistic skin`

### A. Paper duelist (öncelikli)
`Handmade paper-cut character for a dark workshop tactical chamber-duel game, Buckshot Roulette tension without casino imagery, Inscryption cardstock feel, flat printed illustration on aged Bone paper, Gunmetal ink shadows, thin Brass #B88A2E wax-seal accent, neutral closed face or simple blank mask, slightly eerie not menacing, deckle paper edges, ink stain OK, orthographic front view, clean silhouette, no 3D plastic toy look`

### B. Workshop warden (kart rakibi)
`Printed playing-card figure, dark atelier aesthetic, Graphite suit suggested as ink hatching not armor plates, Bone paper body, Brass #B88A2E stamp mark on chest, calm tense expression, handmade collage cutout, slight paper curl shadow, orthographic front, game UI card art, no astronaut, no vinyl toy, no gore`

### C. Chamber attendant (nötr yardımcı / NPC)
`Minimal paper puppet character, workshop clerk vibe, Gunmetal coat as flat ink shape, Bone face oval with single thin horizontal visor slit, Brass #B88A2E button dots, eerie calm, cut-paper silhouette, aged paper texture, orthographic front T-pose optional, no skull, no teeth, no plastic sheen`

### Karakter dışı (silindir — değişmez)
`8-chamber revolver cylinder prop as UI hero, workshop steel Gunmetal #1E2227 Graphite recesses, Bone engraved indices, Brass #B88A2E ring metallic, chambers Signal #D2462B loaded or Patina #3F7F74 empty only, no casino, mechanical, orthographic product shot`

---

## 6. Klişe yasak listesi (güncel)

1. Casino / poker / roulette / blackjack dili veya ikonografi  
2. Yeşil çuha, kadife masa, luxury casino altını  
3. Mor / neon / hologram / cyberpunk glow  
4. Krem–terracotta warm luxury  
5. Fade-up, bounce, sürekli pulse  
6. Vinyl-toy / designer plastic / chibi astronaut / EOD zırh / jetpack *(v1.1)*  
7. Horror gore, kan, dişli kafatası, tehditkâr oyuk göz  
8. Signal/Patina’yı hazne dışı dekoratif accent yapmak  
9. Pirinç’i hardal düz boya yapmak — metallic `#B88A2E`  
10. Uzun dekoratif başlık metni  

---

**Kaynak:** ROLET ürün notu + Samet karakter RET (vinyl-toy). Değişiklik için Samet / Game Art Director onayı.
