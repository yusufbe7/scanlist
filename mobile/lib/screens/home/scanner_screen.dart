import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../../models/product_info.dart';
import '../../services/auth_service.dart';
import '../../services/credit_service.dart';
import '../../state/lists_provider.dart';
import '../../state/product_db_provider.dart';
import '../credits/tariff_screen.dart';
import '../lists/list_switcher_sheet.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final _controller = MobileScannerController(detectionSpeed: DetectionSpeed.noDuplicates);
  final _creditService = CreditService();

  bool _torchOn = false;
  bool _busy = false;
  int _sessionCount = 0;
  String? _lastCode;
  String? _lastName;
  DateTime? _lastScanAt;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_busy) return;
    final code = capture.barcodes.firstOrNull?.rawValue?.trim();
    if (code == null || code.isEmpty) return;

    // Bir xil kodni ketma-ket bir necha karra o'qib yubormaslik uchun qisqa debounce
    if (code == _lastCode && _lastScanAt != null && DateTime.now().difference(_lastScanAt!) < const Duration(seconds: 2)) {
      return;
    }

    setState(() => _busy = true);
    try {
      final result = await _creditService.consumeScan();
      if (!mounted) return;

      if (!result.allowed) {
        _showPaywall();
        return;
      }

      final listsProvider = context.read<ListsProvider>();
      final productDb = context.read<ProductDbProvider>();
      final info = await productDb.lookup(code);

      final added = listsProvider.scan(code);
      if (!added && listsProvider.pendingDuplicate != null) {
        await _confirmDuplicate(listsProvider, info);
      }

      setState(() {
        _sessionCount++;
        _lastCode = code;
        _lastName = info?.name;
        _lastScanAt = DateTime.now();
      });

      if (mounted) {
        _showFeedback(code, info);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _confirmDuplicate(ListsProvider listsProvider, ProductInfo? info) async {
    final dup = listsProvider.pendingDuplicate!;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Kod allaqachon ro\'yxatda'),
        content: Text(
          '${info?.name ?? dup.code}\nHozirgi miqdor: ${dup.existingQty} ta.\nMiqdorni +1 qilaymi?',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Bekor qilish')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('+1 qilish')),
        ],
      ),
    );
    if (confirm == true) {
      listsProvider.confirmDuplicateIncrement();
    } else {
      listsProvider.dismissDuplicate();
    }
  }

  void _showFeedback(String code, ProductInfo? info) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 2),
        content: Text(info != null ? '${info.name}  ·  $code' : 'Bazada topilmadi  ·  $code'),
      ),
    );
  }

  void _showPaywall() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.lock_clock_rounded, size: 40),
        title: const Text('Kredit tugadi'),
        content: const Text(
          "Bepul skanerlar va sotib olingan kreditlaringiz tugadi. Davom etish uchun kredit sotib oling.",
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Yopish')),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TariffScreen()));
            },
            child: const Text('Kredit sotib olish'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = context.watch<AuthService>().profile;
    final activeList = context.watch<ListsProvider>().activeList;

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error, child) => Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'Kameraga ruxsat kerak: ${error.errorDetails?.message ?? error.errorCode.name}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ),
          ),
          _buildScanFrame(),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildTopBar(context, profile, activeList.name),
                  const Spacer(),
                  if (_lastCode != null) _buildLastScanCard(),
                  const SizedBox(height: 12),
                  _buildBottomBar(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanFrame() {
    return Center(
      child: Container(
        width: 280,
        height: 200,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.white.withValues(alpha: 0.85), width: 2),
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context, dynamic profile, String listName) {
    final remainingText = profile == null
        ? '...'
        : profile.credits > 0
            ? "${profile.credits} kredit"
            : "bepul: ${profile.freeScansUsed}";
    return Row(
      children: [
        _glassChip(
          icon: Icons.list_alt_rounded,
          label: listName,
          onTap: () => showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
            builder: (_) => const ListSwitcherSheet(),
          ),
        ),
        const Spacer(),
        _glassChip(icon: Icons.diamond_rounded, label: remainingText),
      ],
    );
  }

  Widget _glassChip({required IconData icon, required String label, VoidCallback? onTap}) {
    return Material(
      color: Colors.black.withValues(alpha: 0.45),
      borderRadius: BorderRadius.circular(30),
      child: InkWell(
        borderRadius: BorderRadius.circular(30),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: Colors.white, size: 18),
              const SizedBox(width: 6),
              Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLastScanCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: Colors.greenAccent),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_lastName ?? _lastCode!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(_lastCode!, style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _glassChip(icon: Icons.qr_code_2_rounded, label: 'Sessiya: $_sessionCount'),
        Material(
          color: _torchOn ? Colors.amber : Colors.black.withValues(alpha: 0.45),
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: () async {
              await _controller.toggleTorch();
              setState(() => _torchOn = !_torchOn);
            },
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Icon(Icons.flash_on_rounded, color: _torchOn ? Colors.black : Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}

extension _FirstOrNull<T> on List<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
