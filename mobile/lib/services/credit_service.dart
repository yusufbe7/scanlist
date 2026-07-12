import 'package:supabase_flutter/supabase_flutter.dart';

class ScanCreditResult {
  final bool allowed;
  final String? reason; // 'no_credits' | 'no_profile'
  final String? source; // 'free' | 'credit'
  final int? freeScansUsed;
  final int? freeScanLimit;
  final int? credits;

  const ScanCreditResult({
    required this.allowed,
    this.reason,
    this.source,
    this.freeScansUsed,
    this.freeScanLimit,
    this.credits,
  });

  factory ScanCreditResult.fromMap(Map<String, dynamic> map) => ScanCreditResult(
        allowed: map['allowed'] as bool,
        reason: map['reason'] as String?,
        source: map['source'] as String?,
        freeScansUsed: (map['free_scans_used'] as num?)?.toInt(),
        freeScanLimit: (map['free_scan_limit'] as num?)?.toInt(),
        credits: (map['credits'] as num?)?.toInt(),
      );
}

/// Har bir skan uchun serverdagi `consume_scan_credit()` funksiyasini chaqiradi.
/// Bu bepul limit / kredit hisobini atomik (poyga holatisiz) kamaytiradi.
class CreditService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<ScanCreditResult> consumeScan() async {
    final result = await _client.rpc('consume_scan_credit');
    return ScanCreditResult.fromMap(Map<String, dynamic>.from(result as Map));
  }
}
