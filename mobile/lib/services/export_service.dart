import 'dart:io';

import 'package:excel/excel.dart' as xls;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart' show Share, XFile;

import '../models/product_info.dart';
import '../models/scan_list.dart';

enum ExportFormat { csv, xlsx, txt }

/// Ro'yxatni fayl qilib eksport qiladi va telefon "Share" oynasi orqali
/// saqlash/yuborish imkonini beradi (email, Telegram, fayl menejeri va h.k.).
class ExportService {
  Future<void> export({
    required ScanListData list,
    required Map<String, ProductInfo> productDb,
    required ExportFormat format,
  }) async {
    final dir = await getTemporaryDirectory();
    final safeName = list.name.replaceAll(RegExp(r'[^\w\-\.\s]'), '_');
    late File file;

    switch (format) {
      case ExportFormat.csv:
        file = File('${dir.path}/$safeName.csv');
        await file.writeAsString(_buildCsv(list, productDb));
        break;
      case ExportFormat.txt:
        file = File('${dir.path}/$safeName.txt');
        await file.writeAsString(_buildTxt(list, productDb));
        break;
      case ExportFormat.xlsx:
        file = File('${dir.path}/$safeName.xlsx');
        await file.writeAsBytes(_buildXlsx(list, productDb));
        break;
    }

    await Share.shareXFiles([XFile(file.path)], subject: list.name);
  }

  String _buildCsv(ScanListData list, Map<String, ProductInfo> productDb) {
    final buffer = StringBuffer('Shtrix-kod,Tovar kodi,Nomi,Miqdor,Narx\n');
    for (final item in list.items) {
      final info = productDb[item.code];
      buffer.writeln([
        item.code,
        info?.sku ?? '',
        _csvEscape(info?.name ?? "Noma'lum"),
        item.qty.toString(),
        info?.price?.toStringAsFixed(2) ?? '',
      ].join(','));
    }
    return buffer.toString();
  }

  String _csvEscape(String value) {
    if (value.contains(',') || value.contains('"') || value.contains('\n')) {
      return '"${value.replaceAll('"', '""')}"';
    }
    return value;
  }

  String _buildTxt(ScanListData list, Map<String, ProductInfo> productDb) {
    final buffer = StringBuffer('${list.name}\n${'=' * list.name.length}\n\n');
    for (final item in list.items) {
      final info = productDb[item.code];
      buffer.writeln('${item.code}\t${info?.name ?? "Noma'lum"}\tx${item.qty}');
    }
    return buffer.toString();
  }

  List<int> _buildXlsx(ScanListData list, Map<String, ProductInfo> productDb) {
    final workbook = xls.Excel.createExcel();
    final sheet = workbook['Ro\'yxat'];
    workbook.setDefaultSheet('Ro\'yxat');

    sheet.appendRow([
      xls.TextCellValue('Shtrix-kod'),
      xls.TextCellValue('Tovar kodi'),
      xls.TextCellValue('Nomi'),
      xls.TextCellValue('Miqdor'),
      xls.TextCellValue('Narx'),
    ]);

    for (final item in list.items) {
      final info = productDb[item.code];
      sheet.appendRow([
        xls.TextCellValue(item.code),
        xls.TextCellValue(info?.sku ?? ''),
        xls.TextCellValue(info?.name ?? "Noma'lum"),
        xls.IntCellValue(item.qty),
        info?.price != null ? xls.DoubleCellValue(info!.price!) : xls.TextCellValue(''),
      ]);
    }

    return workbook.encode()!;
  }
}
