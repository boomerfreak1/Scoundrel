// Command processor — takes state + command, returns new state.
// Zero browser dependencies.

import { createInitialState } from "./state.js";
import { typeFromId, rankFromId } from "./card.js";
import {
  canUseWeapon,
  canHoneWeapon,
  resolveMonsterWithWeapon,
  resolveMonsterBarehanded,
  resolveWeapon,
  resolvePotion,
  honeWeapon,
  calculateWeaponDamage,
  calculateBarehandedDamage,
} from "./combat.js";
import {
  canAvoidRoom,
  avoidRoom,
  fillRoom,
  completeTurn,
  shouldCompleteTurn,
  checkGameEnd,
} from "./turn.js";
import { calculateScore } from "./scoring.js";

export function processCommand(state, command) {
  const { type, payload } = command;

  switch (type) {
    case "NEW_GAME":
      return handleNewGame(payload);
    case "SELECT_CARD":
      return handleSelectCard(state, payload);
    case "FIGHT_BAREHANDED":
      return handleFightBarehanded(state, payload);
    case "HONE_WEAPON":
      return handleHoneWeapon(state, payload);
    case "AVOID_ROOM":
      return handleAvoidRoom(state);
    default:
      return fail(state, `Unknown command: ${type}`);
  }
}

function fail(state, message) {
  return { state, result: { success: false, message, events: [] } };
}

function handleNewGame(payload) {
  const seed = payload?.seed ?? Date.now();
  const variantId = payload?.variantId ?? "classic";
  const state = createInitialState(seed, variantId);
  return {
    state,
    result: {
      success: true,
      message: "New game started",
      events: [{ type: "NEW_GAME", seed: state.seed }],
    },
  };
}

function handleSelectCard(state, payload) {
  if (state.gameStatus !== "playing") return fail(state, "Game is over");

  const { cardIndex } = payload;
  if (cardIndex < 0 || cardIndex >= state.room.length) {
    return fail(state, "Invalid card index");
  }

  const cardId = state.room[cardIndex];
  const cardType = typeFromId(cardId);
  const events = [];
  let newState;

  if (cardType === "monster") {
    if (canUseWeapon(state, cardId)) {
      const monsterRank = rankFromId(cardId);
      const weaponRank = rankFromId(state.equippedWeapon);
      const damage = calculateWeaponDamage(monsterRank, weaponRank, state.variantConfig);
      newState = resolveMonsterWithWeapon(state, cardId);
      events.push({
        type: "WEAPON_USED",
        cardId,
        weaponId: state.equippedWeapon,
      });
      events.push({ type: "MONSTER_SLAIN", cardId, withWeapon: true });
      if (damage > 0) events.push({ type: "DAMAGE_TAKEN", amount: damage });
    } else {
      const damage = calculateBarehandedDamage(rankFromId(cardId));
      newState = resolveMonsterBarehanded(state, cardId);
      events.push({ type: "MONSTER_SLAIN", cardId, withWeapon: false });
      events.push({ type: "DAMAGE_TAKEN", amount: damage });
    }
  } else if (cardType === "weapon") {
    if (state.equippedWeapon) {
      events.push({ type: "WEAPON_DISCARDED", cardId: state.equippedWeapon });
    }
    newState = resolveWeapon(state, cardId);
    events.push({ type: "WEAPON_EQUIPPED", cardId });
  } else {
    const prevHealth = state.health;
    newState = resolvePotion(state, cardId);
    const healed = newState.health - prevHealth;
    if (healed > 0) {
      events.push({ type: "HEALED", amount: healed, cardId });
    } else {
      events.push({ type: "POTION_WASTED", cardId });
    }
  }

  return finalize(newState, events);
}

function handleFightBarehanded(state, payload) {
  if (state.gameStatus !== "playing") return fail(state, "Game is over");

  const { cardIndex } = payload;
  if (cardIndex < 0 || cardIndex >= state.room.length) {
    return fail(state, "Invalid card index");
  }

  const cardId = state.room[cardIndex];
  if (typeFromId(cardId) !== "monster") {
    return fail(state, "Card is not a monster");
  }

  const damage = calculateBarehandedDamage(rankFromId(cardId));
  const newState = resolveMonsterBarehanded(state, cardId);
  const events = [
    { type: "MONSTER_SLAIN", cardId, withWeapon: false },
    { type: "DAMAGE_TAKEN", amount: damage },
  ];

  return finalize(newState, events);
}

function handleHoneWeapon(state, payload) {
  if (state.gameStatus !== "playing") return fail(state, "Game is over");

  const { cardIndex } = payload;
  if (cardIndex < 0 || cardIndex >= state.room.length) {
    return fail(state, "Invalid card index");
  }

  const cardId = state.room[cardIndex];
  if (typeFromId(cardId) !== "weapon") {
    return fail(state, "Card is not a weapon");
  }

  if (!canHoneWeapon(state, cardId)) {
    return fail(state, "Cannot hone weapon with this diamond");
  }

  const oldWeaponId = state.equippedWeapon;
  const newState = honeWeapon(state, cardId);
  const events = [
    { type: "WEAPON_HONED", cardId, weaponId: oldWeaponId, newWeaponId: newState.equippedWeapon },
  ];

  return finalize(newState, events);
}

function handleAvoidRoom(state) {
  if (state.gameStatus !== "playing") return fail(state, "Game is over");

  if (!canAvoidRoom(state)) {
    return fail(state, "Cannot avoid room (already avoided last room)");
  }

  const events = [{ type: "ROOM_AVOIDED" }];
  let newState = avoidRoom(state);

  // Avoiding counts as a full turn — advance to next turn
  newState = {
    ...newState,
    potionUsedThisTurn: false,
    cardsResolvedThisTurn: 0,
    turnCount: newState.turnCount + 1,
  };
  newState = fillRoom(newState);
  events.push({
    type: "ROOM_FILLED",
    cards: newState.room.slice(),
  });

  const status = checkGameEnd(newState);
  if (status !== "playing") {
    newState = {
      ...newState,
      gameStatus: status,
      score: calculateScore({ ...newState, gameStatus: status }),
    };
    events.push({
      type: status === "won" ? "GAME_WON" : "GAME_LOST",
      score: newState.score,
    });
  }

  return {
    state: newState,
    result: { success: true, message: "Room avoided", events },
  };
}

function finalize(state, events) {
  // Check death
  let status = checkGameEnd(state);
  if (status === "lost") {
    const newState = {
      ...state,
      gameStatus: "lost",
      score: calculateScore({ ...state, gameStatus: "lost" }),
    };
    events.push({ type: "GAME_LOST", score: newState.score });
    return {
      state: newState,
      result: { success: true, message: "Player died", events },
    };
  }

  // Check turn completion
  if (shouldCompleteTurn(state)) {
    // Check win before completing turn (room might be empty + dungeon empty)
    status = checkGameEnd(state);
    if (status === "won") {
      const newState = {
        ...state,
        gameStatus: "won",
        score: calculateScore({ ...state, gameStatus: "won" }),
      };
      events.push({ type: "GAME_WON", score: newState.score });
      return {
        state: newState,
        result: { success: true, message: "You win!", events },
      };
    }

    state = completeTurn(state);
    events.push({ type: "TURN_COMPLETE" });
    events.push({
      type: "ROOM_FILLED",
      cards: state.room.slice(),
    });

    // Check win after filling room (edge case: dungeon exhausted)
    status = checkGameEnd(state);
    if (status === "won") {
      state = {
        ...state,
        gameStatus: "won",
        score: calculateScore({ ...state, gameStatus: "won" }),
      };
      events.push({ type: "GAME_WON", score: state.score });
    }
  }

  return {
    state,
    result: { success: true, message: "Card resolved", events },
  };
}
