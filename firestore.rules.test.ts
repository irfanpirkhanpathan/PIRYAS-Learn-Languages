/**
 * Phase 0 Dirty Dozen Security Rule Verification Suite
 * Targets the 12 adversarial payloads defined in security_spec.md.
 */
export const dirtyDozenCases = [
  { id: 1, name: 'Unauthenticated read/write to /users/uid1', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified email user write to /users/uid1', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Cross-user read of /users/victimUid by attackerUid', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow field injection (isAdmin: true) on /users/uid1', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Spoofed uid mismatch inside /users/uid1', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Client-forged createdAt timestamp not equal to request.time', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Oversized displayName (>80 chars) or userId (>128 chars)', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Cross-user write to /leaderboard/victimUid', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Injecting PII (email) into /leaderboard/uid1', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Mutating immutable receipt in /users/uid1/purchases/p1', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Mutating completed duel in /duels/d1', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Non-participant updating active duel in /duels/d1', expected: 'PERMISSION_DENIED' },
];
