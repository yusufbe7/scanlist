import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../admin/admin_gate.dart';
import 'my_payments_screen.dart';
import 'tariff_screen.dart';

class CreditsScreen extends StatelessWidget {
  const CreditsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final profile = auth.profile;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Kredit')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [scheme.primary, scheme.tertiary]),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Joriy balans', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Text('${profile?.credits ?? 0} kredit', style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text('Bepul skanerlar: ${profile?.freeScansUsed ?? 0} ta ishlatilgan', style: const TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TariffScreen())),
            icon: const Icon(Icons.add_shopping_cart_rounded),
            label: const Text('Kredit sotib olish'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const MyPaymentsScreen())),
            icon: const Icon(Icons.receipt_long_outlined),
            label: const Text("Mening to'lovlarim"),
          ),
          if (auth.isAdmin) ...[
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminGate())),
              icon: const Icon(Icons.admin_panel_settings_outlined),
              label: const Text('Admin panel'),
            ),
          ],
        ],
      ),
    );
  }
}
