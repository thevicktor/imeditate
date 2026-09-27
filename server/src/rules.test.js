import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  nextStage, rankFor, promoted, focusCheck, mutterDots, MUTTER_TARGET,
} from "./rules.js";

describe("stages unlock in order", () => {
  it("ponder -> mutter -> roar -> done", () => {
    assert.equal(nextStage("ponder"), "mutter");
    assert.equal(nextStage("mutter"), "roar");
    assert.equal(nextStage("roar"), "done");
    assert.equal(nextStage("done"), null);
  });
  it("rejects unknown stages", () => {
    assert.equal(nextStage("shop"), null);
  });
});

describe("ranks", () => {
  it("first finish always promotes", () => {
    assert.equal(rankFor(0), "Recruit");
    assert.equal(rankFor(1), "Private");
    assert.equal(rankFor(2), "Sergeant");
    assert.equal(rankFor(3), "Captain");
    assert.ok(promoted(0, 1));
    assert.ok(!promoted(1, 1));
  });
});

describe("focus rule", () => {
  it("continues under 4:30", () => {
    assert.equal(focusCheck({ awayMs: 60_000 }).action, "continue");
  });
  it("warns at 4:30", () => {
    assert.equal(focusCheck({ awayMs: 270_000 }).action, "warn");
  });
  it("restarts after 5 minutes, artifact kept by caller", () => {
    assert.equal(focusCheck({ awayMs: 301_000 }).action, "restart");
  });
  it("phone calls pause the clock", () => {
    assert.equal(focusCheck({ awayMs: 600_000, pausedMs: 590_000 }).action, "continue");
  });
});

describe("mutter dots", () => {
  it("row of 20, filled per repetition", () => {
    const dots = mutterDots(7);
    assert.equal(dots.length, MUTTER_TARGET);
    assert.equal(dots.filter(Boolean).length, 7);
  });
});
