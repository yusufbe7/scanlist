import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_profile.dart';

class AdminService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<List<AppProfile>> listProfiles({String? search}) async {
    var query = _client.from('profiles').select();
    if (search != null && search.trim().isNotEmpty) {
      query = query.or('full_name.ilike.%$search%,phone.ilike.%$search%');
    }
    final rows = await query.order('created_at', ascending: false);
    return (rows as List).map((e) => AppProfile.fromMap(e as Map<String, dynamic>)).toList();
  }

  Future<void> setRole(String userId, String role) async {
    await _client.from('profiles').update({'role': role}).eq('id', userId);
  }

  /// Admin qo'lda bonus kredit qo'shishi uchun (masalan chegirma/aksiya).
  Future<void> addCredits(String userId, int delta) async {
    await _client.rpc('admin_add_credits', params: {'p_user_id': userId, 'p_delta': delta});
  }
}
