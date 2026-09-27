// Validates a theme content file against the pipeline rules.
// Run: node server/scripts/validate-content.js content/sound-mind.json
// Exit 0 = valid, 1 = invalid (errors printed).
import { readFile } from "node:fs/promises";

const file = process.argv[2];
if (!file) {
  console.error("usage: node validate-content.js <file>");
  process.exit(1);
}

export function validateTheme(doc) {
  const errors = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };
  need(doc && typeof doc === "object", "root must be an object");
  const t = doc?.theme ?? {};
  need(/^[a-z0-9-]+$/.test(t.id ?? ""), "theme.id must be slug");
  need(typeof t.title === "string" && t.title.length > 0, "theme.title required");
  need(typeof t.is_free === "boolean", "theme.is_free must be boolean");
  need(Array.isArray(doc?.scriptures) && doc.scriptures.length > 0, "scriptures must be non-empty array");
  const ids = new Set();
  for (const [i, s] of (doc?.scriptures ?? []).entries()) {
    const at = `scriptures[${i}]`;
    need(/^[a-z0-9-]+$/.test(s?.id ?? ""), `${at}.id must be slug`);
    need(!ids.has(s?.id), `${at}.id duplicate: ${s?.id}`);
    ids.add(s?.id);
    need(typeof s?.ref === "string" && s.ref.length > 0, `${at}.ref required`);
    need(typeof s?.text === "string" && s.text.length > 0, `${at}.text required`);
    need(Array.isArray(s?.phrases) && s.phrases.length > 0 && s.phrases.every((p) => typeof p === "string" && p.length > 0), `${at}.phrases must be non-empty strings`);
    for (const band of ["4-7", "8-11", "12-17"]) {
      const q = s?.questions?.[band];
      need(Array.isArray(q) && q.length > 0 && q.every((x) => typeof x === "string" && x.length > 0), `${at}.questions["${band}"] must be non-empty strings`);
    }
    need(s?.audio_url === null || s?.audio_url === undefined || typeof s?.audio_url === "string", `${at}.audio_url must be string or null`);
  }
  return errors;
}

const doc = JSON.parse(await readFile(file, "utf8"));
const errors = validateTheme(doc);
if (errors.length) {
  console.error(`INVALID ${file}:`);
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}
console.log(`VALID ${file}: ${(doc.scriptures ?? []).length} scripture(s)`);
