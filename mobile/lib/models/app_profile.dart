class AppProfile {
  final String id;
  final String? fullName;
  final String? phone;
  final String role;
  final int credits;
  final int freeScansUsed;

  const AppProfile({
    required this.id,
    required this.role,
    required this.credits,
    required this.freeScansUsed,
    this.fullName,
    this.phone,
  });

  bool get isAdmin => role == 'admin';

  factory AppProfile.fromMap(Map<String, dynamic> map) => AppProfile(
        id: map['id'] as String,
        fullName: map['full_name'] as String?,
        phone: map['phone'] as String?,
        role: map['role'] as String? ?? 'user',
        credits: (map['credits'] as num?)?.toInt() ?? 0,
        freeScansUsed: (map['free_scans_used'] as num?)?.toInt() ?? 0,
      );
}
