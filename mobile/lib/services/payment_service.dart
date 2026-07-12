import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../config.dart';
import '../models/payment.dart';

class PaymentService {
  final SupabaseClient _client = Supabase.instance.client;
  final _uuid = const Uuid();

  /// Chek rasmini Storage'ga yuklab, "pending" holatida to'lov yozuvi yaratadi.
  Future<void> submitPayment({
    required CreditTariff tariff,
    required File receiptImage,
  }) async {
    final userId = _client.auth.currentUser!.id;
    final ext = receiptImage.path.split('.').last;
    final path = '$userId/${_uuid.v4()}.$ext';

    await _client.storage.from(AppConfig.receiptsBucket).upload(path, receiptImage);

    await _client.from('payments').insert({
      'user_id': userId,
      'amount': tariff.amount,
      'credits': tariff.credits,
      'receipt_path': path,
      'status': 'pending',
    });
  }

  Future<String> receiptSignedUrl(String path) async {
    return _client.storage.from(AppConfig.receiptsBucket).createSignedUrl(path, 60 * 10);
  }

  Future<List<PaymentRecord>> myPayments() async {
    final userId = _client.auth.currentUser!.id;
    final rows = await _client
        .from('payments')
        .select()
        .eq('user_id', userId)
        .order('created_at', ascending: false);
    return (rows as List).map((e) => PaymentRecord.fromMap(e as Map<String, dynamic>)).toList();
  }

  /// Admin: barcha to'lovlar (foydalanuvchi ma'lumotlari bilan birga)
  Future<List<PaymentRecord>> allPayments({String? statusFilter}) async {
    var query = _client.from('payments').select('*, profiles(full_name, phone)');
    if (statusFilter != null) {
      query = query.eq('status', statusFilter);
    }
    final rows = await query.order('created_at', ascending: false);
    return (rows as List).map((e) => PaymentRecord.fromMap(e as Map<String, dynamic>)).toList();
  }

  Future<void> approve(String paymentId) async {
    await _client.from('payments').update({'status': 'approved'}).eq('id', paymentId);
  }

  Future<void> reject(String paymentId, String reason) async {
    await _client.from('payments').update({
      'status': 'rejected',
      'reject_reason': reason,
    }).eq('id', paymentId);
  }
}
