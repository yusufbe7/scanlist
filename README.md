# ScanList 📦

Supermarket xodimlari uchun barcode scan va tayyor ro'yxat eksport qiluvchi PWA ilova.

> 📱 **Mobil ilova.** Xuddi shu kredit/to'lov/admin tizimiga ega Flutter/Dart ilovasi `mobile/`
> papkasida joylashgan (ikkalasi ham bitta Supabase backendni ishlatadi). Batafsil:
> [`mobile/README.md`](mobile/README.md).

## ⚠️ Supabase endi majburiy

Ilova endi kirish (login) va kredit tizimi bilan ishlaydi, shu sababli **Supabase sozlanmasa
ilova ochilmaydi** ("Bulutga sinxronizatsiya" bo'limidagi eski ixtiyoriy `scanlist_lists`
jamoaviy-ro'yxat funksiyasidan farqli o'laroq). Birinchi ishga tushirishdan oldin quyidagi
"Kirish va kredit tizimi" bo'limiga qarang.

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
- 📴 Kirgandan keyin to'liq offline ishlaydi (skan/ro'yxat ma'lumotlari qurilmada saqlanadi)
- ☁️ Ixtiyoriy jamoaviy ro'yxat sinxronizatsiyasi (pastda, alohida funksiya)
- 🛡 Xato yuz bersa oq/bo'sh ekran o'rniga qayta yuklash tugmasi chiqadi
- 🔐 Email/parol bilan kirish, har bir foydalanuvchining o'z kredit balansi
- 💳 **Kredit tizimi**: ro'yxatdan o'tgach belgilangan sonda bepul skan (standart 50 ta, admin
  panelda o'zgartiriladi), keyin kredit tugaydi — 15 000 so'm → 1000 skan, 30 000 so'm → 3500 skan
- 🧾 To'lov: rekvizitga pul o'tkazib, chek rasmini ilovaga yuklash
- 🛠 **Admin panel**: to'lovlarni tasdiqlash/rad etish (tasdiqlansa kredit avtomatik qo'shiladi),
  foydalanuvchilar ro'yxati, to'lov rekviziti/bepul limitni tahrirlash

## Mahsulot bazasi fayl formati

CSV yoki Excel fayl yuklang — ustunlar **avtomatik aniqlanadi**, lotin/o'zbek/rus tilidagi nomlarni tushunadi:

| Kerakli maydon | Tanilgan ustun nomlari |
|---|---|
| Barcode (majburiy) | `barcode`, `code`, `kod`, `gtin`, `Код GTIN`, `Код GTIN total`, `Ос.Штр.код`, `shtrix` |
| Nomi (majburiy) | `name`, `nomi`, `mahsulot`, `Название`, `Наименование` |
| Tovar kodi (ixtiyoriy) | `sku`, `tovar`, `Товар` |
| Narx (ixtiyoriy) | `price`, `narx`, `narxi`, `Цена` |

Fayldagi **barcha varaqlar (sheets)** avtomatik skanerlanadi va mos ustunlar bo'lgan har bir varaqdan ma'lumot olinadi — masalan SAP/1C'dan eksport qilingan `HELP` nomli katta varaq ham to'g'ridan-to'g'ri ishlaydi. Fayl bir marta yuklansa, qurilmada saqlanib qoladi — har safar qayta yuklash shart emas.

## Kirish va kredit tizimi

1. [supabase.com](https://supabase.com) da yangi (bepul) loyiha oching — **web va mobil ilova bitta
   loyihani baham ko'rishi mumkin**.
2. SQL Editor'da [`mobile/supabase/schema.sql`](mobile/supabase/schema.sql) faylini to'liq ishga
   tushiring (profillar, to'lovlar, sozlamalar jadvallari, RLS, `receipts` Storage bucket).
3. `.env.example` faylini `.env` deb nusxalab, **Project URL** va **anon public key**'ni kiriting.
4. Ilovada oddiy foydalanuvchi sifatida ro'yxatdan o'ting, so'ng SQL Editor'da o'zingizni admin
   qilib tayinlang:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'sizning-emailingiz@example.com');
   ```

5. Ilovani qayta ishga tushiring — endi kirish (login) ekrani, kredit balansi (header'dagi 💎
   nishonchasi), "Kredit sotib olish" oynasi va (admin uchun) Admin panel ishlaydi.

To'lov rekviziti (karta raqami) va bepul limit kod o'zgartirmasdan, to'g'ridan-to'g'ri
**Admin panel → Sozlamalar** bo'limidan tahrirlanadi.

## Bulutga sinxronizatsiya (jamoaviy scan, alohida ixtiyoriy funksiya)

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
  components/
    auth/          Kirish / ro'yxatdan o'tish ekranlari
    credits/        Kredit balans, tarif tanlash, chek yuklash, to'lovlar tarixi
    admin/          Admin panel (to'lovlar, foydalanuvchilar, sozlamalar)
    ...             Skaner, ro'yxat, sozlamalar va boshqa UI komponentlari
  context/           Global holat (ro'yxatlar/mahsulot bazasi/tema + auth/profil)
  hooks/             useToast va boshqa hook'lar
  lib/               export, storage, product-db parser, supabase client,
                     credit/payment/admin/settings servislari
  types.ts           TypeScript tiplari
```
