import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  serializeState,
  deserializeState,
  getCardRegistry,
  validateState,
} from "../src/logic/state.js";

describe("createInitialState", () => {
  const state = createInitialState(42);

  it("places 40 cards in dungeon and 4 in room", () => {
    assert.equal(state.dungeon.length, 40);
    assert.equal(state.room.length, 4);
  });

  it("total cards across all zones = 44", () => {
    const total =
      state.dungeon.length +
      state.room.length +
      state.discard.length +
      state.slainByWeapon.length +
      (state.equippedWeapon ? 1 : 0);
    assert.equal(total, 44);
  });

  it("health starts at 20", () => {
    assert.equal(state.health, 20);
  });

  it("gameStatus is playing", () => {
    assert.equal(state.gameStatus, "playing");
  });

  it("same seed produces identical initial state", () => {
    const a = createInitialState(999);
    const b = createInitialState(999);
    assert.deepEqual(a, b);
  });
});

describe("serialize / deserialize", () => {
  it("round-trip produces identical state", () => {
    const original = createInitialState(42);
    const json = serializeState(original);
    const restored = deserializeState(json);
    assert.deepEqual(restored, original);
  });
});

describe("getCardRegistry", () => {
  it("returns a Map with 44 entries", () => {
    const state = createInitialState(42);
    const registry = getCardRegistry(state);
    assert.equal(registry.size, 44);
  });

  it("maps IDs to card objects with correct fields", () => {
    const state = createInitialState(42);
    const registry = getCardRegistry(state);
    const card = registry.get("clubs_14");
    assert.equal(card.suit, "clubs");
    assert.equal(card.rank, 14);
    assert.equal(card.type, "monster");
    assert.equal(card.displayName, "Ace of Clubs");
  });
});

describe("validateState", () => {
  it("valid initial state passes", () => {
    const state = createInitialState(42);
    const result = validateState(state);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it("catches negative health", () => {
    const state = createInitialState(42);
    state.health = -5;
    const result = validateState(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("negative")));
  });

  it("catches health exceeding max", () => {
    const state = createInitialState(42);
    state.health = 25;
    const result = validateState(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("exceeds")));
  });

  it("catches wrong card count", () => {
    const state = createInitialState(42);
    state.dungeon.push("fake_card");
    const result = validateState(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("45")));
  });

  it("catches duplicate cards", () => {
    const state = createInitialState(42);
    state.dungeon[0] = state.room[0]; // duplicate
    const result = validateState(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("Duplicate")));
  });
});
