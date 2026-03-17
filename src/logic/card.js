// Card data model and helpers.
// Zero browser dependencies.

export const SUITS = ["clubs", "spades", "diamonds", "hearts"];
export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export function getCardType(suit) {
  if (suit === "clubs" || suit === "spades") return "monster";
  if (suit === "diamonds") return "weapon";
  if (suit === "hearts") return "potion";
  throw new Error(`Unknown suit: ${suit}`);
}

export function getRankName(rank) {
  if (rank === 11) return "Jack";
  if (rank === 12) return "Queen";
  if (rank === 13) return "King";
  if (rank === 14) return "Ace";
  return String(rank);
}

function suitDisplayName(suit) {
  return suit.charAt(0).toUpperCase() + suit.slice(1);
}

export function rankFromId(cardId) {
  return parseInt(cardId.split("_")[1], 10);
}

export function suitFromId(cardId) {
  return cardId.split("_")[0];
}

export function typeFromId(cardId) {
  return getCardType(suitFromId(cardId));
}

export function createCard(suit, rank) {
  return {
    id: `${suit}_${rank}`,
    suit,
    rank,
    type: getCardType(suit),
    displayName: `${getRankName(rank)} of ${suitDisplayName(suit)}`,
  };
}
