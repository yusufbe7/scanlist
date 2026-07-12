import 'package:flutter/material.dart';

/// Supabase URL/anon key --dart-define bilan berilmagan bo'lsa ko'rsatiladi.
class ConfigErrorApp extends StatelessWidget {
  const ConfigErrorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.cloud_off_rounded, size: 64, color: Colors.redAccent),
                  const SizedBox(height: 16),
                  const Text(
                    'Supabase sozlanmagan',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Ilovani ishga tushirishdan oldin SUPABASE_URL va SUPABASE_ANON_KEY '
                    'qiymatlarini --dart-define orqali bering. Batafsil: mobile/README.md',
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
