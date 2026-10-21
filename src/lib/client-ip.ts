/**
 * The address the request came from. Behind a Cloudflare Tunnel the real one is in cf-connecting-ip; otherwise
 * the first x-forwarded-for hop. These headers can be forged by a client that reaches the app directly, which is
 * why the throttle also counts per username: a forged address cannot get around that.
 */
export function clientIp(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
