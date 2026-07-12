# ScanList Mobile (Flutter)

Supermarket xodimlari uchun barcode skaner + ro'yxat ilovasi — endi **faqat mobil ilova** sifatida
(Dart/Flutter), kredit asosidagi to'lov tizimi va admin panel bilan.

## Asosiy funksiyalar

- 📷 Kamera orqali barcode skanerlash (EAN/UPC/CODE128/QR va h.k.), fonar tugmasi
- 📋 Bir nechta ro'yxat, miqdor (+1) avtomatik, dublikat tekshiruvi
- 🏷 Mahsulot bazasi — CSV/Excel yuklab, barcode → nom/narx moslashtirish (SQLite'da saqlanadi, yuz minglab qatorni qo'llab-quvvatlaydi)
- 📊 Excel (.xlsx), CSV, TXT eksport va ulashish
- 🌙 Tungi/kunduzgi rejim
- 💳 **Kredit tizimi**: ro'yxatdan o'tgach belgilangan sonda bepul skan, keyin kredit tugaydi
  - 15 000 so'm → 1 000 ta skan krediti
  - 30 000 so'm → 3 500 ta skan krediti
- 🧾 To'lov: foydalanuvchi ko'rsatilgan rekvizitga pul o'tkazadi, chek rasmini ilovaga yuklaydi
- 🛠 **Admin panel**: kutilayotgan to'lovlarni ko'rish, chekni ko'rish, tasdiqlash/rad etish (tasdiqlansa kredit avtomatik qo'shiladi), foydalanuvchilar ro'yxati, to'lov rekviziti/bepul limitni tahrirlash

## Arxitektura bo'yicha qabul qilingan qarorlar

Loyihani interaktiv aniqlashtirish (savol-javob) texnik sabablarga ko'ra ishlamagani uchun,
quyidagi qarorlar oqilona standart (va **keyinchalik osongina o'zgartiriladigan**) tarzda qabul qilindi:

| Masala | Qaror | Qayerda o'zgartiriladi |
|---|---|---|
| Backend | **Supabase** (web ilovada allaqachon ishlatilgan) — Auth, Postgres, Storage | `supabase/schema.sql` |
| Bepul skan limiti | Ro'yxatdan o'tgach **50 ta** bepul skan | Admin panel → Sozlamalar (`app_settings.free_scan_limit`), kod o'zgartirmasdan |
| To'lov rekviziti (karta raqami) | Placeholder (`0000 0000 0000 0000`) | Admin panel → Sozlamalar, kod o'zgartirmasdan |
| Repo tuzilishi | React web ilova saqlanib qoldi, Flutter ilovasi `mobile/` papkasida | — |

Agar bepul limit yoki repo tuzilishi boshqacha bo'lishi kerak bo'lsa, ayting — tezda moslashtiraman.

## Sozlash (birinchi marta)

### 1. Supabase loyihasi

1. [supabase.com](https://supabase.com) da yangi (bepul) loyiha oching.
2. **SQL Editor** bo'limida `supabase/schema.sql` faylini to'liq ko'chirib, ishga tushiring.
   Bu profillar, to'lovlar, sozlamalar jadvallarini, RLS siyosatlarini, `receipts` Storage bucket'ini
   va kerakli funksiyalarni yaratadi.
3. **Project Settings → API** bo'limidan **Project URL** va **anon public key**'ni oling.
4. Ilovani birinchi marta ishga tushirishdan oldin, oddiy foydalanuvchi sifatida ro'yxatdan o'ting,
   so'ng SQL Editor'da o'zingizni admin qilib tayinlang (faylning oxiridagi izohga qarang):

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'sizning-emailingiz@example.com');
   ```

### 2. Flutter muhiti

```bash
cd mobile
flutter pub get
```

### 3. Ishga tushirish

Supabase URL/key `--dart-define` orqali beriladi (kodga yozilmaydi — xavfsizroq):

```bash
flutter run \
  --dart-define=SUPABASE_URL=https://xxxxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. Release APK yig'ish

```bash
flutter build apk --release \
  --dart-define=SUPABASE_URL=https://xxxxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJhbGciOi...
```

APK: `build/app/outputs/flutter-apk/app-release.apk`

> **Eslatma:** Bu ilova ushbu (bulutli) muhitda Android SDK bo'lmagani sababli faqat
> `flutter analyze` (0 xato) va `flutter test` bilan tekshirildi — haqiqiy APK build/qurilmada
> sinov o'z kompyuteringizda Android SDK/Xcode o'rnatilgan holda qilinishi kerak.

## Loyiha tuzilishi

```
mobile/
  lib/
    config.dart          Supabase kalitlari, tarif rejalari (15000/1000, 30000/3500)
    models/               ScanItem, ScanListData, AppProfile, PaymentRecord, AppSettings...
    services/              Supabase bilan ishlash: auth, kredit, to'lov, admin, eksport, mahsulot bazasi
    state/                 ChangeNotifier provaiderlar (ro'yxatlar, mahsulot bazasi, tema)
    screens/
      auth/                Kirish / ro'yxatdan o'tish
      home/                Skaner, asosiy qobiq (bottom nav)
      lists/                Ro'yxat ko'rish/tahrirlash, ro'yxat almashtirish
      credits/              Kredit balans, tarif tanlash, chek yuklash, mening to'lovlarim
      admin/                Admin panel: to'lovlar, foydalanuvchilar, sozlamalar
      settings/             Mahsulot bazasi import, tema, chiqish
  supabase/
    schema.sql             To'liq SQL sxema (jadvallar, RLS, funksiyalar, storage)
```

## Kredit mantig'i (qisqacha)

1. Har bir muvaffaqiyatli skan `consume_scan_credit()` Postgres funksiyasini chaqiradi (atomik,
   poyga holatisiz).
2. Avval bepul limit (`app_settings.free_scan_limit`, standart 50) ishlatiladi, keyin sotib olingan
   kredit hisobidan yechiladi.
3. Ikkalasi ham tugasa, ilova "Kredit tugadi" oynasi bilan tarif tanlashga yo'naltiradi.
4. Foydalanuvchi tarif tanlaydi → rekvizitga pul o'tkazadi → chek rasmini yuklaydi → `payments`
   jadvaliga `pending` holatda yozuv qo'shiladi.
5. Admin panelda tasdiqlansa, Postgres trigger avtomatik kreditni foydalanuvchi profiliga qo'shadi;
   rad etilsa, sabab bilan qaytariladi. Foydalanuvchi UI'da bu real vaqtda (Supabase Realtime)
   yangilanadi.

## Xavfsizlik eslatmalari

- Admin roli endi (eski web versiyadagi kabi) qattiq kodlangan parol emas — `profiles.role = 'admin'`
  ustuni va Postgres RLS orqali serverda tekshiriladi.
- Oddiy foydalanuvchi o'zining `role`/`credits`/`free_scans_used` maydonlarini to'g'ridan-to'g'ri
  o'zgartira olmaydi — bu maxsus trigger orqali qulflangan (`protect_profile_privileged_fields`).
- Chek rasmlari xususiy Storage bucket'da (`receipts`), faqat egasi va adminlar ko'ra oladi.

## Texnologiyalar

Flutter 3 · Dart · Supabase (auth/postgres/storage/realtime) · mobile_scanner · sqflite · excel/csv ·
provider · image_picker · file_picker · share_plus
