import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { writeFile, readFile, unlink, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { promisify } from "node:util";
import { auth, pool } from "./auth.js";
import { nextStage, rankFor, promoted, JEWELS_PER_COMPLETION } from "./rules.js";
import { r2Configured, objectKey, presignedPut, presignedGet, parseR2Url } from "./r2.js";

const scryptAsync = promisify(scrypt);
const PORT = Number(process.env.PORT ?? 3000);
const MEDIA_DIR = process.env.MEDIA_DIR ?? "/app/media";
await mkdir(MEDIA_DIR, { recursive: true });

const AGE_GROUPS = ["4-7", "8-11", "12-17"];
const app = new Hono();

// --- auth (Better Auth) ---
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// --- helpers ---
async function parentOf(c) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return null;
  const { rows } = await pool.query("SELECT id, email FROM parents WHERE auth_user_id = $1", [session.user.id]);
  return rows[0] ?? null;
}
async function requireParent(c) {
  const p = await parentOf(c);
  if (!p) return c.json({ error: "unauthorized" }, 401);
  return p;
}
async function ownChild(parentId, childId) {
  const { rows } = await pool.query("SELECT id FROM children WHERE id = $1 AND parent_id = $2", [childId, parentId]);
  return rows[0] ?? null;
}
function hashPin(pin) {
  const salt = randomBytes(16);
  return scryptAsync(pin, salt, 64).then((h) => `scrypt:${salt.toString("hex")}:${h.toString("hex")}`);
}
async function checkPin(pin, stored) {
  const [, saltHex, hashHex] = stored.split(":");
  const h = await scryptAsync(pin, Buffer.from(saltHex, "hex"), 64);
  return timingSafeEqual(h, Buffer.from(hashHex, "hex"));
}

// --- system ---
app.get("/health", (c) => c.json({ ok: true }));
app.get("/api/me", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  return c.json(p);
});

// --- parent PIN ---
app.post("/api/parent/pin", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  const { pin } = await c.req.json();
  if (!/^\d{4,6}$/.test(pin ?? "")) return c.json({ error: "pin must be 4-6 digits" }, 400);
  await pool.query("UPDATE parents SET pin_hash = $1 WHERE id = $2", [await hashPin(pin), p.id]);
  return c.json({ ok: true });
});
app.post("/api/parent/unlock", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  const { pin } = await c.req.json();
  const { rows } = await pool.query("SELECT pin_hash FROM parents WHERE id = $1", [p.id]);
  if (!rows[0]?.pin_hash) return c.json({ error: "no pin set" }, 400);
  return (await checkPin(pin ?? "", rows[0].pin_hash)) ? c.json({ ok: true }) : c.json({ error: "wrong pin" }, 401);
});
app.delete("/api/parent", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  await pool.query("DELETE FROM parents WHERE id = $1", [p.id]);
  return c.json({ ok: true });
});

// --- children ---
app.post("/api/children", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  const { nickname, age_group } = await c.req.json();
  if (!nickname || nickname.length > 40) return c.json({ error: "nickname required, max 40" }, 400);
  if (!AGE_GROUPS.includes(age_group)) return c.json({ error: "age_group must be 4-7, 8-11 or 12-17" }, 400);
  const { rows } = await pool.query(
    "INSERT INTO children (parent_id, nickname, age_group) VALUES ($1,$2,$3) RETURNING id, nickname, age_group, soldier_rank",
    [p.id, nickname, age_group]
  );
  const child = rows[0];
  await pool.query("INSERT INTO jewel_wallets (child_id) VALUES ($1) ON CONFLICT DO NOTHING", [child.id]);
  await pool.query("INSERT INTO streaks (child_id) VALUES ($1) ON CONFLICT DO NOTHING", [child.id]);
  return c.json(child, 201);
});
app.get("/api/children", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  const { rows } = await pool.query("SELECT id, nickname, age_group, soldier_rank FROM children WHERE parent_id = $1", [p.id]);
  return c.json(rows);
});
app.delete("/api/children/:id", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  const child = await ownChild(p.id, c.req.param("id"));
  if (!child) return c.json({ error: "not found" }, 404);
  await pool.query("DELETE FROM children WHERE id = $1", [child.id]);
  return c.json({ ok: true });
});

// --- content (read) ---
app.get("/api/themes", async (c) => {
  const { rows } = await pool.query("SELECT id, title, is_free FROM themes ORDER BY id");
  return c.json(rows);
});
app.get("/api/themes/:id/scriptures", async (c) => {
  const { rows } = await pool.query("SELECT id, ref, text, phrases, questions, audio_url FROM scriptures WHERE theme_id = $1 ORDER BY sort", [c.req.param("id")]);
  return c.json(rows);
});

// --- progress ---
app.get("/api/progress/:childId", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  const child = await ownChild(p.id, c.req.param("childId"));
  if (!child) return c.json({ error: "not found" }, 404);
  const { rows } = await pool.query("SELECT scripture_id, stage, ponder_artifact_url, mutter_count FROM progress WHERE child_id = $1", [child.id]);
  return c.json(rows);
});
app.put("/api/progress/:childId/:scriptureId", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  const child = await ownChild(p.id, c.req.param("childId"));
  if (!child) return c.json({ error: "not found" }, 404);
  const { stage, mutter_count } = await c.req.json();
  const cur = await pool.query("SELECT stage FROM progress WHERE child_id = $1 AND scripture_id = $2", [child.id, c.req.param("scriptureId")]);
  const current = cur.rows[0]?.stage ?? "ponder";
  if (stage !== current && stage !== nextStage(current)) {
    return c.json({ error: `must advance in order (now at ${current})` }, 400);
  }
  await pool.query(
    `INSERT INTO progress (child_id, scripture_id, stage, mutter_count)
     VALUES ($1,$2,$3,$4) ON CONFLICT (child_id, scripture_id)
     DO UPDATE SET stage = $3, mutter_count = $4, updated_at = now()`,
    [child.id, c.req.param("scriptureId"), stage, mutter_count ?? 0]
  );
  // Roar complete -> rank, jewels
  if (stage === "done" && current !== "done") {
    const done = await pool.query("SELECT count(*)::int AS n FROM progress WHERE child_id = $1 AND stage = 'done'", [child.id]);
    const before = await pool.query("SELECT soldier_rank FROM children WHERE id = $1", [child.id]);
    const rank = rankFor(done.rows[0].n);
    await pool.query("UPDATE children SET soldier_rank = $1 WHERE id = $2", [rank, child.id]);
    await pool.query("INSERT INTO jewel_ledger (child_id, delta, reason) VALUES ($1,$2,'scripture-complete')", [child.id, JEWELS_PER_COMPLETION]);
    await pool.query("UPDATE jewel_wallets SET balance = balance + $2 WHERE child_id = $1", [child.id, JEWELS_PER_COMPLETION]);
    return c.json({ stage, rank, promoted: promoted(done.rows[0].n - 1, done.rows[0].n), prevRank: before.rows[0].soldier_rank });
  }
  return c.json({ stage });
});

// --- artifacts (Ponder drawings/writings; local disk now, R2 presigned next slice) ---
app.post("/api/artifacts", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  const { child_id, scripture_id, png_base64 } = await c.req.json();
  const child = await ownChild(p.id, child_id);
  if (!child) return c.json({ error: "not found" }, 404);
  const buf = Buffer.from(png_base64 ?? "", "base64");
  if (!buf.length || buf.length > 5 * 1024 * 1024) return c.json({ error: "png required, max 5MB" }, 400);
  const name = `${child_id}-${Date.now()}.png`;
  await writeFile(join(MEDIA_DIR, basename(name)), buf);
  const url = `/media/${name}`;
  await pool.query("INSERT INTO artifacts (child_id, scripture_id, png_url) VALUES ($1,$2,$3)", [child.id, scripture_id, url]);
  await pool.query(
    `INSERT INTO progress (child_id, scripture_id, ponder_artifact_url) VALUES ($1,$2,$3)
     ON CONFLICT (child_id, scripture_id) DO UPDATE SET ponder_artifact_url = $3`,
    [child.id, scripture_id, url]
  );
  return c.json({ url }, 201);
});
app.get("/media/:name", async (c) => {
  try {
    const data = await readFile(join(MEDIA_DIR, basename(c.req.param("name"))));
    return new Response(data, { headers: { "content-type": "image/png" } });
  } catch {
    return c.json({ error: "not found" }, 404);
  }
});
// --- preview page (single-file demo of this phase; same origin, no CORS) ---
app.get("/preview", async (c) => {
  try {
    const html = await readFile(new URL("../public/preview.html", import.meta.url));
    return new Response(html, { headers: { "content-type": "text/html" } });
  } catch {
    return c.json({ error: "preview not found" }, 404);
  }
});
// --- storage mode (lets the app pick upload path without knowing secrets) ---
app.get("/api/storage", async (c) => c.json({ mode: r2Configured ? "r2" : "local" }));

// --- R2 direct upload: ticket -> app PUTs bytes -> confirm writes DB rows ---
app.post("/api/artifacts/request", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  if (!r2Configured) return c.json({ error: "r2 not configured" }, 501);
  const { child_id, kind = "ponder", ext = "png", content_type = "image/png" } = await c.req.json();
  const child = await ownChild(p.id, child_id);
  if (!child) return c.json({ error: "not found" }, 404);
  const key = objectKey(p.id, child.id, kind, ext);
  const ticket = await presignedPut(key, content_type);
  return c.json({ ...ticket, viewUrl: null }, 201);
});
app.post("/api/artifacts/confirm", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  if (!r2Configured) return c.json({ error: "r2 not configured" }, 501);
  const { child_id, scripture_id, bucket, key } = await c.req.json();
  const child = await ownChild(p.id, child_id);
  if (!child) return c.json({ error: "not found" }, 404);
  const url = `r2://${bucket}/${key}`;
  await pool.query("INSERT INTO artifacts (child_id, scripture_id, png_url) VALUES ($1,$2,$3)", [child.id, scripture_id, url]);
  await pool.query(
    `INSERT INTO progress (child_id, scripture_id, ponder_artifact_url) VALUES ($1,$2,$3)
     ON CONFLICT (child_id, scripture_id) DO UPDATE SET ponder_artifact_url = $3`,
    [child.id, scripture_id, url]
  );
  return c.json({ url, viewUrl: await presignedGet(key) }, 201);
});
app.get("/api/wallet/:childId", async (c) => {
  const p = await requireParent(c);
  if (p instanceof Response) return p;
  const child = await ownChild(p.id, c.req.param("childId"));
  if (!child) return c.json({ error: "not found" }, 404);
  const { rows } = await pool.query("SELECT balance FROM jewel_wallets WHERE child_id = $1", [child.id]);
  return c.json({ balance: rows[0]?.balance ?? 0 });
});

serve({ fetch: app.fetch, port: PORT }, () => console.log(`imeditate-api on :${PORT}`));
export { unlink as _cleanup };
