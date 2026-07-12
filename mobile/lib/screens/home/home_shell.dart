import 'package:flutter/material.dart';

import '../credits/credits_screen.dart';
import '../lists/list_screen.dart';
import '../settings/settings_screen.dart';
import 'scanner_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _screens = [
    ScannerScreen(),
    ListScreen(),
    CreditsScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.qr_code_scanner_outlined), selectedIcon: Icon(Icons.qr_code_scanner_rounded), label: 'Skaner'),
          NavigationDestination(icon: Icon(Icons.list_alt_outlined), selectedIcon: Icon(Icons.list_alt_rounded), label: "Ro'yxat"),
          NavigationDestination(icon: Icon(Icons.diamond_outlined), selectedIcon: Icon(Icons.diamond_rounded), label: 'Kredit'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings_rounded), label: 'Sozlamalar'),
        ],
      ),
    );
  }
}
