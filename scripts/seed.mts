// Wipes the database and fills it with sample data for trying the app out.
//
//   npm run seed
//
// DESTRUCTIVE: every Farm, Grower, Table, Variety, Target and Batch is deleted first. It refuses to run
// against a database that is not on this machine unless --allow-remote is given.
//
// The sample farm runs 5 kg/week of green oak with Batches in every stage, so that Today, Plan and Tables all
// have something to show. Dates are relative to today, so the data is always "in the middle of" a season.
// The Grower is created from DEV_TEST_USERNAME / DEV_TEST_PASSWORD in .env.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";
import { addDays, harvestDateForWeek, mondayOf, todayInBangkok } from "../src/lib/dates";
import { GREEN_OAK_DEFAULTS } from "../src/lib/defaults";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const host = new URL(url).hostname;
if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host) && !process.argv.includes("--allow-remote")) {
  console.error(`Refusing to wipe the database on "${host}". Pass --allow-remote if that is really what you want.`);
  process.exit(1);
}
const username = (process.env.DEV_TEST_USERNAME ?? "").trim().toLowerCase();
const password = process.env.DEV_TEST_PASSWORD ?? "";
if (!username || !password) {
  console.error("Set DEV_TEST_USERNAME and DEV_TEST_PASSWORD in .env: the seed creates that Grower.");
  process.exit(1);
}

const WEDNESDAY = 3;
const today = todayInBangkok();
const thisMonday = mondayOf(today);
const oak = GREEN_OAK_DEFAULTS;
const growOutAndBefore = oak.growOutDays + oak.nurseryDays + oak.germinationDays;
const kgPerWeek = 5;
const transplantCount = Math.ceil((kgPerWeek * 1000) / oak.gramsPerPlant);
const sownCount = Math.ceil((transplantCount * 100) / oak.survivalPercent);

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query(
    'TRUNCATE "Placement", "Batch", "SkippedWeek", "HarvestTarget", "Variety", "Table", "Grower", "Farm" CASCADE',
  );

  const farmId = randomUUID();
  await client.query('INSERT INTO "Farm" (id, name, "harvestWeekday") VALUES ($1, $2, $3)', [
    farmId,
    "ฟาร์มตัวอย่าง",
    WEDNESDAY,
  ]);
  await client.query('INSERT INTO "Grower" (id, "farmId", username, "passwordHash") VALUES ($1, $2, $3, $4)', [
    randomUUID(),
    farmId,
    username,
    await bcrypt.hash(password, 12),
  ]);

  const tables: { id: string; name: string }[] = [];
  for (const name of ["โต๊ะ A", "โต๊ะ B", "โต๊ะ C", "โต๊ะ D", "โต๊ะ E"]) {
    const id = randomUUID();
    tables.push({ id, name });
    await client.query('INSERT INTO "Table" (id, "farmId", name, "slotCount") VALUES ($1, $2, $3, $4)', [
      id,
      farmId,
      name,
      45,
    ]);
  }

  const varietyId = randomUUID();
  const insertVariety = (id: string, name: string) =>
    client.query(
      `INSERT INTO "Variety" (id, "farmId", name, "germinationDays", "nurseryDays", "growOutDays", "survivalPercent", "gramsPerPlant")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, farmId, name, oak.germinationDays, oak.nurseryDays, oak.growOutDays, oak.survivalPercent, oak.gramsPerPlant],
    );
  await insertVariety(varietyId, oak.name);
  // A Variety without a Harvest Target: listed in Settings but not planned.
  await insertVariety(randomUUID(), "เรดโอ๊ค");

  await client.query(
    'INSERT INTO "HarvestTarget" (id, "varietyId", "effectiveWeek", "kgPerWeek") VALUES ($1, $2, $3, $4)',
    [randomUUID(), varietyId, thisMonday, kgPerWeek],
  );
  // One deliberately skipped week, ten weeks ahead.
  await client.query('INSERT INTO "SkippedWeek" (id, "varietyId", week) VALUES ($1, $2, $3)', [
    randomUUID(),
    varietyId,
    addDays(thisMonday, 70),
  ]);

  // Batches for the harvest weeks 0..6 are already sown, one stage further along the older they are:
  //   0-4: transplanted onto their own Table (week 0 is harvested today)
  //   5-6: still in the nursery
  // Weeks 7 onward stay Planned, so today's Sow task is the one for week 7.
  for (let i = 0; i <= 6; i++) {
    const week = addDays(thisMonday, 7 * i);
    const harvestDate = harvestDateForWeek(week, WEDNESDAY);
    const sowDate = addDays(harvestDate, -growOutAndBefore);
    const transplantDate = addDays(harvestDate, -oak.growOutDays);
    const batchId = randomUUID();
    const transplanted = i <= 4;
    await client.query(
      `INSERT INTO "Batch" (id, "varietyId", "harvestWeek", "sowDate", "sownCount", "nurseryRemaining", status,
         "germinationDays", "nurseryDays", "growOutDays", "survivalPercent", "gramsPerPlant")
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, $8, $9, $10, $11)`,
      [
        batchId,
        varietyId,
        week,
        sowDate,
        sownCount,
        transplanted ? 0 : null,
        oak.germinationDays,
        oak.nurseryDays,
        oak.growOutDays,
        oak.survivalPercent,
        oak.gramsPerPlant,
      ],
    );
    if (transplanted) {
      const table = tables[i];
      await client.query(
        'INSERT INTO "Placement" (id, "batchId", "tableId", "tableName", "transplantDate", "plantCount") VALUES ($1, $2, $3, $4, $5, $6)',
        [randomUUID(), batchId, table.id, table.name, transplantDate, transplantCount],
      );
    }
  }

  await client.query("COMMIT");
  console.log(`Seeded: 1 Farm, Grower "${username}", ${tables.length} Tables, 2 Varieties, 7 Batches.`);
  console.log(`Sow ${sownCount} / transplant ${transplantCount} plants per Batch for ${kgPerWeek} kg per week.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
