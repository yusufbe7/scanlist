# ScanList 📦

Supermarket xodimlari uchun barcode scan va tayyor ro'yxat eksport qiluvchi PWA ilova.

## Ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda `http://localhost:5173` ochiladi. Kamera ishlashi uchun `localhost` yoki HTTPS kerak (mobil qurilmada test qilish uchun `npm run dev -- --host` bilan ochib, kompyuter bilan bir Wi-Fi'dagi telefondan IP orqali kiring, yoki ngrok/tunnel ishlating).

## Production build

```bash
npm run build
npm run preview
```

`dist/` papkasi istalgan static hosting'ga (Vercel, Netlify, Cloudflare Pages, oddiy nginx) joylanadi. PWA to'liq ishlashi uchun **HTTPS majburiy** (localhost bundan mustasno).

## Telefonga o'rnatish (PWA)

1. Saytni HTTPS orqali hosting qiling (masalan Vercel'ga bepul deploy).
2. Android: Chrome'da saytni oching → ⋮ menyu → **"Bosh ekranga qo'shish"**.
3. iPhone: Safari'da oching → Share → **"Add to Home Screen"**.
4. Ilova endi oddiy ilova kabi ochiladi, offline ishlaydi, kamera to'liq ruxsat bilan ishlaydi.

## Funksiyalar

- 📷 Kamera orqali barcode scan (EAN/UPC/CODE128/CODE39/QR) — uzluksiz va bitta-bitta rejim, kattaroq/aniqroq scan oynasi
- 🔦 Fonar (torch) tugmasi — qorong'i ombor/rastalarda yorug'lik yoqib scan qilish (qurilma qo'llab-quvvatlasa)
- 📋 Bir nechta ro'yxat (bo'lim/smena bo'yicha) — nomlash, almashish, alohida eksport
- 🔢 Miqdor (qty) — bir xil kod qayta scan qilinsa, avtomatik +1
- 🏷 Mahsulot bazasi — CSV/Excel yuklab, barcode → tovar kodi + nom + narx moslashtirish. **Yuz minglab qatorli fayllarni** ham qo'llab-quvvatlaydi (IndexedDB'da saqlanadi, localStorage cheklovidan xoli)
- ⚠️ Bazada topilmagan barcode'lar ro'yxatda alohida (sariq) belgilanadi, bir tegishda nom/narx qo'shish mumkin
- 📄 Word (.docx), 📊 Excel (.xlsx), 📋 TXT eksport — tovar kodi va nomi bilan birga
- 🌙 Tungi rejim, 🔠 katta shrift rejimi (ombor sharoiti uchun)
- 📴 To'liq offline ishlash
- ☁️ Ixtiyoriy bulutga sinxronizatsiya (quyida)
- 🛡 Xato yuz bersa oq/bo'sh ekran o'rniga qayta yuklash tugmasi chiqadi

## Mahsulot bazasi fayl formati

CSV yoki Excel fayl yuklang — ustunlar **avtomatik aniqlanadi**, lotin/o'zbek/rus tilidagi nomlarni tushunadi:

| Kerakli maydon | Tanilgan ustun nomlari |
|---|---|
| Barcode (majburiy) | `barcode`, `code`, `kod`, `gtin`, `Код GTIN`, `Код GTIN total`, `Ос.Штр.код`, `shtrix` |
| Nomi (majburiy) | `name`, `nomi`, `mahsulot`, `Название`, `Наименование` |
| Tovar kodi (ixtiyoriy) | `sku`, `tovar`, `Товар` |
| Narx (ixtiyoriy) | `price`, `narx`, `narxi`, `Цена` |

Fayldagi **barcha varaqlar (sheets)** avtomatik skanerlanadi va mos ustunlar bo'lgan har bir varaqdan ma'lumot olinadi — masalan SAP/1C'dan eksport qilingan `HELP` nomli katta varaq ham to'g'ridan-to'g'ri ishlaydi. Fayl bir marta yuklansa, qurilmada saqlanib qoladi — har safar qayta yuklash shart emas.

## Bulutga sinxronizatsiya (jamoaviy scan, Pro funksiya)

Bir necha xodim bir ro'yxatga birga scan qilishi uchun bepul [Supabase](https://supabase.com) loyihasi oching:

1. Supabase loyihasida SQL Editor'da quyidagini bajaring:

```sql
create table scanlist_lists (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  items jsonb not null default '[]'::jsonb
);
alter table scanlist_lists enable row level security;
create policy "public read/write demo" on scanlist_lists
  for all using (true) with check (true);
```

> Eslatma: yuqoridagi policy demo/jamoa uchun ochiq. Haqiqiy productionda `auth.uid()` orqali cheklang.

2. `.env.example` faylini `.env` deb nusxalab, Supabase loyihangizdagi **Project URL** va **anon public key**'ni kiriting.
3. Ilovani qayta ishga tushiring. Sozlamalar → "Bulutga sinxronizatsiya" bo'limida **Yuklash**/**Tortib olish** tugmalari faollashadi.

Sozlanmagan holatda ilova to'liq lokal (offline) rejimda ishlayveradi — hech narsa buzilmaydi.

## Texnologiyalar

React 18 · Vite 5 · TypeScript · Tailwind CSS · vite-plugin-pwa · html5-qrcode · docx · xlsx (SheetJS) · idb-keyval (IndexedDB) · Supabase (ixtiyoriy)

## iPhone'da kamera tezligi haqida

iOS Safari/WebKit'da `BarcodeDetector` native API'si qo'llab-quvvatlanmaydi (Android Chrome'dan farqli), shu sababli barcode aniqlash dasturiy (JS) usulda ishlaydi va biroz sekinroq bo'lishi mumkin. Tezlik va aniqlikni oshirish uchun:

- **Fonar tugmasidan foydalaning** — qorong'i/xira yorug'likda bu eng katta farq qiladi.
- Barcode'ni ramka ichida **to'liq va tekis** tuting, obyektga yaqinroq/uzoqroq turib fokusni sinab ko'ring (iPhone 14 Pro kamerasi masofaga qarab linza almashtiradi — biroz kutish kerak bo'lishi mumkin).
- Yorug' joyda scan qilish har doim tezroq va aniqroq natija beradi.

## Loyiha tuzilishi

```
src/
  components/     UI komponentlari
  context/         Global holat (ro'yxatlar, mahsulot bazasi, tema)
  hooks/           useToast va boshqa hook'lar
  lib/             export, storage, product-db parser, supabase client
  types.ts         TypeScript tiplari
```
