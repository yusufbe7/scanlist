/// Ilova bo'yicha global sozlamalar.
///
/// Supabase URL/anon key build vaqtida --dart-define bilan beriladi, masalan:
///   flutter run \
///     --dart-define=SUPABASE_URL=https://xxxx.supabase.co \
///     --dart-define=SUPABASE_ANON_KEY=eyJhbc...
///
/// Qiymat berilmasa, ilova ishga tushishda tushunarli xato ko'rsatadi
/// (README.md'dagi sozlash bo'limiga qarang).
class AppConfig {
  AppConfig._();

  static const String supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const String supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  static bool get isSupabaseConfigured => supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  /// Storage bucket nomi (supabase/schema.sql da yaratiladi)
  static const String receiptsBucket = 'receipts';

  /// Sotib olinadigan kredit to'plamlari (tarif rejalari).
  /// Narx so'mda, credits — beriladigan skan soni.
  static const List<CreditTariff> tariffs = [
    CreditTariff(amount: 15000, credits: 1000),
    CreditTariff(amount: 30000, credits: 3500),
  ];
}

class CreditTariff {
  final int amount;
  final int credits;

  const CreditTariff({required this.amount, required this.credits});
}
