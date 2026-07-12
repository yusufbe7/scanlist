class ScanItem {
  final String id;
  final String code;
  final int qty;
  final DateTime addedAt;

  const ScanItem({required this.id, required this.code, required this.qty, required this.addedAt});

  ScanItem copyWith({String? code, int? qty, DateTime? addedAt}) => ScanItem(
        id: id,
        code: code ?? this.code,
        qty: qty ?? this.qty,
        addedAt: addedAt ?? this.addedAt,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'code': code,
        'qty': qty,
        'addedAt': addedAt.toIso8601String(),
      };

  factory ScanItem.fromJson(Map<String, dynamic> json) => ScanItem(
        id: json['id'] as String,
        code: json['code'] as String,
        qty: json['qty'] as int,
        addedAt: DateTime.parse(json['addedAt'] as String),
      );
}
