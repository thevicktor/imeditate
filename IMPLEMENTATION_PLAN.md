# iMeditate — Full Implementation Plan (V1 + everything after)

Source of truth: `iMeditate_PRD_A_Small_First_Version.md` + `README.md`.
- V1 goal: a child completes Ponder → Mutter → Roar on a scripture, enjoys it, returns, and feels proud watching the Soldier grow.
- Full vision (post-V1, from PRD §4 "Not included"): payments/subscriptions, jewel shop + jewels, streaks/badges/reminders, full parent progress view, Pastor Chris Oyakhilome messages, more themes, ranks beyond Captain (General → stars → cities/continents/regions), multiple children, parent personal plan.
- Hosting constraint: local device for now. No Supabase. No Vercel. Free alternatives throughout.

## Track 0 — Decisions that unblock everything

### 0A. Content/legal (parallel to engineering, starts day one)

- V1: choose Bible translation + confirm app-use license in writing (blocks ALL scripture/audio work). Finalize 3 Sound Mind scriptures + Mutter phrase breaks. Guiding questions × 3 age groups (4–7, 8–11, 12–17). Produce: 3 Ponder readings, 1 Mutter bed loop, 1 Roar track.
- Full: translation license must cover downloadable/streamed audio + additional themes (negotiate now, not per-theme). Pastor Chris permission request starts in V1 (needed only post-V1): scope = which messages, clip vs. full, transcription rights, territory, expiry. Rank-ladder story bible: General → stars → ruling cities/continents/regions with gentle pacing (XP curve defined in §2.1, content-gated so V1 ships thresholds for Captain only).
- Rank thresholds V1 proposal: Recruit (0) → Private (1) → Sergeant (2) → Captain (3). First finish always promotes.

### 0B. Technical decisions (locked in `docs/DECISIONS.md`)

| Decision | Choice (free / local-first) | Why |
|---|---|---|
| App framework | Expo React Native + TypeScript, phones + tablets, iOS + Android | One codebase, EAS dev builds, store releases |
| Backend API | Node (Hono or Fastify) + Drizzle ORM, runs on local device via Docker Compose | No Supabase, no Vercel; phone hits `http://<mac-lan-ip>:3000` on same WiFi |
| Database | Local Postgres (Docker Compose on this Mac) | Full SQL schema below; zero hosting cost; LAN-reachable for device testing |
| Auth | Better Auth (email magic link, parent-only sessions, session rows in local Postgres) | No Supabase Auth; parent PIN + optional biometrics for parent area |
| Storage | Cloudflare R2 (S3-compatible; free tier 10 GB + zero egress) | Ponder PNGs, audio bundles, message clips via presigned PUT/GET URLs |
| Local state | Zustand + MMKV persisted, TanStack Query sync to local API | Offline-first sessions; Ponder artifacts survive restarts |
| Audio | expo-av, pre-bundled MP3s in V1; R2-hosted streaming with cache later | Offline-safe for family testing; no mic permission ever |
| Drawing | Skia/SVG canvas → PNG local + R2 upload | No kids-data third party |
| Payments (post-V1) | RevenueCat free tier + StoreKit 2 / Play Billing; webhook lands on local API (via Cloudflare Tunnel during sandbox tests) | No custom receipt crypto; kids never see prices (parent-area only, PIN-gated) |
| Push (post-V1) | Expo Push (free) → FCM/APNs; parent-controlled reminders only | No direct child targeting |
| Analytics | Own `events` table in local Postgres (aggregated, no PII) | Zero vendor, matches no-PII rule; PRD §2 metrics |
| Crash/logs | Firebase Crashlytics (free, no PII) | Sentry free tier also fine; Crashlytics simplest free crash-only option |
| Releases V1 | Store releases only (TestFlight internal + Play internal); no OTA service | Free; EAS Update self-hosted server deferred to post-V1 if OTA ever needed |
| Hosting | Local device for now (Mac = API + Postgres; R2 = only cloud piece) | No Supabase, no Vercel, minimal spend |

**Acceptance:** translation license filed; DECISIONS.md merged; `docker compose up` gives API + Postgres; R2 bucket + presigned upload verified end-to-end; RevenueCat project exists (post-V1 use); TestFlight internal group exists.

## Phase 1 — Design system (V1 + reserved for full)

**1.1 Tokens + moods.** Deep blues/reds + neutrals; calm (Home/Ponder/Mutter) vs. bold (Roar/celebration) moods; type scale 4–7 (large, read-aloud-first) → 12–17; motion tokens gentle vs. celebratory; AA contrast. Deliverable: `design/tokens.json` + showcase screen.

**1.2 Components (V1 + full placeholders).** V1: big Start button, cards, step progress, 20-rep counter, audio player, drawing canvas, celebration sheet, Soldier avatar frame. Full reserves same API for: shop cards, jewel balance pill, badge grid, streak flame, parent charts, paywall sheet, message player. Age-group switch via `useCopy(ageGroup)`; Soldier art playful → heroic. Acceptance: one demo screen × 3 age groups, zero hardcoded strings (all from content files).

**1.3 Step + shell templates.** Ponder (quiet), Mutter (steady), Roar (energetic word-lighting), plus reserved shells: Shop, Badges, Parent Dashboard, Paywall (never reachable by child in V1 — navigation guard tested).

## Phase 2 — Architecture

### 2.0 Local backend service (new — replaces BaaS)

- `server/` (Node + Hono/Fastify + Drizzle + Better Auth + R2 SDK) running on this Mac via Docker Compose (`postgres`, `api`). Phone on same WiFi calls `http://<mac-lan-ip>:3000`.
- Better Auth: email magic-link (parent only, SMTP via free tier e.g. Resend free / Gmail app password for dev), sessions stored in local Postgres, PIN hash checked at parent-area gate. Children never authenticate — all child writes go through parent session + `parent_id` ownership check in API middleware.
- R2: private bucket; API mints presigned PUT (Ponder PNG upload) and presigned GET (audio/message streaming); keys `/{parentId}/{childId}/...`. Bundled V1 audio ships in-app; R2 path exercised by artifact uploads from day one.
- Public-URL note: store/payment webhooks (post-V1 sandbox tests) need a public endpoint → use Cloudflare Tunnel (`cloudflared`) pointed at local API only during webhook testing. No permanent hosting.
- Acceptance: cold start = `docker compose up`; magic-link login works from physical device over LAN; presigned R2 round-trip verified.

### 2.1 Database (local Postgres — build full schema in V1, enforce V1 subset in app)

```sql
-- identity (V1)
parents(id uuid pk, email citext unique, pin_hash text, created_at timestamptz);
children(id uuid pk, parent_id uuid fk, nickname text, age_group text
  check (age_group in ('4-7','8-11','12-17')), soldier_rank text default 'Recruit',
  created_at timestamptz);
-- content (V1 + full)
themes(id text pk, title text, is_free bool, min_entitlement text);
scriptures(id text pk, theme_id fk, ref text, text text, phrases jsonb,
  audio_url text, questions jsonb /* per age group */, sort int);
progress(child_id fk, scripture_id fk, stage text, ponder_artifact_url text,
  mutter_count int default 0, updated_at timestamptz, pk(child_id, scripture_id));
artifacts(id uuid pk, child_id fk, scripture_id fk, png_url text, created_at timestamptz);
-- progression/economy (tables ship in V1 migration; features gated post-V1)
ranks(name text pk, level int, xp_required int, story_beat text);
jewel_wallets(child_id pk fk, balance int default 0);
jewel_ledger(id uuid pk, child_id fk, delta int, reason text, created_at timestamptz);
shop_items(sku text pk, title text, price_jewels int, art_url text, rank_required text);
owned_items(child_id fk, sku fk, equipped bool, pk(child_id, sku));
streaks(child_id pk fk, current int, longest int, last_done_date date);
badges(code text pk, title text, art_url text, rule jsonb);
earned_badges(child_id fk, code fk, earned_at timestamptz, pk(child_id, code));
devices(parent_id fk, expo_push_token text pk, created_at timestamptz);
reminder_settings(parent_id pk fk, enabled bool, hour int, days int[]);
-- payments (post-V1, schema ready)
products(sku text pk, platform text, type text /* sub|pack */, entitlement text);
entitlements(parent_id fk, entitlement text, expires_at timestamptz, pk(parent_id, entitlement));
purchase_events(id uuid pk, parent_id fk, platform text, product_sku text,
  revenuecat_id text unique, status text, created_at timestamptz);
-- messages + adult plan (post-V1)
pastor_messages(id text pk, title text, audio_url text, transcript_url text,
  license_ref text, sort int);
adult_progress(parent_id fk, scripture_id fk, stage text, updated_at timestamptz,
  pk(parent_id, scripture_id));
-- analytics (aggregated, no PII)
events(id uuid pk, parent_id fk null, event text, props jsonb, created_at timestamptz);
```

- Ownership (no RLS — enforced in API): middleware resolves parent from Better Auth session; every child/data query scoped to `parent_id`; cross-parent access tests deny. Ledger append-only (balance = sum, never direct update). Delete-child cascades rows + R2 objects (verified by re-fetch + HEAD on old URLs = gone).
- XP/pacing: V1 thresholds as above; post-Captain curve flattens (e.g., General 8, stars 15/25/40, cities… defined in `ranks` so pacing tunes without code).
- Migrations: Drizzle forward-only migrations in repo, applied to local Postgres on `compose up`. Nightly `pg_dump` to Mac disk (documented restore command).
- Acceptance: migration applies clean on fresh volume; ownership tests deny cross-parent reads/writes; delete wipes rows + R2 files.

### 2.2 Rules engines (unit-tested, content-driven)

- Stage machine: ponder → mutter → roar → done, unlock in order; Roar completion = scripture done → recompute rank + streak + badges + jewels (V1 computes rank only; other engines run but rewards hidden until their UI ships — keeps ledger consistent from day one).
- Focus rule: `lastActiveAt`; background >5 min (call interruptions pause via AppState/phone-state) → stage resets to Ponder, artifact kept, Soldier warning at 4:30.
- Mutter pacing: phrase delay + rep target (20) in content config so 20-rep fatigue tunes without code (PRD risk).
- Acceptance: tests for transitions, rank/streak/badge/ledger math, focus reset + artifact retention.

### 2.3 Offline + sync + Storage (R2)

- Local-first MMKV/filesystem; sync to local API on reconnect; R2 keys `/{parentId}/{childId}/...` via presigned URLs. Ponder PNGs queued uploads. Acceptance: full session in airplane mode; delete wipes local + Postgres + R2.

### 2.4 Audio + AppState

- Preloaded expo-av players; call duck/pause; assert no mic permission in manifests. Post-V1: R2 streaming with cache for extended library + Pastor Chris clips. Acceptance: call simulation pauses clock + audio.

### 2.5 Payments architecture (built post-V1, designed now)

- Catalog in `products`; paywall only inside PIN-gated parent area; child navigation can never route to it (guard test). Flow: parent buys via StoreKit/Play → RevenueCat webhook → local API route verifies (via Cloudflare Tunnel in sandbox) → upserts `entitlements` + `purchase_events` → app unlocks themes/ranks. Restore-purchases on reinstall. Receipts server-side only. Children never see prices/buy buttons (PRD §11). Acceptance: sandbox purchase → entitlement → unlock; refund/revoke → entitlement expires; restore works.

### 2.6 Notifications architecture (post-V1)

- `devices` + `reminder_settings` (parent-owned); local scheduler (node-cron in API, or device cron hitting API) sends gentle reminders via Expo Push to parent device only; no direct child targeting; quiet hours; one-tap disable. Acceptance: opt-in → scheduled → disable stops all.

## Phase 3 — V1 build slices (in order, each demoable)

3.1 Parent onboarding: "I'm a parent" → Better Auth magic link → add ONE child (nickname + age group) → confirmation + PIN. No photo/location/school fields exist. Acceptance: unaided setup against local API over LAN.
3.2 Meet Soldier + Home: intro to 3 steps; Home = Soldier/rank, today's scripture + big Start, theme browser (3 items). Acceptance: child reaches Start unaided per age band.
3.3 Ponder: read-aloud, sequential questions, write/draw save, "I'm done", no timer. Acceptance: artifact survives restart (local + R2 URL in `artifacts`).
3.4 Mutter: phrase-by-phrase, 20-rep counter, bed loop, no mic. Acceptance: pacing tunable via content.
3.5 Roar: word-lighting + music, boldest UI; completion marks scripture done.
3.6 Celebrate + growth: rank-up celebration vs. warm message; armies visual grows. Acceptance: first completion always promotes.
3.7 Parent area V1-minimal: PIN gate, confirmation, delete-child; adult simple meditation on Sound Mind (no personal plan UI yet).
3.8 Content pipeline: `content/sound-mind/*.json` schema-validated in CI; license file stored. Acceptance: 4th scripture = content-only change.

## Phase 4 — Full-scope slices (post-V1, in dependency order)

4.1 Multi-child + adult personal plan: child switcher (parent-gated add), per-child Soldier/rank/progress; `adult_progress` + adult home/plan UI reusing step templates. Acceptance: 3 children + parent plan coexist; delete one child leaves others intact.
4.2 Entitlements + paywall (parent only): products (e.g., extra themes, rank-extension pack), sandbox-tested purchase/restore/expire; gating by `entitlements`. Acceptance: no-purchase V1 state unchanged; child can't reach paywall (automated nav test).
4.3 Jewel economy + shop: earn jewels on completion/streak/badge (ledger reasons), spend on `shop_items` (rank-gated, equip/own), balance = ledger sum. Acceptance: double-spend impossible; history auditable.
4.4 Streaks + badges + reminders: streak calc (timezone-safe, parent-local), badge rules engine, reminder opt-in + scheduling + disable. Acceptance: streak survives offline; badge awarded once; reminders stop on disable.
4.5 Content expansion: new themes (content PRs only), full rank ladder art/story (General → stars → cities/continents/regions) with gentle pacing from `ranks` table. Acceptance: finishing all V1 content no longer caps progression visually.
4.6 Pastor Chris messages: licensed clips + transcripts in `pastor_messages` (R2-hosted), dedicated player (parent area + age-appropriate surfacing TBD), license_ref displayed in-app. Acceptance: unlicensed item can't ship (CI license check).
4.7 Full parent dashboard: per-child streaks, time spent, stage reached per scripture; export/delete; weekly summary. Acceptance: answers PRD full-plan progress questions without exposing child PII anywhere new.

## Phase 5 — Safety, compliance, store readiness

- Kids safety: no ads SDKs, no chat, no mic, no prices in child flows, minimal data (nickname + age group), private R2 storage, parent delete anytime (PRD §11). Age-rating questionnaires answered from this doc.
- Privacy law: COPPA/GDPR-K posture — parental consent at signup, data-minimization review, retention/deletion policy, DPAs with Cloudflare/RevenueCat; analytics contains no child PII. Note: local Postgres = you are the data custodian — encrypt disk (FileVault), document backup encryption.
- Store assets: name "iMeditate", Soldier icon, screenshots per age band, privacy policy + terms + support URL, permission justifications (notifications only, parent-initiated).
- Acceptance: pre-submission checklist signed; mic/ads SDK scan clean; deletion end-to-end verified (rows + R2).

## Phase 6 — DevOps, QA, family testing, launch (local-first)

- Env: this Mac is dev+test (`docker compose up`: postgres + api; nightly `pg_dump`). No Vercel, no Supabase projects. Content PRs validated by CI (GitHub Actions free minutes). EAS dev/internal builds pointed at LAN URL; prod builds pointed at future cloud API (migration path: same Drizzle migrations + R2 bucket reused).
- QA matrix: small phone + tablet × iOS/Android; offline; call interruption; 5-min warning timing; PIN brute-force lockout; purchase sandbox + restore + refund (via tunnel); reminder on/off.
- Family testing (PRD §2/§14): ≥1 family per age band, in person where possible. Metrics: % start→Roar, D2/D3 return, Soldier excitement, unaided setup, comprehension without adult help. Tuning levers without redesign: Mutter pacing, warning copy/timing, question wording, rank/XP curve, reminder timing.
- Launch readiness: translation license filed, Soldier/ranks/icon final, support inbox, rollback plan (store build rollback + migration compatibility).

## Build order summary

0B decisions → `server/` + compose (Postgres + API + Better Auth + R2 wiring) → full-schema migration → 1.1 tokens → 2.2 rules engines → 1.2 components → 3.1–3.8 V1 → 4.1 multi-child/adult → 4.2 payments → 4.3–4.4 economy/engagement → 4.5–4.7 content/messages/dashboard → Phase 5–6 hardening/launch. Content/legal track (0A) runs parallel from day one. Cloud migration later = lift same Postgres schema + API + R2 bucket to hosted infra; app already talks HTTP to API, so only base-URL + auth-secret rotation changes.
