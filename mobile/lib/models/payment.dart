enum PaymentStatus { pending, approved, rejected }

PaymentStatus paymentStatusFromString(String value) {
  switch (value) {
    case 'approved':
      return PaymentStatus.approved;
    case 'rejected':
      return PaymentStatus.rejected;
    default:
      return PaymentStatus.pending;
  }
}

class PaymentRecord {
  final String id;
  final String userId;
  final int amount;
  final int credits;
  final String receiptPath;
  final PaymentStatus status;
  final String? rejectReason;
  final DateTime createdAt;
  final DateTime? reviewedAt;

  /// Admin ro'yxatida ko'rsatish uchun (join orqali profiles'dan olinadi)
  final String? userFullName;
  final String? userPhone;

  const PaymentRecord({
    required this.id,
    required this.userId,
    required this.amount,
    required this.credits,
    required this.receiptPath,
    required this.status,
    required this.createdAt,
    this.rejectReason,
    this.reviewedAt,
    this.userFullName,
    this.userPhone,
  });

  factory PaymentRecord.fromMap(Map<String, dynamic> map) => PaymentRecord(
        id: map['id'] as String,
        userId: map['user_id'] as String,
        amount: (map['amount'] as num).toInt(),
        credits: (map['credits'] as num).toInt(),
        receiptPath: map['receipt_path'] as String,
        status: paymentStatusFromString(map['status'] as String),
        rejectReason: map['reject_reason'] as String?,
        createdAt: DateTime.parse(map['created_at'] as String),
        reviewedAt: map['reviewed_at'] != null ? DateTime.parse(map['reviewed_at'] as String) : null,
        userFullName: (map['profiles'] as Map<String, dynamic>?)?['full_name'] as String?,
        userPhone: (map['profiles'] as Map<String, dynamic>?)?['phone'] as String?,
      );
}
