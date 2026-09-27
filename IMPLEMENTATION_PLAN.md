# iMeditate V1 — Implementation Plan

Source of truth: `iMeditate_PRD_A_Small_First_Version.md` + `README.md`.
Goal of V1: a child completes Ponder → Mutter → Roar on a scripture, enjoys it, returns, and feels proud watching the Soldier grow.

## Track 0 — Decisions that unblock everything (do first)

### 0A. Content/legal (parallel to engineering)

- Choose Bible translation + confirm app-use license in writing. Blocks all audio/scripture work.
- Finalize 3 Sound Mind scriptures + phrase breaks for Mutter.
- Write guiding questions × 3 age groups (4–7, 8–11, 12–17).
- Commission/produce: 3 Ponder readings (audio), 1 Mutter bed loop, 1 Roar track.
- Define rank thresholds. Proposal: Recruit (0 completions) → Private (1) → Sergeant (2) → Captain (3). Guarantees a promotion on the first finish, Captain on finishing all 3. Armies visual count = rank index.

### 0B. Technical decisions (recommendation)

| Decision | Recommendation | Why |
|---|---|---|
| App framework | Expo React Native + TypeScript (phones + tablets, iOS + Android) | One codebase, fast iteration, good audio/offline libs, easy TestFlight/Play internal testing |
| Backend | Supabase (Auth + Postgres + Storage) | Minimal user data model, row-level security, parent-owned deletes, no custom server for V1 |
| Local state | Zustand + MMKV (persisted) + TanStack Query for server sync | Survives restarts (Ponder work kept), works offline |
| Audio | expo-av, pre-bundled MP3s (no TTS, no streaming in V1) | PRD requires prepared readings; offline-safe for families |
| Drawing | Skia or SVG canvas → PNG saved locally + uploaded | Simple, no third-party kids-data risk |
| Auth | Email + magic link (parent only), no child login | Smallest safe setup; child profile is local-to-parent-account |
| Analytics (privacy-safe) | Aggregated events only: started/finished step, returns D2/D3, rank-ups. No child PII, no recordings | Maps directly to PRD §2 success questions |

**Acceptance:** translation chosen in writing; repo has `docs/DECISIONS.md` locking the above; Supabase project + TestFlight internal group exist.

## Phase 1 — Design system

### Slice 1.1 Tokens + moods

- Palette: deep blues/reds (+ neutrals), mood pairs: calm (Home/Ponder/Mutter) vs. bold (Roar/celebration). Type scale readable at 4–7 (large, read-aloud-first) through 12–17. Spacing/radius/motion (gentle vs. celebratory) tokens. Dark-calm backgrounds that keep scripture legible.
- Deliverable: `design/tokens.json` + Storybook/showcase screen.
- Acceptance: contrast AA, same screen renders in both moods.

### Slice 1.2 Components + age-group variants

- Core: buttons (big Start), cards, step progress, counter, audio player, drawing canvas, celebration sheet, Soldier avatar frame.
- Age-group switch: copy-tone hook (`useCopy(ageGroup)`), Soldier art variants (playful → heroic), read-aloud default ON for 4–7.
- Acceptance: one demo screen × 3 age groups, all copy from content files (no hardcoded strings).

### Slice 1.3 Step templates

- Layout shells for Ponder (quiet), Mutter (steady), Roar (energetic: lighting words, music). Defines where Soldier appears/reacts.
- Acceptance: designer can approve mood shift without engineering changes.

## Phase 2 — Architecture skeleton

### Slice 2.1 Data model + rules engine

```
parent(id, email) → child(id, nickname, ageGroup, soldierRank)
scripture(id, theme, text, phrases[], audioUrl, questions{4-7,8-11,12-17})
progress(childId, scriptureId, stage: ponder|mutter|roar|done, ponderArtifactUrl, mutterCount, updatedAt)
```

- Stage machine: stages unlock in order; completion of Roar = scripture done → rank recompute.
- Focus rule: `lastActiveAt`; background >5 min (excluding phone-call pause via AppState/call detection) → reset stage to Ponder, keep artifact, show Soldier warning at 4:30.
- Acceptance: unit tests for stage transitions, rank thresholds, focus reset/keep-artifact.

### Slice 2.2 Offline + sync + deletion

- Local-first: progress/artifacts in MMKV/filesystem, sync to Supabase when online; parent "Delete child" cascades locally + server (verified by re-fetch = gone).
- Acceptance: airplane-mode full session works; delete wipes all rows/files.

### Slice 2.3 Audio + AppState foundation

- Preloaded players (reading, Mutter bed, Roar track), ducking/pausing on calls, no mic permission ever requested (assert in build config).
- Acceptance: call simulation pauses clock + audio; mic permission absent in manifest.

## Phase 3 — Build slices (in order, each independently testable)

**3.1 Parent onboarding** — choose "I'm a parent" → magic-link signup → add child (nickname + age group only) → setup confirmation. PIN creation for parent area. *Accepts: setup completable unaided; no photo/location fields exist.*

**3.2 Meet the Soldier + Home** — intro to 3 steps, Home shows Soldier/rank, today's scripture + big Start, theme browser (3 items). *Accepts: child reaches Start without adult explanation (test per age group).*

**3.3 Ponder** — read-aloud playback, one-at-a-time questions, write/draw + save, "I'm done" (no timer). *Accepts: artifact persists across restart.*

**3.4 Mutter** — phrase-by-phrase (from content breaks), 20-rep counter, bed loop, no mic. *Accepts: counter pacing tunable via content config (phrase delay) without code change — mitigates PRD risk of 20 feeling long.*

**3.5 Roar** — word-lighting declaration + music, boldest UI. Completion → rank recompute. *Accepts: finishing Roar marks scripture done.*

**3.6 Celebrate + Soldier growth** — rank-up celebration vs. warm message; armies visual grows with rank. *Accepts: first completion always triggers a promotion (per thresholds).*

**3.7 Parent area (V1-minimal)** — PIN gate, setup confirmation, delete-child. Adult simple meditation using same Sound Mind content (no personal plan UI). *Accepts: wrong-PIN blocks child; delete verified.*

**3.8 Content pipeline** — `content/sound-mind/*.json` (text, phrases, questions, audio refs) validated by schema + CI check; translation license file stored. *Accepts: adding a 4th scripture later = content-only change.*

## Phase 4 — Safety, QA, family testing

- Safety audit: no ads SDKs, no chat, no mic, no prices/buy buttons, minimal-data review, deletion test. Store listing name "iMeditate", icon includes Soldier.
- Device matrix: small phone + tablet, iOS + Android, offline, interruption (call), 5-min rule warning timing.
- Family test (per PRD §2/§14): ≥1 family per age band, in person where possible. Measure: % start→Roar, D2/D3 return, Soldier excitement quotes, unaided setup, comprehension without adult help.
- Tuning levers (no redesign): Mutter phrase pacing, warning timing/copy, question wording, rank thresholds.

## Risks → mitigations (from PRD §13)

- 20 Mutter reps feel long → phrase-pacing config + observe, don't cut count first.
- 5-min rule harsh → 4:30 warning + kept Ponder work + call-pause; log restarts.
- 4–17 range → per-age-group copy/art + test each band.
- Soldier appeal → ask directly in tests; defer companion-choice to post-V1.
- Translation + Pastor Chris permissions → translation now (blocks V1), Pastor Chris request starts now for later.

## Proposed build order summary

0B decisions → 1.1 tokens → 2.1 model/rules → 1.2 components → 3.1 onboarding → 3.2 home → 3.3–3.6 steps → 3.7 parent → 1.3/3.8 polish + content → Phase 4 tests. Content track (0A) runs parallel from day one.
