import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/lists_provider.dart';

class ListSwitcherSheet extends StatelessWidget {
  const ListSwitcherSheet({super.key});

  Future<void> _createList(BuildContext context) async {
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Yangi ro'yxat"),
        content: TextField(controller: controller, decoration: const InputDecoration(hintText: 'Ro\'yxat nomi'), autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Bekor qilish')),
          FilledButton(onPressed: () => Navigator.pop(ctx, controller.text), child: const Text('Yaratish')),
        ],
      ),
    );
    if (name != null && context.mounted) {
      context.read<ListsProvider>().createList(name);
    }
  }

  Future<void> _rename(BuildContext context, String id, String currentName) async {
    final controller = TextEditingController(text: currentName);
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Ro'yxat nomini o'zgartirish"),
        content: TextField(controller: controller, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Bekor qilish')),
          FilledButton(onPressed: () => Navigator.pop(ctx, controller.text), child: const Text('Saqlash')),
        ],
      ),
    );
    if (name != null && name.trim().isNotEmpty && context.mounted) {
      context.read<ListsProvider>().renameList(id, name);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ListsProvider>();
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Text("Ro'yxatlar", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const Spacer(),
                IconButton(onPressed: () => _createList(context), icon: const Icon(Icons.add_circle_outline)),
              ],
            ),
            const Divider(),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: provider.lists.length,
                itemBuilder: (context, index) {
                  final list = provider.lists[index];
                  final isActive = list.id == provider.activeList.id;
                  return ListTile(
                    leading: Icon(isActive ? Icons.radio_button_checked : Icons.radio_button_off, color: isActive ? Theme.of(context).colorScheme.primary : null),
                    title: Text(list.name),
                    subtitle: Text('${list.items.length} ta mahsulot'),
                    onTap: () {
                      provider.switchList(list.id);
                      Navigator.pop(context);
                    },
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(icon: const Icon(Icons.edit_outlined, size: 20), onPressed: () => _rename(context, list.id, list.name)),
                        if (provider.lists.length > 1)
                          IconButton(
                            icon: const Icon(Icons.delete_outline, size: 20),
                            onPressed: () => provider.deleteList(list.id),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
