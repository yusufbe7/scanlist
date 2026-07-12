import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:scanlist_mobile/screens/config_error_screen.dart';

void main() {
  testWidgets('ConfigErrorApp shows setup instructions when Supabase is not configured', (WidgetTester tester) async {
    await tester.pumpWidget(const ConfigErrorApp());

    expect(find.text('Supabase sozlanmagan'), findsOneWidget);
    expect(find.byIcon(Icons.cloud_off_rounded), findsOneWidget);
  });
}
