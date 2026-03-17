// End-of-game score calculation.
// Zero browser dependencies.

import { rankFromId, typeFromId } from "./card.js";

export function calculateScore(state) {
  if (state.gameStatus === "won") {
    let score = state.health;
    // Potion bonus: if last resolved card was a potion, add its rank
    if (
      state.lastResolvedCardId &&
      typeFromId(state.lastResolvedCardId) === "potion"
    ) {
      score += rankFromId(state.lastResolvedCardId);
    }
    return score;
  }

  if (state.gameStatus === "lost") {
    // Sum rank values of all remaining monsters in dungeon
    const monsterValueSum = state.dungeon
      .filter((id) => typeFromId(id) === "monster")
      .reduce((sum, id) => sum + rankFromId(id), 0);
    return state.health - monsterValueSum;
  }

  return null;
}

export function getScoreBreakdown(state) {
  const outcome = state.gameStatus;
  const health = state.health;

  if (outcome === "won") {
    let potionBonus = 0;
    if (
      state.lastResolvedCardId &&
      typeFromId(state.lastResolvedCardId) === "potion"
    ) {
      potionBonus = rankFromId(state.lastResolvedCardId);
    }
    return {
      outcome,
      health,
      remainingMonsters: 0,
      monsterValueSum: 0,
      potionBonus,
      finalScore: health + potionBonus,
    };
  }

  if (outcome === "lost") {
    const remainingMonsters = state.dungeon.filter(
      (id) => typeFromId(id) === "monster"
    );
    const monsterValueSum = remainingMonsters.reduce(
      (sum, id) => sum + rankFromId(id),
      0
    );
    return {
      outcome,
      health,
      remainingMonsters: remainingMonsters.length,
      monsterValueSum,
      potionBonus: 0,
      finalScore: health - monsterValueSum,
    };
  }

  return {
    outcome,
    health,
    remainingMonsters: 0,
    monsterValueSum: 0,
    potionBonus: 0,
    finalScore: null,
  };
}
