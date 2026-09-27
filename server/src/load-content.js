// Loads a validated theme file into Postgres (upsert by id).
// Run: docker exec imeditate-api node src/load-content.js content/sound-mind.json
// (content/ is baked into the image; see Dockerfile.)
import { readFile } from "node:fs/promises";
import { pool } from "./auth.js";
import { validateTheme } from "../scripts/validate-content.js";

const file = process.argv[2] ?? "content/sound-mind.json";
const doc = JSON.parse(await readFile(file, "utf8"));
const errors = validateTheme(doc);
if (errors.length) {
  console.error("Refusing to load invalid content:");
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}
await pool.query("INSERT INTO themes (id, title, is_free) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET title=$2, is_free=$3", [doc.theme.id, doc.theme.title, doc.theme.is_free]);
for (const [i, s] of doc.scriptures.entries()) {
  await pool.query(
    `INSERT INTO scriptures (id, theme_id, ref, text, phrases, questions, audio_url, sort)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET theme_id=$2, ref=$3, text=$4, phrases=$5, questions=$6, audio_url=$7, sort=$8`,
    [s.id, doc.theme.id, s.ref, s.text, JSON.stringify(s.phrases), JSON.stringify(s.questions), s.audio_url ?? null, s.sort ?? i]
  );
}
console.log(`Loaded theme ${doc.theme.id}: ${doc.scriptures.length} scripture(s)`);
await pool.end();
