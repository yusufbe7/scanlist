import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../state/product_db_provider.dart';
import '../../state/theme_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  Future<void> _importProductDb(BuildContext context) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['csv', 'xlsx', 'xls', 'txt'],
    );
    if (result == null || result.files.single.path == null || !context.mounted) return;

    final provider = context.read<ProductDbProvider>();
    try {
      await provider.importFile(File(result.files.single.path!));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.lastImportSummary ?? 'Yuklandi')));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Xatolik: $e')));
      }
    }
  }

  Future<void> _confirmClearDb(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Mahsulot bazasini tozalash"),
        content: const Text("Yuklangan barcha mahsulotlar o'chiriladi. Davom etasizmi?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Bekor qilish')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text("O'chirish")),
        ],
      ),
    );
    if (ok == true && context.mounted) {
      await context.read<ProductDbProvider>().clear();
    }
  }

  Future<void> _confirmSignOut(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Chiqish'),
        content: const Text('Hisobingizdan chiqmoqchimisiz?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Bekor qilish')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Chiqish')),
        ],
      ),
    );
    if (ok == true && context.mounted) {
      await context.read<AuthService>().signOut();
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final productDb = context.watch<ProductDbProvider>();
    final auth = context.watch<AuthService>();

    return Scaffold(
      appBar: AppBar(title: const Text('Sozlamalar')),
      body: ListView(
        children: [
          _SectionHeader('Profil'),
          ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person_outline)),
            title: Text(auth.profile?.fullName?.isNotEmpty == true ? auth.profile!.fullName! : (auth.currentUser?.email ?? '')),
            subtitle: Text(auth.currentUser?.email ?? ''),
          ),
          _SectionHeader('Ko\'rinish'),
          SwitchListTile(
            secondary: const Icon(Icons.dark_mode_outlined),
            title: const Text('Tungi rejim'),
            value: themeProvider.mode == ThemeMode.dark,
            onChanged: (_) => themeProvider.toggle(),
          ),
          _SectionHeader('Mahsulot bazasi'),
          ListTile(
            leading: const Icon(Icons.upload_file_outlined),
            title: const Text('CSV/Excel yuklash'),
            subtitle: Text('${productDb.productCount} ta mahsulot saqlangan'),
            trailing: productDb.importing ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : null,
            onTap: productDb.importing ? null : () => _importProductDb(context),
          ),
          ListTile(
            leading: const Icon(Icons.delete_outline, color: Colors.redAccent),
            title: const Text('Bazani tozalash', style: TextStyle(color: Colors.redAccent)),
            onTap: productDb.productCount == 0 ? null : () => _confirmClearDb(context),
          ),
          _SectionHeader('Hisob'),
          ListTile(
            leading: const Icon(Icons.logout_rounded, color: Colors.redAccent),
            title: const Text('Chiqish', style: TextStyle(color: Colors.redAccent)),
            onTap: () => _confirmSignOut(context),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Text(
        title,
        style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w700, fontSize: 13),
      ),
    );
  }
}
