// Combat resolution — pure functions for damage calculation.
// Zero browser dependencies.

import { rankFromId, typeFromId, suitFromId, makeCardId } from "./card.js";
import { getConfig } from "./variants.js";

export function canUseWeapon(state, monsterCardId) {
  if (!state.equippedWeapon) return false;
  const config = getConfig(state);
  if (!config.weaponDegradation) return true;
  if (state.slainByWeapon.length === 0) return true;
  const monsterRank = rankFromId(monsterCardId);
  const lastSlainId = state.slainByWeapon[state.slainByWeapon.length - 1];
  const lastSlainRank = rankFromId(lastSlainId);
  return monsterRank <= lastSlainRank;
}

export function calculateWeaponDamage(monsterRank, weaponRank, config = null) {
  const mult = config?.weaponDamageMultiplier || 1;
  return Math.max(0, monsterRank - weaponRank * mult);
}

export function calculateBarehandedDamage(monsterRank) {
  return monsterRank;
}

export function resolveMonsterWithWeapon(state, monsterCardId) {
  const config = getConfig(state);
  const monsterRank = rankFromId(monsterCardId);
  const weaponRank = rankFromId(state.equippedWeapon);
  const damage = calculateWeaponDamage(monsterRank, weaponRank, config);
  return {
    ...state,
    health: state.health - damage,
    room: state.room.filter((id) => id !== monsterCardId),
    slainByWeapon: [...state.slainByWeapon, monsterCardId],
    cardsResolvedThisTurn: state.cardsResolvedThisTurn + 1,
    lastResolvedCardId: monsterCardId,
  };
}

export function resolveMonsterBarehanded(state, monsterCardId) {
  const damage = calculateBarehandedDamage(rankFromId(monsterCardId));
  return {
    ...state,
    health: state.health - damage,
    room: state.room.filter((id) => id !== monsterCardId),
    discard: [...state.discard, monsterCardId],
    cardsResolvedThisTurn: state.cardsResolvedThisTurn + 1,
    lastResolvedCardId: monsterCardId,
  };
}

export function resolveWeapon(state, weaponCardId) {
  const toDiscard = [];
  if (state.equippedWeapon) {
    toDiscard.push(state.equippedWeapon);
    toDiscard.push(...state.slainByWeapon);
  }
  return {
    ...state,
    room: state.room.filter((id) => id !== weaponCardId),
    discard: [...state.discard, ...toDiscard],
    equippedWeapon: weaponCardId,
    slainByWeapon: [],
    cardsResolvedThisTurn: state.cardsResolvedThisTurn + 1,
    lastResolvedCardId: weaponCardId,
  };
}

export function canHoneWeapon(state, diamondCardId) {
  if (!state.equippedWeapon) return false;
  const config = getConfig(state);
  if (!config.weaponDegradation) return false;
  if (state.slainByWeapon.length === 0) return false;
  if (rankFromId(state.equippedWeapon) <= 1) return false;
  const lastSlainRank = rankFromId(state.slainByWeapon[state.slainByWeapon.length - 1]);
  return rankFromId(diamondCardId) > lastSlainRank;
}

export function honeWeapon(state, diamondCardId) {
  const weaponRank = rankFromId(state.equippedWeapon);
  const weaponSuit = suitFromId(state.equippedWeapon);
  const newWeaponId = makeCardId(weaponSuit, weaponRank - 1);
  return {
    ...state,
    equippedWeapon: newWeaponId,
    slainByWeapon: [],
    room: state.room.filter((id) => id !== diamondCardId),
    discard: [...state.discard, diamondCardId],
    cardsResolvedThisTurn: state.cardsResolvedThisTurn + 1,
    lastResolvedCardId: diamondCardId,
  };
}

export function resolvePotion(state, potionCardId) {
  const config = getConfig(state);
  let healing = 0;
  if (!state.potionUsedThisTurn) {
    const potionRank = rankFromId(potionCardId);
    healing = Math.min(potionRank, config.maxHealth - state.health);
  }
  return {
    ...state,
    health: state.health + healing,
    room: state.room.filter((id) => id !== potionCardId),
    discard: [...state.discard, potionCardId],
    potionUsedThisTurn: true,
    cardsResolvedThisTurn: state.cardsResolvedThisTurn + 1,
    lastResolvedCardId: potionCardId,
  };
}
