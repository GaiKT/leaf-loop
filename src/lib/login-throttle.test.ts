import { describe, expect, it } from "vitest";
import {
  type Attempt,
  failureOutcome,
  isLocked,
  keysFor,
  LIMIT,
  minutesLeft,
} from "./login-throttle";

const t = (iso: string) => new Date(`2026-10-21T${iso}Z`);
const MINUTE = 60_000;

describe("failureOutcome", () => {
  it("starts a window on the first failure", () => {
    const next = failureOutcome(null, t("10:00:00"));
    expect(next).toEqual({ failures: 1, windowStart: t("10:00:00"), lockedUntil: null });
  });

  it("counts failures inside the window without locking below the limit", () => {
    let state: Attempt | null = null;
    for (let i = 0; i < LIMIT.max - 1; i++) state = failureOutcome(state, t("10:00:00"));
    expect(state?.failures).toBe(LIMIT.max - 1);
    expect(isLocked(state, t("10:00:00"))).toBe(false);
  });

  it("locks on the failure that reaches the limit", () => {
    let state: Attempt | null = null;
    for (let i = 0; i < LIMIT.max; i++) state = failureOutcome(state, t("10:00:00"));
    expect(isLocked(state, t("10:00:01"))).toBe(true);
    expect(state?.lockedUntil).toEqual(new Date(t("10:00:00").getTime() + LIMIT.lockMs));
  });

  it("starts counting again when the window has expired", () => {
    let state: Attempt | null = null;
    for (let i = 0; i < LIMIT.max - 1; i++) state = failureOutcome(state, t("10:00:00"));
    const later = new Date(t("10:00:00").getTime() + LIMIT.windowMs + MINUTE);
    const next = failureOutcome(state, later);
    expect(next).toEqual({ failures: 1, windowStart: later, lockedUntil: null });
  });

  it("does not shorten a lock that is already running", () => {
    let state: Attempt | null = null;
    for (let i = 0; i < LIMIT.max; i++) state = failureOutcome(state, t("10:00:00"));
    const again = failureOutcome(state, t("10:05:00"));
    expect(again.lockedUntil!.getTime()).toBeGreaterThanOrEqual(state!.lockedUntil!.getTime());
  });
});

describe("isLocked and minutesLeft", () => {
  const locked: Attempt = { failures: LIMIT.max, windowStart: t("10:00:00"), lockedUntil: t("10:15:00") };

  it("is locked until the lock time and free after it", () => {
    expect(isLocked(locked, t("10:14:59"))).toBe(true);
    expect(isLocked(locked, t("10:15:00"))).toBe(false);
    expect(isLocked(null, t("10:00:00"))).toBe(false);
  });

  it("rounds the wait up to whole minutes", () => {
    expect(minutesLeft(locked, t("10:00:00"))).toBe(15);
    expect(minutesLeft(locked, t("10:14:30"))).toBe(1);
  });
});

describe("keysFor", () => {
  it("keys on the address and on the username, in lower case", () => {
    expect(keysFor("203.0.113.9", "Somchai")).toEqual({ ip: "ip:203.0.113.9", user: "user:somchai" });
  });
});
