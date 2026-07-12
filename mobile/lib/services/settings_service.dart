import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_settings.dart';

class SettingsService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<AppSettings> fetch() async {
    final row = await _client.from('app_settings').select().eq('id', 1).maybeSingle();
    if (row == null) return AppSettings.fallback;
    return AppSettings.fromMap(row);
  }

  Future<void> update({
    required int freeScanLimit,
    required String paymentCardNumber,
    required String paymentCardOwner,
    String? paymentPhone,
  }) async {
    await _client.from('app_settings').update({
      'free_scan_limit': freeScanLimit,
      'payment_card_number': paymentCardNumber,
      'payment_card_owner': paymentCardOwner,
      'payment_phone': paymentPhone,
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', 1);
  }
}
