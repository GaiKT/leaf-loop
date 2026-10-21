// Slows down password guessing. Failed logins are counted per client address and per username; once either
// reaches LIMIT.max inside LIMIT.windowMs it is locked for LIMIT.lockMs. The rules here are pure; the database
// side is in login-throttle-db.ts.

export const LIMIT = {
  max: 8,
  windowMs: 15 * 60_000,
  lockMs: 15 * 60_000,
} as const;

export type Attempt = {
  failures: number;
  windowStart: Date;
  lockedUntil: Date | null;
};

export function isLocked(state: Attempt | null, now: Date): boolean {
  return !!state?.lockedUntil && state.lockedUntil > now;
}

/** Whole minutes until the lock ends, at least 1 while it is locked. */
export function minutesLeft(state: Attempt, now: Date): number {
  if (!state.lockedUntil) return 0;
  return Math.max(1, Math.ceil((state.lockedUntil.getTime() - now.getTime()) / 60_000));
}

/** The state after one more failed login. */
export function failureOutcome(state: Attempt | null, now: Date): Attempt {
  const expired = !state || now.getTime() - state.windowStart.getTime() > LIMIT.windowMs;
  const failures = expired ? 1 : state.failures + 1;
  const windowStart = expired ? now : state.windowStart;

  let lockedUntil = expired ? null : state.lockedUntil;
  if (failures >= LIMIT.max) {
    const until = new Date(now.getTime() + LIMIT.lockMs);
    // A lock that is already running is never made shorter.
    lockedUntil = lockedUntil && lockedUntil > until ? lockedUntil : until;
  }
  return { failures, windowStart, lockedUntil };
}

export function keysFor(ip: string, username: string) {
  return { ip: `ip:${ip}`, user: `user:${username.trim().toLowerCase()}` };
}
