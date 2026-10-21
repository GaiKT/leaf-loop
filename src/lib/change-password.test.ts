import { describe, expect, it } from "vitest";
import { ChangePasswordSchema } from "./credentials";

const valid = { current: "TempPass1", password: "my-new-password", confirm: "my-new-password" };

describe("ChangePasswordSchema", () => {
  it("accepts a new password that is confirmed and different from the current one", () => {
    expect(ChangePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the current password", () => {
    expect(ChangePasswordSchema.safeParse({ ...valid, current: "" }).success).toBe(false);
  });

  it("requires at least 8 characters", () => {
    expect(ChangePasswordSchema.safeParse({ ...valid, password: "short", confirm: "short" }).success).toBe(false);
  });

  it("requires the confirmation to match", () => {
    const result = ChangePasswordSchema.safeParse({ ...valid, confirm: "something-else" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path.join("."))).toContain("confirm");
    }
  });

  it("refuses to keep the temporary password", () => {
    const result = ChangePasswordSchema.safeParse({ current: "TempPass1", password: "TempPass1", confirm: "TempPass1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path.join("."))).toContain("password");
    }
  });
});
