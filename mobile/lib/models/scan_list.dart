import 'scan_item.dart';

class ScanListData {
  final String id;
  final String name;
  final DateTime createdAt;
  final List<ScanItem> items;

  const ScanListData({required this.id, required this.name, required this.createdAt, required this.items});

  ScanListData copyWith({String? name, List<ScanItem>? items}) => ScanListData(
        id: id,
        name: name ?? this.name,
        createdAt: createdAt,
        items: items ?? this.items,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'createdAt': createdAt.toIso8601String(),
        'items': items.map((e) => e.toJson()).toList(),
      };

  factory ScanListData.fromJson(Map<String, dynamic> json) => ScanListData(
        id: json['id'] as String,
        name: json['name'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        items: (json['items'] as List).map((e) => ScanItem.fromJson(e as Map<String, dynamic>)).toList(),
      );
}
