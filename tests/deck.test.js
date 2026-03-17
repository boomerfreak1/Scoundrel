import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDeck, shuffleDeck } from "../src/logic/deck.js";
import { createRNG } from "../src/logic/rng.js";

describe("buildDeck", () => {
  const deck = buildDeck();

  it("returns exactly 44 cards", () => {
    assert.equal(deck.length, 44);
  });

  it("contains 13 clubs", () => {
    assert.equal(deck.filter((c) => c.suit === "clubs").length, 13);
  });

  it("contains 13 spades", () => {
    assert.equal(deck.filter((c) => c.suit === "spades").length, 13);
  });

  it("contains 9 diamonds", () => {
    assert.equal(deck.filter((c) => c.suit === "diamonds").length, 9);
  });

  it("contains 9 hearts", () => {
    assert.equal(deck.filter((c) => c.suit === "hearts").length, 9);
  });

  it("has no red face cards (J/Q/K of hearts or diamonds)", () => {
    const bad = deck.filter(
      (c) =>
        (c.suit === "hearts" || c.suit === "diamonds") &&
        [11, 12, 13].includes(c.rank)
    );
    assert.equal(bad.length, 0);
  });

  it("has no red aces (Ace of hearts or diamonds)", () => {
    const bad = deck.filter(
      (c) =>
        (c.suit === "hearts" || c.suit === "diamonds") && c.rank === 14
    );
    assert.equal(bad.length, 0);
  });

  it("all 26 monsters have ranks 2-14", () => {
    const monsters = deck.filter((c) => c.type === "monster");
    assert.equal(monsters.length, 26);
    for (const m of monsters) {
      assert.ok(m.rank >= 2 && m.rank <= 14);
    }
  });

  it("all 9 weapons have ranks 2-10", () => {
    const weapons = deck.filter((c) => c.type === "weapon");
    assert.equal(weapons.length, 9);
    for (const w of weapons) {
      assert.ok(w.rank >= 2 && w.rank <= 10);
    }
  });

  it("all 9 potions have ranks 2-10", () => {
    const potions = deck.filter((c) => c.type === "potion");
    assert.equal(potions.length, 9);
    for (const p of potions) {
      assert.ok(p.rank >= 2 && p.rank <= 10);
    }
  });
});

describe("shuffleDeck", () => {
  it("same seed produces same order", () => {
    const deck = buildDeck();
    const a = shuffleDeck(deck, createRNG(42));
    const b = shuffleDeck(deck, createRNG(42));
    assert.deepEqual(
      a.map((c) => c.id),
      b.map((c) => c.id)
    );
  });

  it("different seeds produce different order", () => {
    const deck = buildDeck();
    const a = shuffleDeck(deck, createRNG(1));
    const b = shuffleDeck(deck, createRNG(2));
    const same = a.every((c, i) => c.id === b[i].id);
    assert.ok(!same, "Expected different orders for different seeds");
  });
});
