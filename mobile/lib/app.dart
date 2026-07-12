import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/auth/auth_gate.dart';
import 'state/theme_provider.dart';
import 'theme/app_theme.dart';

class ScanListApp extends StatelessWidget {
  const ScanListApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeMode = context.watch<ThemeProvider>().mode;
    return MaterialApp(
      title: 'ScanList',
      debugShowCheckedModeBanner: false,
      themeMode: themeMode,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      home: const AuthGate(),
    );
  }
}
