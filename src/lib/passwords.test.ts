import { describe, expect, it } from "vitest";
import { generateTemporaryPassword } from "./passwords";
import { passwordSchema } from "./credentials";

describe("generateTemporaryPassword", () => {
  it("makes a password of the requested length from readable characters only", () => {
    const password = generateTemporaryPassword(12);
    expect(password).toHaveLength(12);
    expect(password).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
  });

  it("is long enough to pass the password rules", () => {
    expect(passwordSchema.safeParse(generateTemporaryPassword()).success).toBe(true);
  });

  it("does not repeat", () => {
    const seen = new Set(Array.from({ length: 200 }, () => generateTemporaryPassword()));
    expect(seen.size).toBe(200);
  });
});
