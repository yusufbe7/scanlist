import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../models/scan_item.dart';
import '../models/scan_list.dart';

/// Ro'yxatlar (bo'lim/smena bo'yicha) qurilmada lokal saqlanadi — internet shart emas.
class ScanListService {
  static const _keyLists = 'scanlist.lists';
  static const _keyActiveId = 'scanlist.activeListId';
  final _uuid = const Uuid();

  Future<List<ScanListData>> loadLists() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyLists);
    if (raw == null) return [];
    final decoded = jsonDecode(raw) as List;
    return decoded.map((e) => ScanListData.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<String?> loadActiveListId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyActiveId);
  }

  Future<void> saveLists(List<ScanListData> lists) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyLists, jsonEncode(lists.map((e) => e.toJson()).toList()));
  }

  Future<void> saveActiveListId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyActiveId, id);
  }

  ScanListData makeDefaultList({String name = "Ro'yxat 1"}) => ScanListData(
        id: _uuid.v4(),
        name: name,
        createdAt: DateTime.now(),
        items: const [],
      );

  ScanListData makeList(String name) => ScanListData(
        id: _uuid.v4(),
        name: name,
        createdAt: DateTime.now(),
        items: const [],
      );

  ScanItem makeItem(String code) => ScanItem(id: _uuid.v4(), code: code, qty: 1, addedAt: DateTime.now());
}
