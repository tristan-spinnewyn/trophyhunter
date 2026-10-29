// lib/accounts/password-policy.ts
// Client-safe: shared by the sign-up form, the register route and account creation.

/** Minimum length of a new password. Sign-in does not check it, so older shorter passwords still work. */
export const MIN_PASSWORD_LENGTH = 8;
