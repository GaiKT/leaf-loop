import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Optimistic check only: sends visitors without a session cookie to /login.
// The real check (does this Grower still exist?) happens in the app layout.
export const proxy = NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/).*)"],
};
