import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../home/home_shell.dart';
import 'login_screen.dart';

/// Kirish holatiga qarab Login yoki asosiy ilova ekranini ko'rsatadi.
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();

    if (!auth.isLoggedIn) {
      return const LoginScreen();
    }

    if (auth.loading || auth.profile == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return const HomeShell();
  }
}
