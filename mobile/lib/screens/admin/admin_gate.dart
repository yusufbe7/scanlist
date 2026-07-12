import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import 'admin_dashboard.dart';

/// Admin panelga faqat profiles.role = 'admin' bo'lgan foydalanuvchilar kira oladi
/// (Supabase RLS ham buni serverda mustaqil ravishda ta'minlaydi).
class AdminGate extends StatelessWidget {
  const AdminGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    if (!auth.isAdmin) {
      return Scaffold(
        appBar: AppBar(title: const Text('Admin panel')),
        body: const Center(child: Text('Sizda ruxsat yo\'q')),
      );
    }
    return const AdminDashboard();
  }
}
