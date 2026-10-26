# ROLET düellosuna devam

Bu dosya yeni bir makinedeki Grok oturumu içindir. Sohbet ve yerel notlar GitHub'a gelmez. Oyun kodu bu depodadır. Samet Türkçe bakar.

## Aç

```bash
git clone https://github.com/SmtDcs/rolet.git
cd rolet/apps/web
pnpm install
pnpm exec next dev -p 3456
```

Tarayıcı: http://localhost:3456/godot/index.html

Godot kaynağı `godot/`. Ana sahne `scenes/duel.tscn`. Motor 4.7.2, `gl_compatibility`, web'de threads kapalı. Dışa aktarma:

```bash
godot --headless --path godot --export-release "Web" apps/web/public/godot/index.html
```

Çıktıdan sonra adrese `?v=` ekle. Editör yoksa önizlemeyi tarayıcıda göster. Samet'ten editör açmasını isteme.

Kural testi:

```bash
godot --headless --path godot -s res://scripts/test_rules.gd
```

329 kontrol, 0 hata beklenir. `lib.rs` ile `scripts/rules.gd` aynı kuralları tutar.

## Dokunma

- `apps/server/programs/rolet/src/lib.rs` ve program kuralları değişmez.
- Cüzdan maçı Godot sahnesine bağlanmaz. İniş sayfası durur.
- Sır, anahtar, testnet yok. `~/.config/hackathon-os/env` repoya girmez.
- `bg.jpg` arka plan olmaz. `gun.png` kameraya yapışmaz. Meshy `gun.glb` / `character.glb` kullanılmaz.
- `DuelRoom3D` ve `BuckshotRoom` yeniden açılmaz.
- Ekranda yazı, SHOOT, CHAMBER, LIVES yok. Palto kutu olarak kalır.
- Onaylı silah pozları ve nişan geçişi (`_step_muzzle`, `_up_for`) yerinden oynamaz.
- Gizli göz sırası açılmaz. Tur başı tepsi sadece 5 kırmızı, sonra 3 gridir.

Sayılar zincirden: 4 can, 8 göz, 5 dolu / 3 boş, elde 4 kart, 12 kart tipi. Kart turu bitirmez. Boş mermi kendine sıkılırsa tur sende kalır.

## Şu an çalışan tur

Kod `godot/scripts/duel.gd`. Yerel önizleme, cüzdansız.

1. Tur başı tepsi çıkar, rakip silindiri yandan doldurur, silah masaya iner.
2. Kâğıda tıkla: öne gelir, etkisi olur, yırtılır. Elde silah varken kâğıtlar kararır.
3. Masadaki silaha tıkla, ele gelir.
4. Fare alt yarı: namlu boynun altında. Üst yarı: namlu rakibin göğsünde. Tık, o yarıya ateş eder. Geçiş sürerken tık yutulur.
5. Boş kendine: klik, silah masaya iner, tur sende.
6. Dolu kendine: bir kare beyaz, sonra siyah. Bir yakın lamba söner, tur gider.
7. Kalkan varken dolu atış alev çıkarır, can inmez, savrulma olmaz, tur gider.
8. Rakip kendine sıkarsa sıçrama bizim ekrana gelmez. Doluysa o savrulur.

Kartlar: Göz ve Yarık sadece sende delik gösterir. Kovan masaya düşer. Kalkan lambaları çakar. Artı sönmüş lambayı yakar. Sus, rakibin kâğıtlarını kilitler. Çift, namluda iki kıvılcım, gözü açmaz. Mermi, boş göze kırmızı girer ve o delik kırmızı kalır. Karıştır, silindiri döndürür, açık rengi söndürür. El, kâğıdı yelpazeye kaydırır. Son, rakibin lambalarını söndürüp yakar, canı değiştirmez. Yazı tura, pulu çevirir, yeni rengi göstermez.

## Pozlar

Hepsi `duel.gd` içinde. Rakibin silahı kamera çocuğu olmaz, düello kökünde kalır.

- Kendine: `_self_xf`, namlu alttan boyuna çıkar, delik göze bakmaz.
- Rakibe: `_rival_xf`, namlu göğsün ortasına, yan durmaz.
- Rakip kendine: `_rival_chin_xf`, namlu kafanın hemen altında, dik.
- Rakip bize: `_rival_at_us_xf`, göğüste, üç çeyrek, delik görünür.

Nişan geçişi namlu ağzını düz taşır. Tüm dönüşü kaydırmak namluyu bir kare dikilir. Bu geçiş onaylandı.
