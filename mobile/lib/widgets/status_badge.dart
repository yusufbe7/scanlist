import 'package:flutter/material.dart';

import '../models/payment.dart';

class StatusBadge extends StatelessWidget {
  final PaymentStatus status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final (color, label, icon) = switch (status) {
      PaymentStatus.approved => (const Color(0xFF16A34A), 'Tasdiqlangan', Icons.check_circle_rounded),
      PaymentStatus.rejected => (const Color(0xFFDC2626), 'Rad etilgan', Icons.cancel_rounded),
      PaymentStatus.pending => (const Color(0xFFF59E0B), 'Kutilmoqda', Icons.hourglass_top_rounded),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12)),
        ],
      ),
    );
  }
}
