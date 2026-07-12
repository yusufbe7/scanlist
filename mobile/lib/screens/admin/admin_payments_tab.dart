import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/payment.dart';
import '../../services/payment_service.dart';
import '../../widgets/status_badge.dart';

class AdminPaymentsTab extends StatefulWidget {
  final String? statusFilter;

  const AdminPaymentsTab({super.key, this.statusFilter});

  @override
  State<AdminPaymentsTab> createState() => _AdminPaymentsTabState();
}

class _AdminPaymentsTabState extends State<AdminPaymentsTab> {
  final _service = PaymentService();
  late Future<List<PaymentRecord>> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.allPayments(statusFilter: widget.statusFilter);
  }

  Future<void> _refresh() async {
    setState(() => _future = _service.allPayments(statusFilter: widget.statusFilter));
    await _future;
  }

  Future<void> _approve(PaymentRecord payment) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("To'lovni tasdiqlash"),
        content: Text('${payment.credits} kredit foydalanuvchi hisobiga qo\'shiladi. Davom etasizmi?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Bekor qilish')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Tasdiqlash')),
        ],
      ),
    );
    if (ok != true) return;
    await _service.approve(payment.id);
    if (mounted) _refresh();
  }

  Future<void> _reject(PaymentRecord payment) async {
    final controller = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Rad etish sababi'),
        content: TextField(controller: controller, decoration: const InputDecoration(hintText: 'Masalan: chek noaniq / summa mos emas'), autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Bekor qilish')),
          FilledButton(onPressed: () => Navigator.pop(ctx, controller.text), child: const Text('Rad etish')),
        ],
      ),
    );
    if (reason == null) return;
    await _service.reject(payment.id, reason.trim().isEmpty ? 'Sabab ko\'rsatilmagan' : reason.trim());
    if (mounted) _refresh();
  }

  Future<void> _viewReceipt(PaymentRecord payment) async {
    final url = await _service.receiptSignedUrl(payment.receiptPath);
    if (!mounted) return;
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        child: InteractiveViewer(child: Image.network(url)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.decimalPattern('uz');
    final dateFormatter = DateFormat('dd.MM.yyyy HH:mm');

    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<List<PaymentRecord>>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final payments = snapshot.data!;
          if (payments.isEmpty) {
            return ListView(children: const [SizedBox(height: 120), Center(child: Text("To'lovlar yo'q"))]);
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: payments.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final payment = payments[index];
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              payment.userFullName?.isNotEmpty == true ? payment.userFullName! : payment.userId,
                              style: const TextStyle(fontWeight: FontWeight.w700),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          StatusBadge(status: payment.status),
                        ],
                      ),
                      if ((payment.userPhone ?? '').isNotEmpty) Text(payment.userPhone!, style: const TextStyle(fontSize: 12)),
                      const SizedBox(height: 6),
                      Text('${formatter.format(payment.credits)} kredit  ·  ${formatter.format(payment.amount)} so\'m'),
                      Text(dateFormatter.format(payment.createdAt), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          OutlinedButton.icon(
                            onPressed: () => _viewReceipt(payment),
                            icon: const Icon(Icons.receipt_long_outlined, size: 18),
                            label: const Text('Chek'),
                          ),
                          const Spacer(),
                          if (payment.status == PaymentStatus.pending) ...[
                            IconButton(
                              onPressed: () => _reject(payment),
                              icon: const Icon(Icons.close_rounded, color: Colors.redAccent),
                              tooltip: 'Rad etish',
                            ),
                            FilledButton.icon(
                              onPressed: () => _approve(payment),
                              icon: const Icon(Icons.check_rounded, size: 18),
                              label: const Text('Tasdiqlash'),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
