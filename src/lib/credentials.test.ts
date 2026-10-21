import { describe, expect, it } from "vitest";
import { passwordSchema, usernameSchema } from "./credentials";

describe("usernameSchema", () => {
  it("lowercases and trims the username", () => {
    expect(usernameSchema.parse("  Somchai.K ")).toBe("somchai.k");
  });

  it("rejects usernames that are too short", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
  });

  it("rejects characters outside letters, digits, dot, dash and underscore", () => {
    expect(usernameSchema.safeParse("som chai").success).toBe(false);
    expect(usernameSchema.safeParse("สมชาย").success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("requires at least 8 characters", () => {
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
  });
});
