import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'config.dart';
import 'services/auth_service.dart';
import 'services/product_db_service.dart';
import 'services/scan_list_service.dart';
import 'state/lists_provider.dart';
import 'state/product_db_provider.dart';
import 'state/theme_provider.dart';
import 'screens/config_error_screen.dart';
import 'app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (!AppConfig.isSupabaseConfigured) {
    runApp(const ConfigErrorApp());
    return;
  }

  await Supabase.initialize(url: AppConfig.supabaseUrl, anonKey: AppConfig.supabaseAnonKey);

  final themeProvider = ThemeProvider();
  await themeProvider.load();

  final listsProvider = ListsProvider(ScanListService());
  await listsProvider.load();

  final productDbProvider = ProductDbProvider(ProductDbService());
  await productDbProvider.refreshCount();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider.value(value: themeProvider),
        ChangeNotifierProvider.value(value: listsProvider),
        ChangeNotifierProvider.value(value: productDbProvider),
      ],
      child: const ScanListApp(),
    ),
  );
}
