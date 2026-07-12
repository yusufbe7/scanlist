import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/scan_item.dart';
import '../../services/export_service.dart';
import '../../state/lists_provider.dart';
import '../../state/product_db_provider.dart';
import 'list_switcher_sheet.dart';

class ListScreen extends StatelessWidget {
  const ListScreen({super.key});

  Future<void> _confirmClear(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Ro'yxatni tozalash"),
        content: const Text("Barcha elementlar o'chiriladi. Davom etasizmi?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Bekor qilish')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text("O'chirish")),
        ],
      ),
    );
    if (ok == true && context.mounted) {
      context.read<ListsProvider>().clearActiveList();
    }
  }

  Future<void> _export(BuildContext context) async {
    final format = await showModalBottomSheet<ExportFormat>(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(padding: EdgeInsets.all(16), child: Text('Eksport formati', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
            ListTile(leading: const Icon(Icons.table_chart_outlined), title: const Text('Excel (.xlsx)'), onTap: () => Navigator.pop(ctx, ExportFormat.xlsx)),
            ListTile(leading: const Icon(Icons.grid_on_outlined), title: const Text('CSV'), onTap: () => Navigator.pop(ctx, ExportFormat.csv)),
            ListTile(leading: const Icon(Icons.notes_outlined), title: const Text('TXT'), onTap: () => Navigator.pop(ctx, ExportFormat.txt)),
          ],
        ),
      ),
    );
    if (format == null || !context.mounted) return;

    final listsProvider = context.read<ListsProvider>();
    final productDbProvider = context.read<ProductDbProvider>();
    final activeList = listsProvider.activeList;

    final productDb = <String, dynamic>{};
    for (final item in activeList.items) {
      final info = await productDbProvider.lookup(item.code);
      if (info != null) productDb[item.code] = info;
    }

    if (!context.mounted) return;
    await ExportService().export(list: activeList, productDb: Map.from(productDb), format: format);
  }

  @override
  Widget build(BuildContext context) {
    final listsProvider = context.watch<ListsProvider>();
    final activeList = listsProvider.activeList;

    return Scaffold(
      appBar: AppBar(
        title: GestureDetector(
          onTap: () => showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
            builder: (_) => const ListSwitcherSheet(),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Flexible(child: Text(activeList.name, overflow: TextOverflow.ellipsis)),
              const SizedBox(width: 4),
              const Icon(Icons.expand_more_rounded),
            ],
          ),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.ios_share_rounded), onPressed: activeList.items.isEmpty ? null : () => _export(context)),
          IconButton(icon: const Icon(Icons.delete_sweep_outlined), onPressed: activeList.items.isEmpty ? null : () => _confirmClear(context)),
        ],
      ),
      body: activeList.items.isEmpty
          ? _EmptyState()
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: activeList.items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = activeList.items[activeList.items.length - 1 - index];
                return _ScanItemTile(item: item);
              },
            ),
    );
  }
}

class _ScanItemTile extends StatelessWidget {
  final ScanItem item;

  const _ScanItemTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final productDb = context.watch<ProductDbProvider>();
    return FutureBuilder(
      future: productDb.lookup(item.code),
      builder: (context, snapshot) {
        final info = snapshot.data;
        final known = info != null;
        return Card(
          color: known ? null : Theme.of(context).colorScheme.tertiaryContainer.withValues(alpha: 0.5),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        info?.name ?? "Bazada topilmadi",
                        style: const TextStyle(fontWeight: FontWeight.w700),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(item.code, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 12)),
                      if (info?.price != null) Text('${info!.price!.toStringAsFixed(0)} so\'m', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontSize: 12)),
                    ],
                  ),
                ),
                _QtyStepper(item: item),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => context.read<ListsProvider>().deleteItem(item.id),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _QtyStepper extends StatelessWidget {
  final ScanItem item;

  const _QtyStepper({required this.item});

  @override
  Widget build(BuildContext context) {
    final listsProvider = context.read<ListsProvider>();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: const Icon(Icons.remove_circle_outline),
          onPressed: () => listsProvider.updateItem(item.id, qty: item.qty - 1),
        ),
        SizedBox(width: 28, child: Text('${item.qty}', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w700))),
        IconButton(
          icon: const Icon(Icons.add_circle_outline),
          onPressed: () => listsProvider.updateItem(item.id, qty: item.qty + 1),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inbox_outlined, size: 64, color: Theme.of(context).colorScheme.outline),
          const SizedBox(height: 12),
          Text("Ro'yxat bo'sh", style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
          const SizedBox(height: 4),
          Text('Skaner orqali mahsulot qo\'shing', style: TextStyle(color: Theme.of(context).colorScheme.outline, fontSize: 13)),
        ],
      ),
    );
  }
}
