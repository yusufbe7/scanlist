import 'package:flutter/material.dart';

import 'admin_payments_tab.dart';
import 'admin_settings_tab.dart';
import 'admin_users_tab.dart';

class AdminDashboard extends StatelessWidget {
  const AdminDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Admin panel'),
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Kutilayotgan'),
              Tab(text: 'Barcha to\'lovlar'),
              Tab(text: 'Foydalanuvchilar'),
              Tab(text: 'Sozlamalar'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            AdminPaymentsTab(statusFilter: 'pending'),
            AdminPaymentsTab(),
            AdminUsersTab(),
            AdminSettingsTab(),
          ],
        ),
      ),
    );
  }
}
