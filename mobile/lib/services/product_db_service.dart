import 'dart:io';

import 'package:csv/csv.dart';
import 'package:excel/excel.dart' as xls;
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

import '../models/product_info.dart';

const _barcodeKeys = [
  'barcode', 'code', 'kod', 'gtin', 'код gtin', 'код gtin total', 'штрих', 'штрихкод', 'ос.штр.код', 'ос.штрих.код', 'shtrix',
];
const _skuKeys = ['sku', 'tovar', 'товар', 'maxsulot kodi', 'mahsulot kodi'];
const _nameKeys = ['name', 'nomi', 'mahsulot', 'название', 'наименование'];
const _priceKeys = ['price', 'narx', 'narxi', 'цена'];

int _findKey(List<String> header, List<String> candidates) {
  for (var i = 0; i < header.length; i++) {
    if (candidates.contains(header[i])) return i;
  }
  return -1;
}

class ProductImportResult {
  final int count;
  final int sheets;

  const ProductImportResult({required this.count, required this.sheets});
}

/// Mahsulot bazasi (barcode -> nom/narx) juda katta (yuz minglab qator) bo'lishi
/// mumkinligi uchun SQLite'da (indekslangan) saqlanadi, RAM'da emas.
class ProductDbService {
  static Database? _db;

  Future<Database> _database() async {
    if (_db != null) return _db!;
    final dbPath = await getDatabasesPath();
    _db = await openDatabase(
      p.join(dbPath, 'product_db.sqlite'),
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          create table products (
            barcode text primary key,
            name text not null,
            sku text,
            price real
          )
        ''');
      },
    );
    return _db!;
  }

  Future<ProductInfo?> lookup(String barcode) async {
    final db = await _database();
    final rows = await db.query('products', where: 'barcode = ?', whereArgs: [barcode], limit: 1);
    if (rows.isEmpty) return null;
    final row = rows.first;
    return ProductInfo(
      name: row['name'] as String,
      price: row['price'] as double?,
      sku: row['sku'] as String?,
    );
  }

  Future<int> count() async {
    final db = await _database();
    final result = await db.rawQuery('select count(*) as c from products');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<void> clear() async {
    final db = await _database();
    await db.delete('products');
  }

  Future<void> upsertSingle({required String barcode, required String name, double? price, String? sku}) async {
    final db = await _database();
    await db.insert(
      'products',
      {'barcode': barcode, 'name': name, 'price': price, 'sku': sku},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// CSV yoki XLSX faylni o'qiydi, har bir varaqda barcode+nom ustunlarini
  /// avtomatik topadi (o'zbek/rus/ingliz nomlar) va bazaga yozadi.
  Future<ProductImportResult> importFile(File file) async {
    final ext = p.extension(file.path).toLowerCase();
    final List<List<List<dynamic>>> sheets;

    if (ext == '.csv' || ext == '.txt') {
      final content = await file.readAsString();
      final rows = const CsvToListConverter(eol: '\n', shouldParseNumbers: false).convert(content);
      sheets = [rows];
    } else {
      final bytes = await file.readAsBytes();
      final workbook = xls.Excel.decodeBytes(bytes);
      sheets = workbook.tables.values
          .map((table) => table.rows
              .map((row) => row.map((cell) => cell?.value ?? '').toList())
              .toList())
          .toList();
    }

    final db = await _database();
    var totalCount = 0;
    var usableSheets = 0;

    for (final rows in sheets) {
      if (rows.isEmpty) continue;

      var headerIdx = -1;
      var barcodeCol = -1;
      var skuCol = -1;
      var nameCol = -1;
      var priceCol = -1;

      for (var r = 0; r < rows.length && r < 5; r++) {
        final header = rows[r].map((v) => v.toString().trim().toLowerCase()).toList();
        final bIdx = _findKey(header, _barcodeKeys);
        final nIdx = _findKey(header, _nameKeys);
        if (bIdx != -1 && nIdx != -1) {
          headerIdx = r;
          barcodeCol = bIdx;
          nameCol = nIdx;
          skuCol = _findKey(header, _skuKeys);
          priceCol = _findKey(header, _priceKeys);
          break;
        }
      }

      if (headerIdx == -1) continue;
      usableSheets++;

      var batch = db.batch();
      var pending = 0;

      for (var r = headerIdx + 1; r < rows.length; r++) {
        final row = rows[r];
        if (barcodeCol >= row.length || nameCol >= row.length) continue;
        final code = row[barcodeCol].toString().trim();
        final name = row[nameCol].toString().trim();
        if (code.isEmpty || name.isEmpty) continue;

        final sku = (skuCol != -1 && skuCol < row.length) ? row[skuCol].toString().trim() : null;
        double? price;
        if (priceCol != -1 && priceCol < row.length) {
          price = double.tryParse(row[priceCol].toString().replaceAll(',', '.'));
          if (price != null && price <= 0) price = null;
        }

        batch.insert(
          'products',
          {'barcode': code, 'name': name, 'sku': (sku?.isEmpty ?? true) ? null : sku, 'price': price},
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
        totalCount++;
        pending++;

        // Juda katta fayllarda xotira portlamasligi uchun bosqichma-bosqich commit
        if (pending >= 2000) {
          await batch.commit(noResult: true);
          batch = db.batch();
          pending = 0;
        }
      }
      if (pending > 0) {
        await batch.commit(noResult: true);
      }
    }

    return ProductImportResult(count: totalCount, sheets: usableSheets);
  }
}
