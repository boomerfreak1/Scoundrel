// Deck construction for Scoundrel (44 cards).
// Zero browser dependencies.

import { createCard, SUITS } from "./card.js";

// Scoundrel deck composition:
//   Clubs    2-14  (13 monsters)
//   Spades   2-14  (13 monsters)
//   Diamonds 2-10  (9 weapons) — no J/Q/K/A
//   Hearts   2-10  (9 potions) — no J/Q/K/A
// Total: 44

export function buildDeck() {
  const cards = [];
  for (const suit of SUITS) {
    const maxRank = suit === "diamonds" || suit === "hearts" ? 10 : 14;
    for (let rank = 2; rank <= maxRank; rank++) {
      cards.push(createCard(suit, rank));
    }
  }
  return cards;
}

export function shuffleDeck(deck, rng) {
  return rng.shuffle(deck);
}
