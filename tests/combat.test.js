import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canUseWeapon,
  calculateWeaponDamage,
  calculateBarehandedDamage,
  resolveMonsterWithWeapon,
  resolveMonsterBarehanded,
  resolveWeapon,
  resolvePotion,
} from "../src/logic/combat.js";

function makeState(overrides = {}) {
  return {
    seed: 1,
    health: 20,
    dungeon: [],
    room: ["clubs_12", "spades_6", "diamonds_7", "hearts_5"],
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

describe("calculateBarehandedDamage", () => {
  it("equals monster rank", () => {
    assert.equal(calculateBarehandedDamage(12), 12);
    assert.equal(calculateBarehandedDamage(2), 2);
  });
});

describe("calculateWeaponDamage", () => {
  it("equals max(0, monster - weapon)", () => {
    assert.equal(calculateWeaponDamage(12, 7), 5);
    assert.equal(calculateWeaponDamage(5, 7), 0);
    assert.equal(calculateWeaponDamage(7, 7), 0);
  });

  it("weapon with rank higher than monster deals 0", () => {
    assert.equal(calculateWeaponDamage(3, 10), 0);
  });
});

describe("canUseWeapon", () => {
  it("returns false with no weapon equipped", () => {
    const state = makeState();
    assert.equal(canUseWeapon(state, "clubs_12"), false);
  });

  it("returns true with weapon and no prior kills", () => {
    const state = makeState({ equippedWeapon: "diamonds_5" });
    assert.equal(canUseWeapon(state, "clubs_12"), true);
  });

  it("after killing rank 12, can fight rank 6 (allowed)", () => {
    const state = makeState({
      equippedWeapon: "diamonds_5",
      slainByWeapon: ["clubs_12"],
    });
    assert.equal(canUseWeapon(state, "spades_6"), true);
  });

  it("after killing rank 6, cannot fight rank 12 (rejected)", () => {
    const state = makeState({
      equippedWeapon: "diamonds_5",
      slainByWeapon: ["clubs_12", "spades_6"],
    });
    assert.equal(canUseWeapon(state, "clubs_12"), false);
  });

  it("after killing rank 6, can fight rank 6 (equal is allowed)", () => {
    const state = makeState({
      equippedWeapon: "diamonds_5",
      slainByWeapon: ["clubs_12", "spades_6"],
    });
    assert.equal(canUseWeapon(state, "clubs_6"), true);
  });
});

describe("resolveWeapon", () => {
  it("equipping new weapon discards old weapon and its slain monsters", () => {
    const state = makeState({
      room: ["diamonds_7", "diamonds_3", "clubs_5", "hearts_4"],
      equippedWeapon: "diamonds_5",
      slainByWeapon: ["clubs_12", "spades_6"],
    });
    const next = resolveWeapon(state, "diamonds_7");
    assert.equal(next.equippedWeapon, "diamonds_7");
    assert.deepEqual(next.slainByWeapon, []);
    assert.ok(next.discard.includes("diamonds_5"));
    assert.ok(next.discard.includes("clubs_12"));
    assert.ok(next.discard.includes("spades_6"));
    assert.ok(!next.room.includes("diamonds_7"));
  });
});

describe("resolvePotion", () => {
  it("first potion heals", () => {
    const state = makeState({ health: 15 });
    const next = resolvePotion(state, "hearts_5");
    assert.equal(next.health, 20);
    assert.equal(next.potionUsedThisTurn, true);
  });

  it("second potion in same turn is wasted", () => {
    const state = makeState({ health: 10, potionUsedThisTurn: true });
    const next = resolvePotion(state, "hearts_5");
    assert.equal(next.health, 10);
    assert.equal(next.potionUsedThisTurn, true);
    assert.ok(next.discard.includes("hearts_5"));
  });

  it("cannot heal above 20", () => {
    const state = makeState({ health: 18 });
    const next = resolvePotion(state, "hearts_5");
    assert.equal(next.health, 20);
  });

  it("healing from 18 with a 5 results in 20 (capped)", () => {
    const state = makeState({ health: 18 });
    const next = resolvePotion(state, "hearts_5");
    assert.equal(next.health, 20);
  });
});
