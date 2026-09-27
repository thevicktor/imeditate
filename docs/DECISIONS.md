# Decisions (locked)

All technical choices for iMeditate V1 + full vision. Change only by amending this file.

## Stack

| Decision | Choice | Status |
|---|---|---|
| App framework | Expo React Native + TypeScript (iOS + Android, phones + tablets) | Locked |
| Backend API | Node (Hono or Fastify) + Drizzle ORM, Docker Compose on local device | Locked |
| Database | Local Postgres 16 (Docker volume `pgdata`, nightly `pg_dump`) | Locked |
| Auth | Better Auth, Email + Password, parent-only sessions in local Postgres | Locked |
| Storage | Cloudflare R2 (private bucket, presigned PUT/GET) | Locked |
| Local state | Zustand + MMKV persisted, TanStack Query sync to local API | Locked |
| Audio | expo-av, pre-bundled MP3s V1; R2 streaming + cache later | Locked |
| Drawing | Skia/SVG canvas → PNG local + R2 upload | Locked |
| Payments (post-V1) | RevenueCat free tier + StoreKit 2 / Play Billing; webhook to local API via Cloudflare Tunnel in sandbox | Locked |
| Push (post-V1) | Expo Push free, parent-controlled reminders only | Locked |
| Analytics | Own `events` table, aggregated, no child PII | Locked |
| Crash reporting | Firebase Crashlytics free, no PII | Locked |
| Releases V1 | Store releases only (TestFlight + Play internal); no OTA | Locked |
| Hosting | Local device for now; same schema + R2 bucket migrate to cloud later | Locked |
| Excluded | Supabase, Vercel | Locked |

## Design (source: authored design system doc)

- Tokens: `design/tokens.json` v1.0. Colours: Deep navy `#0F1E3D` (base), Signal red `#B3202A` (Roar + celebration only), Ember Amber `#D9772E` (every primary action), Ember gold `#F4B942` (earned only), Parchment `#F7F4EC` (Ponder surface), Dusk blue `#8FA6C9` (secondary), Growth green `#1E7D5C` (streaks).
- Type: Fraunces (brand voice, never scripture) + Inter (scripture, questions, UI). Scale 40/28/20/17/15/12.
- Rules: tokens never change by age (only wording + Soldier art); palette narrows with focus; scripture never decorated; Mutter = dots to 20, never numeric-only.
- Ranks V1: Recruit (0) → Private (1) → Sergeant (2) → Captain (3).

## Product scope

- V1: 1 parent + 1 child, Sound Mind × 3 scriptures, Ponder → Mutter → Roar, Soldier to Captain, PIN parent area, setup confirmation, deletion, adult simple meditation. Out: payments, shop/jewels, streaks/badges/reminders, full dashboard, Pastor Chris messages, extra themes/ranks, multi-child, personal plan.
- Full vision (post-V1, in order): multi-child + adult plan → payments → economy/engagement → content/ranks/messages/dashboard.

## Open (owner: founder)

- [ ] Bible translation choice + written app-use licence (blocks ALL content work)
- [ ] 3 Sound Mind scriptures + Mutter phrase breaks
- [ ] Guiding questions × 3 age groups
- [ ] Ponder readings (3), Mutter bed loop, Roar track
- [ ] Soldier art: playful → heroic + app icon
- [ ] Pastor Chris permission request (for later versions)
