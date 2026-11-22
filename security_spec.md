# ColorVision Test — Security Specification (Phase 0)

## 1. Data Invariants
1. **User Ownership & PII Isolation**: A `/users/{userId}` document can only be created, read, updated, or deleted by the authenticated owner (`request.auth.uid == userId`) or an administrator. Users cannot self-assign `role: 'admin'`.
2. **Screening Record Integrity**: A `/screenings/{screeningId}` document must always belong to the creating authenticated verified user (`incoming().userId == request.auth.uid`), have server-verified `completedAt == request.time`, and remain immutable after creation (owners and admins may delete records for privacy/account deletion).
3. **Zero-PII Anonymous Telemetry**: `/anonymousStats/{statId}` documents must contain zero PII fields (`userId`, `email`, `displayName` are forbidden) and are readable exclusively by administrators.
4. **Public Educational Content, Admin-Only Mutations**: `/articles/{articleId}`, `/faqs/{faqId}`, `/plates/{plateId}`, and `/siteConfig/{configId}` are publicly readable for guest and signed-in screening/education, while all creates, updates, and deletes require verified administrator authorization.
5. **Path & Type Bounds**: Every document ID matches `^[a-zA-Z0-9_-]+$` (`<= 128` chars), and every string and list enforces strict length and element limits.

## 2. Dirty Dozen Adversarial Payloads
1. **Self-Admin Escalation**: Creating `/users/{uid}` with `role: "admin"` as a non-admin user -> `PERMISSION_DENIED`.
2. **Role Tampering on Update**: Updating own `/users/{uid}` to change `role` from `"user"` to `"admin"` -> `PERMISSION_DENIED`.
3. **PII Snooping (Get)**: User A reading `/users/{userB}` -> `PERMISSION_DENIED`.
4. **PII Scraping (List)**: Non-admin listing `/users` -> `PERMISSION_DENIED`.
5. **Screening Spoofing**: User A creating `/screenings/{id}` with `userId: userB` -> `PERMISSION_DENIED`.
6. **Timestamp Forgery**: Creating `/screenings/{id}` with a backdated client `completedAt` != `request.time` -> `PERMISSION_DENIED`.
7. **Shadow Field Injection**: Creating `/screenings/{id}` with an extra `"isClinicallyVerified": true` field -> `PERMISSION_DENIED`.
8. **Cross-User Screening Read**: User A listing or getting `/screenings/{id}` owned by User B -> `PERMISSION_DENIED`.
9. **Anonymous Stat Snooping**: Non-admin user reading `/anonymousStats` -> `PERMISSION_DENIED`.
10. **PII Leak in Anonymous Stat**: Writing `email` or `userId` into `/anonymousStats/{id}` -> `PERMISSION_DENIED`.
11. **Unprivileged Content Defacement**: Non-admin modifying `/articles/{id}`, `/faqs/{id}`, `/plates/{id}`, or `/siteConfig/main` -> `PERMISSION_DENIED`.
12. **Resource Exhaustion / ID Poisoning**: Creating a document with ID > 128 chars, invalid characters, or a 1MB string payload -> `PERMISSION_DENIED`.
