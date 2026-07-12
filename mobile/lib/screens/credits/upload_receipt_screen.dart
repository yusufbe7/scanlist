import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../config.dart';
import '../../models/app_settings.dart';
import '../../services/payment_service.dart';
import '../../services/settings_service.dart';
import 'my_payments_screen.dart';

class UploadReceiptScreen extends StatefulWidget {
  final CreditTariff tariff;

  const UploadReceiptScreen({super.key, required this.tariff});

  @override
  State<UploadReceiptScreen> createState() => _UploadReceiptScreenState();
}

class _UploadReceiptScreenState extends State<UploadReceiptScreen> {
  final _settingsService = SettingsService();
  final _paymentService = PaymentService();
  final _picker = ImagePicker();

  AppSettings? _settings;
  File? _receipt;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final settings = await _settingsService.fetch();
    if (mounted) setState(() => _settings = settings);
  }

  Future<void> _pickImage(ImageSource source) async {
    final file = await _picker.pickImage(source: source, imageQuality: 85);
    if (file != null) setState(() => _receipt = File(file.path));
  }

  Future<void> _submit() async {
    if (_receipt == null) return;
    setState(() => _submitting = true);
    try {
      await _paymentService.submitPayment(tariff: widget.tariff, receiptImage: _receipt!);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("To'lov yuborildi! Admin tasdiqlashini kuting.")),
      );
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const MyPaymentsScreen()));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Xatolik: $e")));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.decimalPattern('uz');
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text("To'lov")),
      body: _settings == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(Icons.receipt_rounded, color: scheme.primary),
                        const SizedBox(width: 12),
                        Text(
                          '${formatter.format(widget.tariff.credits)} kredit  ·  ${formatter.format(widget.tariff.amount)} so\'m',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text("1-qadam: to'lovni amalga oshiring", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _requisiteRow('Karta raqami', _settings!.paymentCardNumber),
                        _requisiteRow('Karta egasi', _settings!.paymentCardOwner),
                        if ((_settings!.paymentPhone ?? '').isNotEmpty) _requisiteRow('Click / Payme', _settings!.paymentPhone!),
                        const SizedBox(height: 8),
                        Text(
                          "Yuqoridagi rekvizitga ${formatter.format(widget.tariff.amount)} so'm o'tkazing.",
                          style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text("2-qadam: chek rasmini yuklang", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                if (_receipt != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.file(_receipt!, height: 220, width: double.infinity, fit: BoxFit.cover),
                  ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickImage(ImageSource.camera),
                        icon: const Icon(Icons.camera_alt_outlined),
                        label: const Text('Kamera'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickImage(ImageSource.gallery),
                        icon: const Icon(Icons.photo_library_outlined),
                        label: const Text('Galereya'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: (_receipt == null || _submitting) ? null : _submit,
                  child: _submitting
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Adminga yuborish'),
                ),
              ],
            ),
    );
  }

  Widget _requisiteRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(width: 110, child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600))),
          Expanded(
            child: SelectableText(value, style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}
