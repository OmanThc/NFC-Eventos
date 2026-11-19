# Security Specification & Payload TDD (`security_spec.md`)

## 1. Data Invariants
1. **Authentication Gate**: All read and write operations require a verified Google-authenticated user (`request.auth != null && request.auth.token.email_verified == true`), except `/test/connection` which returns non-sensitive health check.
2. **Tenant Ownership (`ownerUid`)**: Every company and every subcollection document (`providers`, `stickers`, `products`, `transactions`) MUST carry `ownerUid` matching `request.auth.uid` on creation (unless written by the bootstrapped Super Admin `andresomana3@gmail.com` or an entry in `/admins/{uid}`).
3. **Master Gate Relational Sync**: Every write/get on `/companies/{companyId}/...` verifies parent company existence (`exists(/databases/$(database)/documents/companies/$(companyId))`) and parent ownership (`get(...).data.ownerUid == request.auth.uid || isAdmin()`).
4. **Immutable Ownership & Audit Fields**: `ownerUid`, `companyId`, and `createdAt` cannot be modified after creation. Transactions are append-only (`allow update, delete: if isAdmin()`).
5. **Strict Schema Keys & Size Bounds**: Every string field enforces `.size()` limits, numeric PINs match `^[0-9]{4,8}$`, balances/prices are bounded numbers (`>= 0`), and `cartSnapshot` arrays are bounded to `<= 50` items.
6. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time` (via `serverTimestamp()`).

## 2. "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Write**: Create `/companies/comp-1` with `request.auth == null`.
2. **Unverified Email Spoof**: Write `/platform/config` with `email: "andresomana3@gmail.com"` and `email_verified: false`.
3. **Identity Spoofing on Create**: Create `/companies/comp-1` with `ownerUid: "someone-else-uid"` != `request.auth.uid`.
4. **Shadow/Ghost Field Injection**: Create `/companies/comp-1` containing extra unknown field `isSuperUser: true`.
5. **ID Poisoning (Oversized Document ID)**: Create `/companies/A...1500chars` -> rejected by `isValidId()`.
6. **Denial-of-Wallet Oversized String**: Create product with `name` of 5,000 characters -> rejected by `.size() <= 120`.
7. **Non-numeric PIN Injection**: Create provider with `pin: "abcd"` -> rejected by regex `^[0-9]+$`.
8. **Negative Balance Injection**: Update sticker with `balance: -50` -> rejected by `balance >= 0`.
9. **Orphan Subcollection Record**: Create `/companies/non-existent-id/products/p1` -> rejected by `exists()` Master Gate.
10. **Cross-Tenant List Scraping**: `list /companies` without `where('ownerUid', '==', auth.uid)` by non-admin -> rejected by `allow list` `resource.data.ownerUid == request.auth.uid || isAdmin()`.
11. **Immutable Field Tampering**: Update `/companies/comp-1` changing `ownerUid` or `createdAt` -> rejected.
12. **Timestamp Spoofing**: Create `/companies/comp-1` with client-forged `createdAt` not equal to `request.time` -> rejected.
