# Armür Maliyet (Mobil PWA)

Tekstil/kumaş sektörü için, tamamen **tarayıcıda çalışan** (sunucu yok) bir kumaş maliyet hesaplayıcısı. Telefonda 5 adımlı bir sihirbazla iplik + işçilik + terbiye + fire + ek + kâr kalemlerini birleştirerek **$/mt** maliyetini verir.

- **Tam client-side.** Backend, API, DB yok.
- **PWA.** "Ana ekrana ekle" ile uygulama gibi açılır; service worker app shell'i önbelleğe alır, **çevrimdışı çalışır**.
- **Kayıtlar** tarayıcıdaki `localStorage`'ta tutulur (anahtar: `armur.mobile.records`). Cihazdan cihaza otomatik sync yok.
- **Framework yok, build yok.** Vanilla HTML/CSS/JS.

## Dosyalar

| Dosya | İşlev |
|---|---|
| `index.html` | 5 adımlı wizard iskeleti |
| `mobile.css` | Mobil stil, dark mode, bottom-sheet, toast |
| `mobile.js` | State, validation, wizard akışı, localStorage |
| `formulas-client.js` | `tukH` ve `calcBreakdown` hesap motoru |
| `constants.js` | `FPD` formül sabitleri (UMD) |
| `mobile-sw.js` | Service worker (cache sürümü `armur-v1`) |
| `mobile-manifest.webmanifest` | PWA manifesti |
| `mobile-icon.svg` | Uygulama ikonu (mavi, dokuma + $) |

## Yerelde çalıştırma

Sayısal dosya servisine ihtiyaç var — `file://` ile service worker ve manifest çalışmaz.

```bash
python3 -m http.server 8000
# veya
npx serve .
```

Tarayıcıdan `http://localhost:8000/` adresine gidin.

## GitHub Pages'e deploy

1. GitHub'da yeni **public** bir repo açın.
2. Bu klasörü oraya push edin:
   ```bash
   git remote add origin https://github.com/<kullanıcı>/<repo>.git
   git push -u origin main
   ```
3. Repo → **Settings → Pages**.
4. **Source:** `Deploy from a branch`; **Branch:** `main`; **Folder:** `/ (root)`.
5. Birkaç dakika sonra `https://<kullanıcı>.github.io/<repo>/` yayında olur.

> Tüm yollar göreli (`./…`) tanımlı, alt-dizinde yayınlansa da çalışır.

## Netlify'a deploy (alternatif)

1. Netlify → **Add new site → Import from Git**.
2. Repoyu seçin. Build ayarı **gerekmiyor** (boş bırakın, publish directory `.`).
3. Deploy sonrası özel domain veya `*.netlify.app` URL'sini açın.

Netlify private repolarla da ücretsiz çalışır.

## Service worker cache sürümü

`mobile-sw.js` içindeki sabit:

```js
const CACHE = 'armur-v1';
```

**Her dosya güncellediğinizde** bu sürümü artırın (`'armur-v2'`, `'armur-v3'`, …). Aksi halde tarayıcılar eski shell'i kullanmaya devam eder ve değişiklikler kullanıcılara gitmez.

Service worker *network-first, cache fallback* stratejisi kullanır: ağ varsa güncel dosya gelir, yoksa önbellekteki shell ile offline açılır.

## Kayıtlar nerede tutulur?

Tarayıcıda `localStorage` altında:

```
anahtar:  armur.mobile.records
değer:    JSON array [{ id, name, fis, iplikler, total, createdAt, updatedAt }, ...]
```

Silmek için:
- Uygulama içinden 📁 Kayıtlar → çöp kutusu.
- Ya da tarayıcının site verilerini temizleyin.

Farklı cihazlar arası senkronizasyon yoktur.

## Hesap formülü

İplik gramajı (tek iplik, g/mt):

| Numara | Formül |
|---|---|
| DENYE | `(tel / (9000/den)) * kat * fak` |
| DTEX  | `(tel / (10000/den)) * kat * fak` |
| NM    | `(tel / (den/kat)) * fak` |
| NE    | `tel / (1.69*den/kat) * fak` |

Toplam ($/mt):

```
binD  = aSik<12 ? (12-aSik)*1000 + 7000 : 7000
uAy   = devir*60*24*26/100/aSik * (randiman/100)
fasI  = (binD/uAy) * 1.10     (işçilik)
terbM = gramaj/1000 * terbiyeFiyat
fireM = (iplik + fasI + terbM) * genelFire/100
total = iplik + fasI + terbM + kursum + ekMal + fireM + kar
```

## Kapsam dışı (v1)

- Çoklu kullanıcı / login
- Backend / API / SQL
- Tarak-tahar diyagramı, içerik raporu, Excel export
- Master iplik katalog seçimi
- Çoklu cihaz senkronizasyonu

## Lisans

Özel proje. Kullanım hakkı sahibine aittir.
