// Resets a Grower's password from the server, for when nobody can log in any more.
//
//   npm run reset-password -- <username>
//   docker compose run --rm migrate npx tsx scripts/reset-password.mts <username>
//
// It prints a temporary password. The Grower has to replace it at their next login.
import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";
import { generateTemporaryPassword } from "../src/lib/passwords";

const username = (process.argv[2] ?? "").trim().toLowerCase();
if (!username) {
  console.error("Usage: npm run reset-password -- <username>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const temporary = generateTemporaryPassword();
  const hash = await bcrypt.hash(temporary, 12);
  const result = await client.query(
    'UPDATE "Grower" SET "passwordHash" = $1, "mustChangePassword" = true WHERE username = $2',
    [hash, username],
  );
  if (result.rowCount === 0) {
    console.error(`No Grower named "${username}".`);
    process.exitCode = 1;
  } else {
    console.log(`Temporary password for ${username}: ${temporary}`);
    console.log("They must choose a new password when they log in.");
  }
} finally {
  await client.end();
}
