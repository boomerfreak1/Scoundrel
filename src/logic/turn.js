// Turn sequencing and room management.
// Zero browser dependencies.

import { typeFromId } from "./card.js";
import { canUseWeapon } from "./combat.js";
import { getConfig } from "./variants.js";

export function fillRoom(state) {
  const config = getConfig(state);
  const roomSize = config.cardsPerRoom;
  let dungeon = state.dungeon;

  // Endless mode: reshuffle discard into dungeon when dungeon is empty
  if (config.endless && dungeon.length === 0 && state.discard.length > 0) {
    dungeon = [...state.discard];
    state = { ...state, dungeon, discard: [] };
  }

  const needed = roomSize - state.room.length;
  const canDraw = Math.min(needed, dungeon.length);
  if (canDraw === 0) return state;
  return {
    ...state,
    room: [...state.room, ...dungeon.slice(0, canDraw)],
    dungeon: dungeon.slice(canDraw),
  };
}

export function canAvoidRoom(state) {
  const config = getConfig(state);
  if (!config.canAvoidRooms) return false;
  return !state.lastRoomAvoided && state.room.length > 0;
}

export function avoidRoom(state) {
  return {
    ...state,
    dungeon: [...state.dungeon, ...state.room],
    room: [],
    lastRoomAvoided: true,
  };
}

export function shouldCompleteTurn(state) {
  const original = state.room.length + state.cardsResolvedThisTurn;
  const target = original >= 2 ? original - 1 : original;
  return state.cardsResolvedThisTurn >= target;
}

export function completeTurn(state) {
  const newState = {
    ...state,
    potionUsedThisTurn: false,
    cardsResolvedThisTurn: 0,
    lastRoomAvoided: false,
    turnCount: state.turnCount + 1,
  };
  return fillRoom(newState);
}

export function checkGameEnd(state) {
  const config = getConfig(state);
  if (state.health <= 0) return "lost";
  // Endless mode: never "won", only lost
  if (config.endless) return "playing";
  if (state.dungeon.length === 0 && state.room.length === 0) return "won";
  return "playing";
}

export function getAvailableActions(state) {
  if (state.gameStatus !== "playing") return [];

  const actions = [];

  if (canAvoidRoom(state) && state.room.length > 0) {
    actions.push({ type: "AVOID_ROOM", payload: {} });
  }

  for (let i = 0; i < state.room.length; i++) {
    const cardId = state.room[i];
    const cardType = typeFromId(cardId);
    actions.push({ type: "SELECT_CARD", payload: { cardIndex: i } });
    if (cardType === "monster") {
      actions.push({ type: "FIGHT_BAREHANDED", payload: { cardIndex: i } });
    }
  }

  return actions;
}
