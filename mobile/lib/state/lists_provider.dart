import 'package:flutter/foundation.dart';

import '../models/scan_list.dart';
import '../services/scan_list_service.dart';

class DuplicateInfo {
  final String code;
  final int existingQty;

  const DuplicateInfo({required this.code, required this.existingQty});
}

/// Ro'yxatlar va ularning skan qilingan elementlarini boshqaradi
/// (web ilovadagi AppContext'ning ro'yxat qismi bilan bir xil mantiq).
class ListsProvider extends ChangeNotifier {
  final ScanListService _service;

  ListsProvider(this._service);

  List<ScanListData> _lists = [];
  String? _activeListId;
  DuplicateInfo? pendingDuplicate;
  bool loading = true;

  List<ScanListData> get lists => _lists;

  ScanListData get activeList => _lists.firstWhere(
        (l) => l.id == _activeListId,
        orElse: () => _lists.first,
      );

  Future<void> load() async {
    var lists = await _service.loadLists();
    if (lists.isEmpty) {
      lists = [_service.makeDefaultList()];
    }
    _lists = lists;
    final storedActive = await _service.loadActiveListId();
    _activeListId = lists.any((l) => l.id == storedActive) ? storedActive : lists.first.id;
    loading = false;
    notifyListeners();
  }

  Future<void> _persist() async {
    await _service.saveLists(_lists);
    if (_activeListId != null) await _service.saveActiveListId(_activeListId!);
  }

  void _updateActiveList(ScanListData Function(ScanListData) updater) {
    _lists = _lists.map((l) => l.id == activeList.id ? updater(l) : l).toList();
    notifyListeners();
    _persist();
  }

  Future<void> createList([String? name]) async {
    final newList = _service.makeList(name?.trim().isNotEmpty == true ? name!.trim() : "Ro'yxat ${_lists.length + 1}");
    _lists = [..._lists, newList];
    _activeListId = newList.id;
    notifyListeners();
    await _persist();
  }

  void switchList(String id) {
    _activeListId = id;
    notifyListeners();
    _persist();
  }

  void renameList(String id, String name) {
    if (name.trim().isEmpty) return;
    _lists = _lists.map((l) => l.id == id ? l.copyWith(name: name.trim()) : l).toList();
    notifyListeners();
    _persist();
  }

  void deleteList(String id) {
    var next = _lists.where((l) => l.id != id).toList();
    if (next.isEmpty) next = [_service.makeDefaultList()];
    if (id == _activeListId) _activeListId = next.first.id;
    _lists = next;
    notifyListeners();
    _persist();
  }

  void clearActiveList() {
    _updateActiveList((l) => l.copyWith(items: const []));
  }

  /// true bo'lsa — yangi element qo'shildi. false bo'lsa — dublikat topildi,
  /// tasdiqlash uchun `pendingDuplicate` o'rnatildi (confirmDuplicateIncrement chaqiring).
  bool scan(String rawCode) {
    final code = rawCode.trim();
    if (code.isEmpty) return false;
    final existing = activeList.items.where((i) => i.code == code).toList();
    if (existing.isNotEmpty) {
      pendingDuplicate = DuplicateInfo(code: code, existingQty: existing.first.qty);
      notifyListeners();
      return false;
    }
    final item = _service.makeItem(code);
    _updateActiveList((l) => l.copyWith(items: [...l.items, item]));
    return true;
  }

  void confirmDuplicateIncrement() {
    final dup = pendingDuplicate;
    if (dup == null) return;
    _updateActiveList((l) => l.copyWith(
          items: l.items
              .map((i) => i.code == dup.code ? i.copyWith(qty: i.qty + 1, addedAt: DateTime.now()) : i)
              .toList(),
        ));
    pendingDuplicate = null;
    notifyListeners();
  }

  void dismissDuplicate() {
    pendingDuplicate = null;
    notifyListeners();
  }

  void updateItem(String id, {String? code, int? qty}) {
    _updateActiveList((l) => l.copyWith(
          items: l.items
              .map((i) => i.id == id
                  ? i.copyWith(
                      code: (code != null && code.trim().isNotEmpty) ? code.trim() : null,
                      qty: qty != null ? (qty < 1 ? 1 : qty) : null,
                    )
                  : i)
              .toList(),
        ));
  }

  void deleteItem(String id) {
    _updateActiveList((l) => l.copyWith(items: l.items.where((i) => i.id != id).toList()));
  }
}
