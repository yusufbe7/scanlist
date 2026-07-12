import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/app_profile.dart';

/// Autentifikatsiya va joriy foydalanuvchi profili (kredit/rol) holatini boshqaradi.
class AuthService extends ChangeNotifier {
  final SupabaseClient _client = Supabase.instance.client;

  AppProfile? profile;
  bool loading = true;
  String? lastError;

  StreamSubscription<AuthState>? _authSub;
  StreamSubscription<List<Map<String, dynamic>>>? _profileSub;

  AuthService() {
    _authSub = _client.auth.onAuthStateChange.listen((event) {
      _onSessionChanged();
    });
    _onSessionChanged();
  }

  User? get currentUser => _client.auth.currentUser;
  bool get isLoggedIn => currentUser != null;
  bool get isAdmin => profile?.isAdmin ?? false;

  void _onSessionChanged() {
    _profileSub?.cancel();
    final user = _client.auth.currentUser;
    if (user == null) {
      profile = null;
      loading = false;
      notifyListeners();
      return;
    }
    loading = true;
    notifyListeners();
    // Profil qatorini jonli (realtime) kuzatamiz — admin kredit qo'shganda UI avtomatik yangilanadi.
    _profileSub = _client
        .from('profiles')
        .stream(primaryKey: ['id'])
        .eq('id', user.id)
        .listen((rows) {
      loading = false;
      if (rows.isNotEmpty) {
        profile = AppProfile.fromMap(rows.first);
      }
      notifyListeners();
    }, onError: (_) {
      loading = false;
      notifyListeners();
    });
  }

  Future<String?> signUp({required String email, required String password, String? fullName, String? phone}) async {
    try {
      lastError = null;
      await _client.auth.signUp(
        email: email.trim(),
        password: password,
        data: {'full_name': fullName, 'phone': phone},
      );
      return null;
    } on AuthException catch (e) {
      lastError = e.message;
      return e.message;
    } catch (e) {
      lastError = e.toString();
      return e.toString();
    }
  }

  Future<String?> signIn({required String email, required String password}) async {
    try {
      lastError = null;
      await _client.auth.signInWithPassword(email: email.trim(), password: password);
      return null;
    } on AuthException catch (e) {
      lastError = e.message;
      return e.message;
    } catch (e) {
      lastError = e.toString();
      return e.toString();
    }
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  @override
  void dispose() {
    _authSub?.cancel();
    _profileSub?.cancel();
    super.dispose();
  }
}
