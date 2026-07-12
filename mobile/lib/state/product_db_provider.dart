import 'dart:io';

import 'package:flutter/foundation.dart';

import '../models/product_info.dart';
import '../services/product_db_service.dart';

class ProductDbProvider extends ChangeNotifier {
  final ProductDbService _service;

  ProductDbProvider(this._service);

  int productCount = 0;
  bool importing = false;
  String? lastImportSummary;

  Future<void> refreshCount() async {
    productCount = await _service.count();
    notifyListeners();
  }

  Future<void> importFile(File file) async {
    importing = true;
    notifyListeners();
    try {
      final result = await _service.importFile(file);
      lastImportSummary = "${result.count} ta mahsulot, ${result.sheets} ta varaqdan yuklandi";
      await refreshCount();
    } finally {
      importing = false;
      notifyListeners();
    }
  }

  Future<void> clear() async {
    await _service.clear();
    lastImportSummary = null;
    await refreshCount();
  }

  Future<void> setSingleProduct(String code, ProductInfo info) async {
    if (code.trim().isEmpty || info.name.trim().isEmpty) return;
    await _service.upsertSingle(barcode: code.trim(), name: info.name.trim(), price: info.price, sku: info.sku);
    notifyListeners();
  }

  Future<ProductInfo?> lookup(String barcode) => _service.lookup(barcode);
}
