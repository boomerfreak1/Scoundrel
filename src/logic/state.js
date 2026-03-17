// Game state management.
// Zero browser dependencies.

import { createRNG } from "./rng.js";
import { buildDeck, shuffleDeck } from "./deck.js";
import { createCard } from "./card.js";
import { DEFAULT_CONFIG, getVariantConfig } from "./variants.js";

export function createInitialState(seed, variantId = "classic") {
  const rng = createRNG(seed);
  const deck = buildDeck();
  const shuffled = shuffleDeck(deck, rng);
  const ids = shuffled.map((c) => c.id);
  const config = getVariantConfig(variantId);

  const roomSize = Math.min(config.cardsPerRoom, ids.length);

  return {
    seed,
    variantId,
    variantConfig: config,
    health: config.startingHealth,
    dungeon: ids.slice(roomSize),
    room: ids.slice(0, roomSize),
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
  };
}

export function serializeState(state) {
  return JSON.stringify(state);
}

export function deserializeState(json) {
  return JSON.parse(json);
}

export function getCardRegistry(state) {
  const deck = buildDeck();
  const registry = new Map();
  for (const card of deck) {
    registry.set(card.id, card);
  }
  return registry;
}

export function validateState(state) {
  const errors = [];
  const config = state.variantConfig || DEFAULT_CONFIG;

  // Check health range (negative health is valid when game is lost)
  if (state.health < 0 && state.gameStatus !== "lost") {
    errors.push(`Health is negative: ${state.health}`);
  }
  if (state.health > config.maxHealth) {
    errors.push(`Health exceeds max: ${state.health}`);
  }

  // Count total cards across all zones
  const allCardIds = [
    ...state.dungeon,
    ...state.room,
    ...state.discard,
    ...state.slainByWeapon,
  ];
  if (state.equippedWeapon) {
    allCardIds.push(state.equippedWeapon);
  }

  // Endless mode may have reshuffled cards, so total can still be 44
  if (allCardIds.length !== 44) {
    errors.push(
      `Total cards across all zones is ${allCardIds.length}, expected 44`
    );
  }

  // Check for duplicates
  const seen = new Set();
  for (const id of allCardIds) {
    if (seen.has(id)) {
      errors.push(`Duplicate card found: ${id}`);
    }
    seen.add(id);
  }

  // Check gameStatus
  const validStatuses = ["playing", "won", "lost"];
  if (!validStatuses.includes(state.gameStatus)) {
    errors.push(`Invalid gameStatus: ${state.gameStatus}`);
  }

  // Check cardsResolvedThisTurn
  if (state.cardsResolvedThisTurn < 0 || state.cardsResolvedThisTurn > 3) {
    errors.push(
      `cardsResolvedThisTurn out of range: ${state.cardsResolvedThisTurn}`
    );
  }

  return { valid: errors.length === 0, errors };
}
