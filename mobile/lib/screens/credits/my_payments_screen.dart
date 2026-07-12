import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/payment.dart';
import '../../services/payment_service.dart';
import '../../widgets/status_badge.dart';

class MyPaymentsScreen extends StatefulWidget {
  const MyPaymentsScreen({super.key});

  @override
  State<MyPaymentsScreen> createState() => _MyPaymentsScreenState();
}

class _MyPaymentsScreenState extends State<MyPaymentsScreen> {
  final _service = PaymentService();
  late Future<List<PaymentRecord>> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.myPayments();
  }

  Future<void> _refresh() async {
    setState(() => _future = _service.myPayments());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.decimalPattern('uz');
    final dateFormatter = DateFormat('dd.MM.yyyy HH:mm');

    return Scaffold(
      appBar: AppBar(title: const Text("Mening to'lovlarim")),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<PaymentRecord>>(
          future: _future,
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }
            final payments = snapshot.data!;
            if (payments.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 120),
                  Center(child: Text("Hali to'lovlar yo'q")),
                ],
              );
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
                            Text('${formatter.format(payment.credits)} kredit', style: const TextStyle(fontWeight: FontWeight.w800)),
                            const Spacer(),
                            StatusBadge(status: payment.status),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text('${formatter.format(payment.amount)} so\'m  ·  ${dateFormatter.format(payment.createdAt)}'),
                        if (payment.status == PaymentStatus.rejected && (payment.rejectReason ?? '').isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text('Sabab: ${payment.rejectReason}', style: const TextStyle(color: Colors.redAccent)),
                        ],
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
