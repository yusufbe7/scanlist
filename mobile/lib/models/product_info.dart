class ProductInfo {
  final String name;
  final double? price;
  final String? sku;

  const ProductInfo({required this.name, this.price, this.sku});

  Map<String, dynamic> toJson() => {'name': name, 'price': price, 'sku': sku};

  factory ProductInfo.fromJson(Map<String, dynamic> json) => ProductInfo(
        name: json['name'] as String,
        price: (json['price'] as num?)?.toDouble(),
        sku: json['sku'] as String?,
      );
}
