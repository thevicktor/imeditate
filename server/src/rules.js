// Rules engine (plan §2.2). Pure functions — no I/O, fully unit-tested.
// Thresholds mirror the `ranks` seed in server/drizzle/0001_schema.sql.
export const STAGES = ["ponder", "mutter", "roar", "done"];

export const RANKS = [
  { name: "Recruit", completions: 0 },
  { name: "Private", completions: 1 },
  { name: "Sergeant", completions: 2 },
  { name: "Captain", completions: 3 },
];

export const MUTTER_TARGET = 20; // tunable per content item (PRD risk)
export const FOCUS_LIMIT_S = 5 * 60; // restart from Ponder after 5 min away
export const FOCUS_WARN_S = 4 * 60 + 30; // Soldier warns at 4:30
export const JEWELS_PER_COMPLETION = 3; // computed from day one, UI ships post-V1

/** Next stage allowed, or null. Stages unlock strictly in order. */
export function nextStage(stage) {
  const i = STAGES.indexOf(stage);
  if (i === -1 || i === STAGES.length - 1) return null;
  return STAGES[i + 1];
}

/** Rank for a number of completed scriptures. First finish always promotes. */
export function rankFor(completions) {
  let rank = RANKS[0].name;
  for (const r of RANKS) if (completions >= r.completions) rank = r.name;
  return rank;
}

/** True when rank changes between two completion counts (celebration vs warm message). */
export function promoted(completionsBefore, completionsAfter) {
  return rankFor(completionsBefore) !== rankFor(completionsAfter);
}

/**
 * Focus rule. Returns { action } where action is:
 * 'continue' | 'warn' (Soldier: come back within a minute) | 'restart' (back to Ponder, artifact kept).
 * Phone-call interruptions pause the clock (pausedMs excluded from away time).
 */
export function focusCheck({ awayMs, pausedMs = 0 }) {
  const awayS = Math.max(0, awayMs - pausedMs) / 1000;
  if (awayS > FOCUS_LIMIT_S) return { action: "restart" };
  if (awayS >= FOCUS_WARN_S) return { action: "warn" };
  return { action: "continue" };
}

/** Mutter progress as dots: array of 20 booleans (filled = said). Never numeric-only in UI. */
export function mutterDots(saidCount, target = MUTTER_TARGET) {
  return Array.from({ length: target }, (_, i) => i < saidCount);
}
