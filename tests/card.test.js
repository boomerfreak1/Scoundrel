import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createCard,
  getCardType,
  getRankName,
  SUITS,
  RANKS,
} from "../src/logic/card.js";

describe("getCardType", () => {
  it("clubs and spades are monsters", () => {
    assert.equal(getCardType("clubs"), "monster");
    assert.equal(getCardType("spades"), "monster");
  });

  it("diamonds are weapons", () => {
    assert.equal(getCardType("diamonds"), "weapon");
  });

  it("hearts are potions", () => {
    assert.equal(getCardType("hearts"), "potion");
  });
});

describe("getRankName", () => {
  it("returns correct names for face cards", () => {
    assert.equal(getRankName(11), "Jack");
    assert.equal(getRankName(12), "Queen");
    assert.equal(getRankName(13), "King");
    assert.equal(getRankName(14), "Ace");
  });

  it("returns string of number for number cards", () => {
    assert.equal(getRankName(2), "2");
    assert.equal(getRankName(10), "10");
  });
});

describe("createCard", () => {
  it("produces correct type for each suit", () => {
    assert.equal(createCard("clubs", 5).type, "monster");
    assert.equal(createCard("spades", 14).type, "monster");
    assert.equal(createCard("diamonds", 7).type, "weapon");
    assert.equal(createCard("hearts", 3).type, "potion");
  });

  it("produces correct displayName for face cards", () => {
    assert.equal(createCard("clubs", 12).displayName, "Queen of Clubs");
    assert.equal(createCard("spades", 14).displayName, "Ace of Spades");
  });

  it("produces correct displayName for number cards", () => {
    assert.equal(createCard("hearts", 7).displayName, "7 of Hearts");
  });

  it("all suit/rank combinations produce unique IDs", () => {
    const ids = new Set();
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const card = createCard(suit, rank);
        assert.ok(!ids.has(card.id), `Duplicate ID: ${card.id}`);
        ids.add(card.id);
      }
    }
  });
});
