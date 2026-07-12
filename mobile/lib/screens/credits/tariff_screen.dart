import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../config.dart';
import 'upload_receipt_screen.dart';

class TariffScreen extends StatelessWidget {
  const TariffScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.decimalPattern('uz');
    return Scaffold(
      appBar: AppBar(title: const Text('Kredit sotib olish')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            "Tarifni tanlang, to'lovni amalga oshiring va chek rasmini yuklang. "
            "Admin tekshirib tasdiqlagach, kreditlar hisobingizga qo'shiladi.",
            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 20),
          ...AppConfig.tariffs.map((tariff) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _TariffCard(
                  tariff: tariff,
                  formatter: formatter,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => UploadReceiptScreen(tariff: tariff)),
                  ),
                ),
              )),
        ],
      ),
    );
  }
}

class _TariffCard extends StatelessWidget {
  final CreditTariff tariff;
  final NumberFormat formatter;
  final VoidCallback onTap;

  const _TariffCard({required this.tariff, required this.formatter, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: scheme.surfaceContainerHigh,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: scheme.primaryContainer, borderRadius: BorderRadius.circular(16)),
                child: Icon(Icons.qr_code_scanner_rounded, color: scheme.onPrimaryContainer, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${formatter.format(tariff.credits)} ta skan krediti', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    const SizedBox(height: 4),
                    Text('${formatter.format(tariff.amount)} so\'m', style: TextStyle(color: scheme.primary, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded),
            ],
          ),
        ),
      ),
    );
  }
}
