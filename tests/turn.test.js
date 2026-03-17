import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fillRoom,
  canAvoidRoom,
  avoidRoom,
  completeTurn,
  checkGameEnd,
  shouldCompleteTurn,
} from "../src/logic/turn.js";

function makeState(overrides = {}) {
  return {
    seed: 1,
    health: 20,
    dungeon: [
      "clubs_2",
      "clubs_3",
      "clubs_4",
      "clubs_5",
      "clubs_6",
      "clubs_7",
      "clubs_8",
      "clubs_9",
      "clubs_10",
      "clubs_11",
    ],
    room: [],
    discard: [],
    equippedWeapon: null,
    slainByWeapon: [],
    potionUsedThisTurn: false,
    lastRoomAvoided: false,
    turnCount: 0,
    cardsResolvedThisTurn: 0,
    gameStatus: "playing",
    score: null,
    lastResolvedCardId: null,
    ...overrides,
  };
}

describe("fillRoom", () => {
  it("draws correct number of cards to reach 4", () => {
    const state = makeState({ room: ["spades_2"] });
    const next = fillRoom(state);
    assert.equal(next.room.length, 4);
    assert.equal(next.dungeon.length, 7);
  });

  it("draws 4 cards into empty room", () => {
    const state = makeState();
    const next = fillRoom(state);
    assert.equal(next.room.length, 4);
    assert.equal(next.dungeon.length, 6);
  });

  it("with near-empty dungeon draws what is available", () => {
    const state = makeState({ dungeon: ["clubs_2", "clubs_3"] });
    const next = fillRoom(state);
    assert.equal(next.room.length, 2);
    assert.equal(next.dungeon.length, 0);
  });

  it("does nothing when room already has 4 cards", () => {
    const state = makeState({
      room: ["clubs_2", "clubs_3", "clubs_4", "clubs_5"],
    });
    const next = fillRoom(state);
    assert.equal(next.room.length, 4);
  });
});

describe("canAvoidRoom", () => {
  it("returns true when room has not been avoided", () => {
    const state = makeState({ room: ["clubs_2"], lastRoomAvoided: false });
    assert.equal(canAvoidRoom(state), true);
  });

  it("returns false after an avoid", () => {
    const state = makeState({ room: ["clubs_2"], lastRoomAvoided: true });
    assert.equal(canAvoidRoom(state), false);
  });

  it("returns true after a non-avoided room (normal resolution)", () => {
    const state = makeState({ room: ["clubs_2"], lastRoomAvoided: false });
    assert.equal(canAvoidRoom(state), true);
  });

  it("returns false when room is empty", () => {
    const state = makeState({ room: [], lastRoomAvoided: false });
    assert.equal(canAvoidRoom(state), false);
  });
});

describe("avoidRoom", () => {
  it("places cards at bottom of dungeon", () => {
    const state = makeState({
      dungeon: ["clubs_11", "clubs_12"],
      room: ["clubs_2", "clubs_3", "clubs_4", "clubs_5"],
    });
    const next = avoidRoom(state);
    assert.equal(next.room.length, 0);
    assert.equal(next.dungeon.length, 6);
    // Original dungeon cards first, then room cards at bottom
    assert.equal(next.dungeon[0], "clubs_11");
    assert.equal(next.dungeon[1], "clubs_12");
    assert.equal(next.dungeon[2], "clubs_2");
    assert.equal(next.dungeon[3], "clubs_3");
    assert.equal(next.lastRoomAvoided, true);
  });
});

describe("completeTurn", () => {
  it("resets all turn flags and increments turnCount", () => {
    const state = makeState({
      room: ["clubs_2"],
      potionUsedThisTurn: true,
      cardsResolvedThisTurn: 3,
      lastRoomAvoided: true,
      turnCount: 2,
    });
    const next = completeTurn(state);
    assert.equal(next.potionUsedThisTurn, false);
    assert.equal(next.cardsResolvedThisTurn, 0);
    assert.equal(next.lastRoomAvoided, false);
    assert.equal(next.turnCount, 3);
  });

  it("fills room after reset", () => {
    const state = makeState({
      room: ["clubs_2"],
      dungeon: ["spades_3", "spades_4", "spades_5"],
    });
    const next = completeTurn(state);
    assert.equal(next.room.length, 4);
  });
});

describe("checkGameEnd", () => {
  it("detects win when dungeon and room are empty", () => {
    const state = makeState({ dungeon: [], room: [] });
    assert.equal(checkGameEnd(state), "won");
  });

  it("detects loss when health <= 0", () => {
    assert.equal(checkGameEnd(makeState({ health: 0 })), "lost");
    assert.equal(checkGameEnd(makeState({ health: -5 })), "lost");
  });

  it("returns playing when game is active", () => {
    assert.equal(checkGameEnd(makeState()), "playing");
  });
});

describe("shouldCompleteTurn", () => {
  it("completes after 3 of 4 resolved", () => {
    const state = makeState({ room: ["clubs_2"], cardsResolvedThisTurn: 3 });
    assert.equal(shouldCompleteTurn(state), true);
  });

  it("does not complete after 2 of 4 resolved", () => {
    const state = makeState({
      room: ["clubs_2", "clubs_3"],
      cardsResolvedThisTurn: 2,
    });
    assert.equal(shouldCompleteTurn(state), false);
  });

  it("completes when room has 1 card and it was resolved", () => {
    const state = makeState({ room: [], cardsResolvedThisTurn: 1 });
    assert.equal(shouldCompleteTurn(state), true);
  });
});
