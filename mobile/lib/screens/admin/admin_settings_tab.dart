import 'package:flutter/material.dart';

import '../../models/app_settings.dart';
import '../../services/settings_service.dart';

class AdminSettingsTab extends StatefulWidget {
  const AdminSettingsTab({super.key});

  @override
  State<AdminSettingsTab> createState() => _AdminSettingsTabState();
}

class _AdminSettingsTabState extends State<AdminSettingsTab> {
  final _service = SettingsService();
  final _limitCtrl = TextEditingController();
  final _cardCtrl = TextEditingController();
  final _ownerCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final settings = await _service.fetch();
    _limitCtrl.text = settings.freeScanLimit.toString();
    _cardCtrl.text = settings.paymentCardNumber;
    _ownerCtrl.text = settings.paymentCardOwner;
    _phoneCtrl.text = settings.paymentPhone ?? '';
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await _service.update(
        freeScanLimit: int.tryParse(_limitCtrl.text) ?? AppSettings.fallback.freeScanLimit,
        paymentCardNumber: _cardCtrl.text.trim(),
        paymentCardOwner: _ownerCtrl.text.trim(),
        paymentPhone: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saqlandi')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Bepul limit', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        TextField(
          controller: _limitCtrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Ro\'yxatdan o\'tgach nechta bepul skan'),
        ),
        const SizedBox(height: 24),
        Text('To\'lov rekviziti', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text(
          'Foydalanuvchilar ilovada shu ma\'lumotni ko\'radi va shu raqamga pul o\'tkazadi.',
          style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 13),
        ),
        const SizedBox(height: 8),
        TextField(controller: _cardCtrl, decoration: const InputDecoration(labelText: 'Karta raqami')),
        const SizedBox(height: 12),
        TextField(controller: _ownerCtrl, decoration: const InputDecoration(labelText: 'Karta egasi (F.I.Sh.)')),
        const SizedBox(height: 12),
        TextField(controller: _phoneCtrl, decoration: const InputDecoration(labelText: 'Click/Payme raqami (ixtiyoriy)')),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Saqlash'),
        ),
      ],
    );
  }
}
