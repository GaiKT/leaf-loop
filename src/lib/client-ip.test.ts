import { describe, expect, it } from "vitest";
import { clientIp } from "./client-ip";

const headers = (init: Record<string, string>) => new Headers(init);

describe("clientIp", () => {
  it("prefers the Cloudflare header", () => {
    expect(clientIp(headers({ "cf-connecting-ip": "203.0.113.9", "x-forwarded-for": "10.0.0.1" }))).toBe("203.0.113.9");
  });

  it("falls back to the first forwarded address", () => {
    expect(clientIp(headers({ "x-forwarded-for": "198.51.100.4, 10.0.0.1" }))).toBe("198.51.100.4");
  });

  it("falls back to x-real-ip, then to unknown", () => {
    expect(clientIp(headers({ "x-real-ip": "192.0.2.7" }))).toBe("192.0.2.7");
    expect(clientIp(headers({}))).toBe("unknown");
  });
});
