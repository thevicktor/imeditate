// STUB — Phase 2 (§2.0) replaces this with Hono/Fastify + Drizzle + Better Auth + R2.
// Exists only so `docker compose up` runs end-to-end from day one.
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 3000);

createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, stub: true }));
    return;
  }
  res.writeHead(501, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not-implemented" }));
}).listen(PORT, () => console.log(`imeditate-server stub on :${PORT}`));
