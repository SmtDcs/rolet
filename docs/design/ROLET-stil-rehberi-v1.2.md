# ROLET — Stil Rehberi (v1.2)

**Oyun:** Solana tactical chamber duel · 8 hazne · 4 can · 12 kart  
**Kimlik:** 8 hazneli silindir + kâğıt kart + karanlık atölye.  
**Atmosfer kaynağı:** Buckshot Roulette (gerilim, crunchy masa/silindir) + Inscryption (kâğıt kart UI) — **klon değil**.  
**Kelime yasak:** “Roulette” (ürün metni, UI, prompt, sosyal) kullanılmaz.  
**Karakter (v1.2):** hafif karıncalı; **hunched** siluet; kaynak maskesi **tek yatay yuva**; yüz gölgede veya paper-cut. Horror-gore yok. Kasino dili yasak.  
**İptal:** vinyl-toy / chibi astronaut / EOD / jetpack (v1); düz “güzel” plastik karakter (Samet RET).

---

## 0. Klon uyarısı (bağlayıcı)

- Buckshot Roulette döngüsüne yakınsak bile **masa düzeni, ikonografi, yazı, silah markası, “roulette” kelimesi, chip/felt** alınmaz.
- Alınan: gerilim ritmi, mekanik tık, kirli atölye dokusu, silindir kahramanlığı.
- Alınmayan: birebir UI kopyası, aynı kart isimleri, aynı oda/masa kompozisyonu.
- Inscryption’tan: kâğıt/kartstock dil ve mühür hissi — occult kurban / kanlı sahne yok.
- Kimlik cümlesi (tek): **“8 chamber · paper card · dark workshop.”**

---

## 1. Renk paleti

| Rol | Ad | Hex | Kullanım |
|-----|-----|-----|----------|
| Zemin | Soot | `#141414` | En koyu zemin, vignette çekirdeği |
| Gövde | Gunmetal | `#1E2227` | UI / metal gövde |
| Yüzey | Graphite | `#2E333A` | Panel, kart mürekkep zemini |
| Ahşap | Oiled wood | `#3A2A1F` | Masa, tezgâh, silindir altlığı — ince yüzey |
| Kâğıt | Worn paper | `#C8BFA8` | **Yalnızca** kart/kâğıt yüzeyi, lekeli stok |
| Metin / temiz kâğıt | Bone | `#E6E1D6` | Tipografi, temiz kart alanı |
| Vurgu | Pirinç | `#B88A2E` | **Metallic** mühür, ince metal — hardal boya değil |
| Işık | Sodium | `#D9963A` | **Yalnızca** pratik ışık / ampul sıcaklığı — alan boyası değil |
| Doluluk | Signal | `#D2462B` | **Sadece dolu hazne** |
| Boşluk | Patina | `#3F7F74` | **Sadece boş hazne** |

**Worn paper krem kontrolü:** `#C8BFA8` krem–terracotta “luxury cream” değil; kirli, düşük doygunluklu stok.  
**İzin:** kart yüzü, yapıştırılmış not, kesik kâğıt kenarı.  
**Yasak:** tam ekran krem yıkama, terracotta gradient, “warm luxury” UI, sodium’u alan rengine çevirmek.

**Katı yasaklar:** mor, neon, krem–terracotta luxury, yeşil çuha, kasino, gore/kan, dişli kafatası.

**Oran (yaklaşık):** Soot/Gunmetal ~50% · Graphite ~20% · wood/paper ~15% · Bone ~8% · Pirinç ~4% · Sodium ışık ~2% · Signal/Patina ~1%.

---

## 2. Tipografi *(korunur)*

| Kullanım | Font | Ağırlık |
|----------|------|---------|
| Başlık | **Big Shoulders Display** Bold–Black | Kısa etiket; “Roulette” yok |
| Gövde | **IBM Plex Sans** Regular–Medium | |
| Sayılar | **IBM Plex Mono** Medium | Tabular |

Ölçek: başlık 28–40px · gövde 14–16px · mono 12–18px.

---

## 3. Hareket *(korunur)*

- Kademeli mekanik tık (~80–140ms, gecikme ~40–60ms).
- Yasak: fade-up, bounce, neon pulse, casino spin, sürekli glow.
- Hazne: Patina→Signal anlık + tek tık.

---

## 4. Teknik / post-process katmanı (oyun içi)

| Katman | Kural |
|--------|--------|
| Internal çözünürlük | **960×540** |
| Ölçekleme | **Nearest-neighbor** (bulanık upscale yok) |
| Renk | **Posterize 16–24** renk bandı |
| Dokü | Hafif **dither + film grain** (agresif noise yok) |
| Çerçeve | Hafif **vignette** (Soot’a çekilir) |
| HUD | **Keskin DOM katmanı** — posterize/grain uygulanmaz; tipografi temiz kalır |
| Dünya / karakter sprite | Post-process uygulanır |

Bu katman “oyun hissi”ni taşır; karakter concept görsellerinde hafif grain/vignette simüle edilebilir, HUD mock’ta uygulanmaz.

---

## 5. Karakter dili — uzlaştırma

**Tek siluet:** hafif **hunched** (Buckshot crunch), gövde öne eğik, kollar kısa.

**Yüz:** kaynak maskesi **tek yatay yuva** (nötr, tehditkâr diş yok). Yüz yuva arkasında gölgede veya paper-cut düz yüzey.

**Malzeme dili:** Inscryption **kâğıt kart / kesik illüstrasyon** + Buckshot **kirli atölye / silindir** — plastik vinyl toy yok.

**Kompozisyon:** figür kart parçası gibi okunur; arka planda masa/silindir crunchy olabilir ama karakter kendisi “oyuncak astronaut” olmaz.

---

## 6. Meshy prompt seti — karakter (EN)

Ortak negatif:  
`no vinyl toy, no chibi plastic, no astronaut helmet, no EOD armor, no jetpack, no neon, no purple, no green felt, no casino, no roulette, no poker chips, no gore, no blood, no skull teeth, no horror scream, no hyper-realistic skin, no luxury cream wash, no terracotta`

### A. Paper duelist *(şu an üretiliyor — değerlendirme kriteri)*
`Handmade paper-cut duelist, slightly hunched silhouette, welding mask with single horizontal eye slit, face in shadow behind slit, dark workshop tactical chamber duel, Buckshot Roulette tension without using the word roulette or casino imagery, Inscryption cardstock cutout feel, aged Worn paper #C8BFA8 edges, Gunmetal #1E2227 ink, Brass #B88A2E metallic wax seal, orthographic front, clean silhouette, slight film grain, no plastic toy, no astronaut`

### B. Workshop warden
`Printed playing-card warden, hunched paper figure, welding-mask single slit, Graphite ink hatching not armor, Bone #E6E1D6 and Worn paper #C8BFA8 stock, Brass #B88A2E stamp, calm tense, collage cutout, orthographic front, game UI card art, no roulette, no casino, no gore`

### C. Chamber attendant
`Minimal paper puppet attendant, hunched, Gunmetal flat-ink coat, Bone oval face with single thin horizontal visor slit, Brass #B88A2E dots, eerie calm, cut-paper, aged paper, orthographic front, no skull, no teeth, no plastic`

### Silindir (değişmez)
`8-chamber revolver cylinder UI hero, workshop steel Gunmetal #1E2227 Graphite recesses, Bone engraved indices, Brass #B88A2E metallic ring, chambers Signal #D2462B loaded or Patina #3F7F74 empty only, oiled wood #3A2A1F base OK, sodium #D9963A as single practical light only, no casino, no roulette word, orthographic product shot`

---

## 7. Paper duelist A — değerlendirme checklist

Görsel gelince işaretle:

1. Hunched mi, dik toy mu?  
2. Tek yatay kaynak yuvası mı, dişli kafatası mı?  
3. Paper-cut / kartstock mu, vinyl plastik mi?  
4. Worn paper yüzey OK mi (krem luxury yıkama yok mu)?  
5. Kasino / “roulette” / chip / felt yok mu?  
6. Posterize edilebilir siluet mi (çok ince çizgi patlaması yok mu)?  
7. HUD’a yapıştırılabilir kart oranı mı?

Çoğunluk geçmezse v1.2 notlarıyla ret + kısa prompt düzeltmesi.

---

## 8. Klişe yasak listesi

1. Casino / poker / chip / felt / “roulette” kelimesi  
2. Yeşil çuha, luxury cream yıkama, terracotta gradient  
3. Mor / neon / hologram  
4. Fade-up, bounce, neon pulse  
5. Vinyl-toy / astronaut / EOD / jetpack  
6. Gore, kan, dişli kafatası  
7. Signal/Patina hazne dışı; Sodium alan boyası  
8. Bulanık bilinear upscale (nearest-neighbor zorunlu)  
9. Grain’i HUD’a uygulamak  
10. Buckshot veya Inscryption’ı birebir klonlayan kompozisyon  

---

**Kaynak:** ROLET referans özeti + Samet karakter RET. Değişiklik: Samet / Game Art Director.
