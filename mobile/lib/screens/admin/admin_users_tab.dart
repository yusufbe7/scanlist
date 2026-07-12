import 'package:flutter/material.dart';

import '../../models/app_profile.dart';
import '../../services/admin_service.dart';

class AdminUsersTab extends StatefulWidget {
  const AdminUsersTab({super.key});

  @override
  State<AdminUsersTab> createState() => _AdminUsersTabState();
}

class _AdminUsersTabState extends State<AdminUsersTab> {
  final _service = AdminService();
  late Future<List<AppProfile>> _future;
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _future = _service.listProfiles();
  }

  void _search() {
    setState(() => _future = _service.listProfiles(search: _searchCtrl.text));
  }

  Future<void> _adjustCredits(AppProfile profile) async {
    final controller = TextEditingController();
    final deltaText = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(profile.fullName ?? 'Foydalanuvchi'),
        content: TextField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(signed: true),
          decoration: const InputDecoration(hintText: 'Masalan: 100 yoki -50'),
          autofocus: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Bekor qilish')),
          FilledButton(onPressed: () => Navigator.pop(ctx, controller.text), child: const Text('Qo\'llash')),
        ],
      ),
    );
    final delta = int.tryParse((deltaText ?? '').trim());
    if (delta == null || delta == 0) return;
    await _service.addCredits(profile.id, delta);
    _search();
  }

  Future<void> _toggleAdmin(AppProfile profile) async {
    final newRole = profile.isAdmin ? 'user' : 'admin';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Rolni o\'zgartirish'),
        content: Text(profile.isAdmin ? 'Admin huquqini olib tashlanaymi?' : 'Admin huquqi beriladimi?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Bekor qilish')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Tasdiqlash')),
        ],
      ),
    );
    if (ok == true) {
      await _service.setRole(profile.id, newRole);
      _search();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              hintText: 'Ism yoki telefon bo\'yicha qidirish',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(icon: const Icon(Icons.arrow_forward), onPressed: _search),
            ),
            onSubmitted: (_) => _search(),
          ),
        ),
        Expanded(
          child: FutureBuilder<List<AppProfile>>(
            future: _future,
            builder: (context, snapshot) {
              if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
              final users = snapshot.data!;
              if (users.isEmpty) return const Center(child: Text('Foydalanuvchi topilmadi'));
              return ListView.builder(
                itemCount: users.length,
                itemBuilder: (context, index) {
                  final user = users[index];
                  return ListTile(
                    leading: CircleAvatar(child: Text((user.fullName?.isNotEmpty == true ? user.fullName![0] : '?').toUpperCase())),
                    title: Text(user.fullName?.isNotEmpty == true ? user.fullName! : 'Nomsiz foydalanuvchi'),
                    subtitle: Text('${user.phone ?? ''}  ·  ${user.credits} kredit  ·  ${user.isAdmin ? 'Admin' : 'Foydalanuvchi'}'),
                    trailing: PopupMenuButton<String>(
                      onSelected: (value) {
                        if (value == 'credits') _adjustCredits(user);
                        if (value == 'role') _toggleAdmin(user);
                      },
                      itemBuilder: (ctx) => [
                        const PopupMenuItem(value: 'credits', child: Text('Kredit qo\'shish/ayirish')),
                        PopupMenuItem(value: 'role', child: Text(user.isAdmin ? 'Admin huquqini olish' : 'Admin qilish')),
                      ],
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
