# PIRYAS Security Specification (Phase 0)

## 1. Data Invariants
1. **Private Profile Isolation**: `/users/{userId}` contains PII (`email`) and private state; only the authenticated owner (`request.auth.uid == userId` with verified email) can read, create, or update their own profile.
2. **Leaderboard PII Isolation**: `/leaderboard/{userId}` stores only public display metrics (`displayName`, `xp`, `weeklyXp`, `streak`, `activeFrameId`, `league`, `isPlus`) and never stores `email` or private billing fields. Writes are restricted strictly to the owner (`request.auth.uid == userId`).
3. **Subcollection Master Gate**: `/users/{userId}/languageProgress/{langCode}` and `/users/{userId}/purchases/{purchaseId}` verify parent `/users/{userId}` existence via `exists(...)` on create and strict owner identity.
4. **Immutable Payment Receipts**: Purchase documents in `/users/{userId}/purchases/{purchaseId}` cannot be updated or deleted once recorded, and `createdAt` must equal `request.time`.
5. **Social Duel State Integrity**: Duels in `/duels/{duelId}` enforce `challengerUid == request.auth.uid` on creation, restrict joining `'open'` duels, restrict XP updates to participants, and lock `'completed'` duels against further mutations.

## 2. Dirty Dozen Adversarial Payloads
1. Unauthenticated read/write to `/users/uid1`.
2. Unverified email user writing to `/users/uid1`.
3. Cross-user read of `/users/victimUid` by `attackerUid`.
4. Shadow field injection (`{ isAdmin: true }`) on `/users/uid1`.
5. Spoofed `uid` mismatch (`{ uid: "otherUid" }`) inside `/users/uid1`.
6. Client-forged `createdAt` timestamp not equal to `request.time`.
7. Oversized `displayName` (> 80 chars) or oversized `userId` (> 128 chars) resource poisoning.
8. Cross-user write to `/leaderboard/victimUid`.
9. Injecting PII (`email`) into `/leaderboard/uid1`.
10. Updating or deleting an immutable purchase receipt in `/users/uid1/purchases/p1`.
11. Modifying a `'completed'` duel in `/duels/d1`.
12. Non-participant updating XP in an `'active'` duel in `/duels/d1`.
