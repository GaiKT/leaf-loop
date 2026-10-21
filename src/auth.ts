import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { normalizeUsername } from "@/lib/credentials";
import { clientIp } from "@/lib/client-ip";
import { lockedMinutes, recordFailure, recordSuccess } from "@/lib/login-throttle-db";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// Compared against when the username does not exist, so response time doesn't reveal which usernames are real.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

/** Too many wrong passwords. The code carries the wait, e.g. "locked-15", for the login form to show. */
class TooManyAttempts extends CredentialsSignin {
  constructor(minutes: number) {
    super();
    this.code = `locked-${minutes}`;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      // The throttle lives here, not in the login form's action, so the /api/auth endpoint cannot be used to
      // guess passwords around it.
      async authorize(credentials, request) {
        const username = normalizeUsername(String(credentials?.username ?? ""));
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;

        const ip = clientIp(request.headers);
        // Checked before hashing, so a flood of guesses costs the server almost nothing.
        const wait = await lockedMinutes(ip, username);
        if (wait > 0) throw new TooManyAttempts(wait);

        const grower = await db.grower.findUnique({ where: { username } });
        const ok = await bcrypt.compare(password, grower?.passwordHash ?? DUMMY_HASH);
        if (!grower || !ok) {
          await recordFailure(ip, username);
          return null;
        }

        await recordSuccess(username);
        return { id: grower.id, name: grower.username };
      },
    }),
  ],
});
