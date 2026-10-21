import { db } from "@/lib/db";
import {
  type Attempt,
  failureOutcome,
  isLocked,
  keysFor,
  minutesLeft,
} from "@/lib/login-throttle";

const STALE_AFTER_MS = 24 * 60 * 60_000;

async function read(key: string): Promise<Attempt | null> {
  const row = await db.loginAttempt.findUnique({ where: { key } });
  return row && { failures: row.failures, windowStart: row.windowStart, lockedUntil: row.lockedUntil };
}

/** Minutes left on the longest lock that applies to this address or username, or 0 when login may go ahead. */
export async function lockedMinutes(ip: string, username: string, now = new Date()): Promise<number> {
  const keys = keysFor(ip, username);
  const states = await Promise.all([read(keys.ip), read(keys.user)]);
  return Math.max(0, ...states.map((s) => (s && isLocked(s, now) ? minutesLeft(s, now) : 0)));
}

/** Counts a failed login against both the address and the username. */
export async function recordFailure(ip: string, username: string, now = new Date()) {
  const keys = keysFor(ip, username);
  for (const key of [keys.ip, keys.user]) {
    // The advisory lock makes read-then-write atomic, so simultaneous guesses cannot all slip under the limit.
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
      const row = await tx.loginAttempt.findUnique({ where: { key } });
      const current: Attempt | null = row && {
        failures: row.failures,
        windowStart: row.windowStart,
        lockedUntil: row.lockedUntil,
      };
      const next = failureOutcome(current, now);
      await tx.loginAttempt.upsert({ where: { key }, create: { key, ...next }, update: next });
    });
  }
  await db.loginAttempt.deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - STALE_AFTER_MS) } } });
}

/** A correct login clears the username's counter. The address's counter is left to run out on its own. */
export async function recordSuccess(username: string) {
  await db.loginAttempt.deleteMany({ where: { key: keysFor("", username).user } });
}
