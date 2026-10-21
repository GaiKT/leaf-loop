import bcrypt from "bcryptjs";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { normalizeUsername } from "@/lib/credentials";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// Compared against when the username does not exist, so response time doesn't reveal which usernames are real.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(credentials) {
        const username = normalizeUsername(String(credentials?.username ?? ""));
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;

        const grower = await db.grower.findUnique({ where: { username } });
        const ok = await bcrypt.compare(password, grower?.passwordHash ?? DUMMY_HASH);
        if (!grower || !ok) return null;

        return { id: grower.id, name: grower.username };
      },
    }),
  ],
});
