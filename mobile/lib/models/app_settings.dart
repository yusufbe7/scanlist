class AppSettings {
  final int freeScanLimit;
  final String paymentCardNumber;
  final String paymentCardOwner;
  final String? paymentPhone;

  const AppSettings({
    required this.freeScanLimit,
    required this.paymentCardNumber,
    required this.paymentCardOwner,
    this.paymentPhone,
  });

  factory AppSettings.fromMap(Map<String, dynamic> map) => AppSettings(
        freeScanLimit: (map['free_scan_limit'] as num?)?.toInt() ?? 50,
        paymentCardNumber: map['payment_card_number'] as String? ?? '',
        paymentCardOwner: map['payment_card_owner'] as String? ?? '',
        paymentPhone: map['payment_phone'] as String?,
      );

  static const fallback = AppSettings(
    freeScanLimit: 50,
    paymentCardNumber: 'Sozlanmagan',
    paymentCardOwner: 'Sozlanmagan',
  );
}
