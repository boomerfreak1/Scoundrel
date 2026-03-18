import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { processCommand } from "../src/logic/commands.js";
import { createInitialState, getCardRegistry } from "../src/logic/state.js";
import { typeFromId } from "../src/logic/card.js";

function stateWithRoom(roomIds, overrides = {}) {
  // Build a minimal valid state with specific room cards
  // Remaining 44 cards go into dungeon/discard as needed
  const allIds = [];
  for (const suit of ["clubs", "spades"]) {
    for (let r = 2; r <= 14; r++) allIds.push(`${suit}_${r}`);
  }
  for (const suit of ["diamonds", "hearts"]) {
    for (let r = 2; r <= 10; r++) allIds.push(`${suit}_${r}`);
  }
  const roomSet = new Set(roomIds);
  const equipped = overrides.equippedWeapon ? [overrides.equippedWeapon] : [];
  const slain = overrides.slainByWeapon || [];
  const discard = overrides.discard || [];
  const usedSet = new Set([
    ...roomIds,
    ...equipped,
    ...slain,
    ...discard,
  ]);
  const dungeon =
    overrides.dungeon !== undefined
      ? overrides.dungeon
      : allIds.filter((id) => !usedSet.has(id));
  return {
    seed: 1,
    health: overrides.health ?? 20,
    dungeon,
    room: roomIds,
    discard,
    equippedWeapon: overrides.equippedWeapon ?? null,
    slainByWeapon: slain,
    potionUsedThisTurn: overrides.potionUsedThisTurn ?? false,
    lastRoomAvoided: overrides.lastRoomAvoided ?? false,
    turnCount: overrides.turnCount ?? 0,
    cardsResolvedThisTurn: overrides.cardsResolvedThisTurn ?? 0,
    gameStatus: overrides.gameStatus ?? "playing",
    score: overrides.score ?? null,
    lastResolvedCardId: overrides.lastResolvedCardId ?? null,
  };
}

describe("processCommand: SELECT_CARD", () => {
  it("on a weapon equips it", () => {
    const state = stateWithRoom([
      "diamonds_7",
      "clubs_5",
      "spades_3",
      "hearts_4",
    ]);
    const { state: next, result } = processCommand(state, {
      type: "SELECT_CARD",
      payload: { cardIndex: 0 },
    });
    assert.equal(result.success, true);
    assert.equal(next.equippedWeapon, "diamonds_7");
    assert.ok(!next.room.includes("diamonds_7"));
  });

  it("on a potion heals", () => {
    const state = stateWithRoom(
      ["hearts_5", "clubs_3", "spades_4", "diamonds_2"],
      { health: 15 }
    );
    const { state: next, result } = processCommand(state, {
      type: "SELECT_CARD",
      payload: { cardIndex: 0 },
    });
    assert.equal(result.success, true);
    assert.equal(next.health, 20);
  });

  it("on a monster triggers combat", () => {
    const state = stateWithRoom([
      "clubs_5",
      "spades_3",
      "diamonds_7",
      "hearts_4",
    ]);
    const { state: next, result } = processCommand(state, {
      type: "SELECT_CARD",
      payload: { cardIndex: 0 },
    });
    assert.equal(result.success, true);
    assert.equal(next.health, 15); // barehanded: 20 - 5
    assert.ok(next.discard.includes("clubs_5"));
  });

  it("on a monster with weapon uses weapon automatically", () => {
    const state = stateWithRoom(
      ["clubs_5", "spades_3", "diamonds_2", "hearts_4"],
      { equippedWeapon: "diamonds_7" }
    );
    const { state: next, result } = processCommand(state, {
      type: "SELECT_CARD",
      payload: { cardIndex: 0 },
    });
    assert.equal(result.success, true);
    assert.equal(next.health, 20); // weapon 7 vs monster 5 = 0 damage
    assert.ok(next.slainByWeapon.includes("clubs_5"));
  });

  it("invalid index returns error", () => {
    const state = stateWithRoom(["clubs_5", "spades_3"]);
    const { result } = processCommand(state, {
      type: "SELECT_CARD",
      payload: { cardIndex: 5 },
    });
    assert.equal(result.success, false);
  });
});

describe("processCommand: FIGHT_BAREHANDED", () => {
  it("deals full damage even with weapon equipped", () => {
    const state = stateWithRoom(
      ["clubs_5", "spades_3", "diamonds_2", "hearts_4"],
      { equippedWeapon: "diamonds_7" }
    );
    const { state: next, result } = processCommand(state, {
      type: "FIGHT_BAREHANDED",
      payload: { cardIndex: 0 },
    });
    assert.equal(result.success, true);
    assert.equal(next.health, 15); // full 5 damage
    assert.ok(next.discard.includes("clubs_5"));
    assert.equal(next.equippedWeapon, "diamonds_7"); // weapon untouched
  });

  it("rejects non-monster card", () => {
    const state = stateWithRoom(["diamonds_7", "clubs_5"]);
    const { result } = processCommand(state, {
      type: "FIGHT_BAREHANDED",
      payload: { cardIndex: 0 },
    });
    assert.equal(result.success, false);
  });
});

describe("processCommand: AVOID_ROOM", () => {
  it("moves cards to dungeon bottom", () => {
    const state = stateWithRoom(
      ["clubs_5", "spades_3", "diamonds_7", "hearts_4"],
      { dungeon: ["clubs_14", "clubs_13", "clubs_12", "clubs_11"] }
    );
    const { state: next, result } = processCommand(state, {
      type: "AVOID_ROOM",
      payload: {},
    });
    assert.equal(result.success, true);
    // Room cards moved to bottom, then 4 drawn from top
    assert.equal(next.room.length, 4);
  });

  it("rejected after previous avoid", () => {
    const state = stateWithRoom(
      ["clubs_5", "spades_3", "diamonds_7", "hearts_4"],
      { lastRoomAvoided: true }
    );
    const { result } = processCommand(state, {
      type: "AVOID_ROOM",
      payload: {},
    });
    assert.equal(result.success, false);
  });
});

describe("processCommand: turn completion", () => {
  it("after 3 cards resolved, turn completes automatically", () => {
    // Set up a room with 4 cards and enough dungeon to draw from
    let state = stateWithRoom([
      "hearts_2",
      "hearts_3",
      "hearts_4",
      "clubs_2",
    ]);
    // Resolve 3 cards (3 potions)
    let r;
    ({ state, result: r } = processCommand(state, {
      type: "SELECT_CARD",
      payload: { cardIndex: 0 },
    }));
    assert.equal(state.cardsResolvedThisTurn, 1);

    ({ state, result: r } = processCommand(state, {
      type: "SELECT_CARD",
      payload: { cardIndex: 0 },
    }));
    assert.equal(state.cardsResolvedThisTurn, 2);

    ({ state, result: r } = processCommand(state, {
      type: "SELECT_CARD",
      payload: { cardIndex: 0 },
    }));
    // Turn should have completed and reset
    assert.equal(state.cardsResolvedThisTurn, 0);
    assert.equal(state.turnCount, 1);
    assert.equal(state.room.length, 4); // refilled
  });
});

describe("processCommand: HONE_WEAPON", () => {
  it("hones weapon successfully", () => {
    const state = stateWithRoom(
      ["diamonds_8", "clubs_5", "spades_3", "hearts_4"],
      { equippedWeapon: "diamonds_7", slainByWeapon: ["clubs_4"] }
    );
    const { state: next, result } = processCommand(state, {
      type: "HONE_WEAPON",
      payload: { cardIndex: 0 },
    });
    assert.equal(result.success, true);
    assert.equal(next.equippedWeapon, "diamonds_6"); // rank dropped by 1
    assert.deepEqual(next.slainByWeapon, []); // degradation reset
    assert.ok(!next.room.includes("diamonds_8"));
    assert.ok(next.discard.includes("diamonds_8"));
  });

  it("generates WEAPON_HONED event", () => {
    const state = stateWithRoom(
      ["diamonds_8", "clubs_5", "spades_3", "hearts_4"],
      { equippedWeapon: "diamonds_7", slainByWeapon: ["clubs_4"] }
    );
    const { result } = processCommand(state, {
      type: "HONE_WEAPON",
      payload: { cardIndex: 0 },
    });
    const honeEvent = result.events.find((e) => e.type === "WEAPON_HONED");
    assert.ok(honeEvent);
    assert.equal(honeEvent.cardId, "diamonds_8");
    assert.equal(honeEvent.weaponId, "diamonds_7");
    assert.equal(honeEvent.newWeaponId, "diamonds_6");
  });

  it("fails when diamond rank <= degradation cap", () => {
    const state = stateWithRoom(
      ["diamonds_3", "clubs_5", "spades_3", "hearts_4"],
      { equippedWeapon: "diamonds_7", slainByWeapon: ["clubs_6"] }
    );
    const { result } = processCommand(state, {
      type: "HONE_WEAPON",
      payload: { cardIndex: 0 },
    });
    assert.equal(result.success, false);
  });

  it("fails when no degradation exists", () => {
    const state = stateWithRoom(
      ["diamonds_8", "clubs_5", "spades_3", "hearts_4"],
      { equippedWeapon: "diamonds_7" }
    );
    const { result } = processCommand(state, {
      type: "HONE_WEAPON",
      payload: { cardIndex: 0 },
    });
    assert.equal(result.success, false);
  });

  it("fails on non-weapon card", () => {
    const state = stateWithRoom(
      ["clubs_5", "spades_3", "diamonds_8", "hearts_4"],
      { equippedWeapon: "diamonds_7", slainByWeapon: ["clubs_4"] }
    );
    const { result } = processCommand(state, {
      type: "HONE_WEAPON",
      payload: { cardIndex: 0 },
    });
    assert.equal(result.success, false);
  });

  it("counts as a resolved card toward turn completion", () => {
    // Room has 4 cards, resolve 2 others first, then hone = 3 resolved, turn completes
    let state = stateWithRoom(
      ["hearts_3", "hearts_4", "diamonds_8", "clubs_5"],
      { equippedWeapon: "diamonds_7", slainByWeapon: ["clubs_4"] }
    );
    // Resolve 2 potions first
    ({ state } = processCommand(state, {
      type: "SELECT_CARD",
      payload: { cardIndex: 0 },
    }));
    ({ state } = processCommand(state, {
      type: "SELECT_CARD",
      payload: { cardIndex: 0 },
    }));
    assert.equal(state.cardsResolvedThisTurn, 2);
    // Now hone the diamond (3rd resolve)
    const { state: next, result } = processCommand(state, {
      type: "HONE_WEAPON",
      payload: { cardIndex: 0 },
    });
    assert.equal(result.success, true);
    assert.equal(next.cardsResolvedThisTurn, 0); // reset after turn complete
    assert.equal(next.turnCount, 1);
  });
});

describe("processCommand: game over", () => {
  it("command on a finished game returns error", () => {
    const state = stateWithRoom(["clubs_5"], { gameStatus: "won" });
    const { result } = processCommand(state, {
      type: "SELECT_CARD",
      payload: { cardIndex: 0 },
    });
    assert.equal(result.success, false);
  });
});
