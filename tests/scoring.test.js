import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateScore, getScoreBreakdown } from "../src/logic/scoring.js";

function makeState(overrides = {}) {
  return {
    seed: 1,
    health: 20,
    dungeon: [],
    room: [],
    discard: [],
    equippedWeapon: null,
    slainByWeapon: [],
    potionUsedThisTurn: false,
    lastRoomAvoided: false,
    turnCount: 5,
    cardsResolvedThisTurn: 0,
    gameStatus: "playing",
    score: null,
    lastResolvedCardId: null,
    ...overrides,
  };
}

describe("calculateScore", () => {
  it("win score equals remaining health", () => {
    const state = makeState({ health: 12, gameStatus: "won" });
    assert.equal(calculateScore(state), 12);
  });

  it("win with potion bonus adds potion rank", () => {
    const state = makeState({
      health: 12,
      gameStatus: "won",
      lastResolvedCardId: "hearts_7",
    });
    assert.equal(calculateScore(state), 19); // 12 + 7
  });

  it("loss score is negative (health minus remaining monster values)", () => {
    const state = makeState({
      health: 0,
      gameStatus: "lost",
      dungeon: ["clubs_10", "spades_14", "diamonds_5"],
    });
    // monsters: clubs_10 (10) + spades_14 (14) = 24, diamonds_5 is weapon (ignored)
    // score: 0 - 24 = -24
    assert.equal(calculateScore(state), -24);
  });

  it("returns null for active game", () => {
    const state = makeState({ gameStatus: "playing" });
    assert.equal(calculateScore(state), null);
  });
});

describe("getScoreBreakdown", () => {
  it("includes all components for a win", () => {
    const state = makeState({ health: 15, gameStatus: "won" });
    const breakdown = getScoreBreakdown(state);
    assert.equal(breakdown.outcome, "won");
    assert.equal(breakdown.health, 15);
    assert.equal(breakdown.potionBonus, 0);
    assert.equal(breakdown.finalScore, 15);
  });

  it("includes potion bonus in breakdown", () => {
    const state = makeState({
      health: 15,
      gameStatus: "won",
      lastResolvedCardId: "hearts_8",
    });
    const breakdown = getScoreBreakdown(state);
    assert.equal(breakdown.potionBonus, 8);
    assert.equal(breakdown.finalScore, 23);
  });

  it("includes all components for a loss", () => {
    const state = makeState({
      health: 0,
      gameStatus: "lost",
      dungeon: ["clubs_10", "spades_5"],
    });
    const breakdown = getScoreBreakdown(state);
    assert.equal(breakdown.outcome, "lost");
    assert.equal(breakdown.remainingMonsters, 2);
    assert.equal(breakdown.monsterValueSum, 15);
    assert.equal(breakdown.finalScore, -15);
  });
});
