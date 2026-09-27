// One-shot migration for Better Auth tables. Run:
//   docker exec imeditate-api node src/migrate.js
import { getMigrations } from "better-auth/db/migration";
import { auth, pool } from "./auth.js";

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
console.log("create:", toBeCreated.map((t) => t.table));
console.log("alter:", toBeAdded.length, "columns");
await runMigrations();
console.log("migrations applied");
await pool.end();
