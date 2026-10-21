import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/login", "/setup"];

// Edge-safe part of the auth config, shared with proxy.ts. No DB or hashing in here.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 90 },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) return true;
      return !!auth?.user;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
