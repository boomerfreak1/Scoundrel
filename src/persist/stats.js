// Aggregate run statistics across all completed games.

const STORAGE_KEY = "stats";

function defaultStats() {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    winRate: 0,
    totalScore: 0,
    averageScore: 0,
    bestScore: -Infinity,
    worstScore: Infinity,
    currentWinStreak: 0,
    longestWinStreak: 0,
    currentLossStreak: 0,
    longestLossStreak: 0,
    totalMonstersSlain: 0,
    monstersSlainBarehanded: 0,
    monstersSlainWithWeapon: 0,
    totalDamageTaken: 0,
    totalHealingDone: 0,
    totalPotionsWasted: 0,
    totalWeaponsEquipped: 0,
    totalRoomsAvoided: 0,
    totalTurns: 0,
    averageTurnsPerGame: 0,
    monsterKillMap: {},    // cardId -> count (game-ending kills)
    weaponEquipMap: {},    // cardId -> count
    playDates: [],         // unique ISO date strings
  };
}

export function createStatsManager(storage) {
  function getStats() {
    const raw = storage.load(STORAGE_KEY);
    if (!raw) return defaultStats();
    // Ensure all fields exist (for forward compat)
    return { ...defaultStats(), ...raw };
  }

  function saveStats(stats) {
    storage.save(STORAGE_KEY, stats);
  }

  return {
    recordGame(entry, gameLog = []) {
      const s = getStats();

      s.gamesPlayed++;
      if (entry.outcome === "won") {
        s.gamesWon++;
        s.currentWinStreak++;
        s.currentLossStreak = 0;
        s.longestWinStreak = Math.max(s.longestWinStreak, s.currentWinStreak);
      } else {
        s.gamesLost++;
        s.currentLossStreak++;
        s.currentWinStreak = 0;
        s.longestLossStreak = Math.max(s.longestLossStreak, s.currentLossStreak);
      }

      s.totalScore += entry.score;
      s.winRate = s.gamesWon / s.gamesPlayed;
      s.averageScore = s.totalScore / s.gamesPlayed;
      if (entry.score > s.bestScore || s.bestScore === -Infinity) s.bestScore = entry.score;
      if (entry.score < s.worstScore || s.worstScore === Infinity) s.worstScore = entry.score;

      s.totalMonstersSlain += entry.monstersSlain || 0;
      s.monstersSlainBarehanded += entry.monstersSlainBarehanded || 0;
      s.monstersSlainWithWeapon += entry.monstersSlainWithWeapon || 0;
      s.totalDamageTaken += entry.totalDamageTaken || 0;
      s.totalHealingDone += entry.totalHealingDone || 0;
      s.totalPotionsWasted += entry.potionsWasted || 0;
      s.totalWeaponsEquipped += entry.weaponsUsed || 0;
      s.totalRoomsAvoided += entry.roomsAvoided || 0;
      s.totalTurns += entry.turns || 0;
      s.averageTurnsPerGame = s.totalTurns / s.gamesPlayed;

      // Track weapon usage
      for (const evt of gameLog) {
        if (evt.type === "WEAPON_EQUIPPED") {
          s.weaponEquipMap[evt.cardId] = (s.weaponEquipMap[evt.cardId] || 0) + 1;
        }
      }

      // Track monster that killed the player
      if (entry.outcome === "lost") {
        const lastMonster = [...gameLog].reverse().find((e) => e.type === "MONSTER_SLAIN");
        if (lastMonster) {
          s.monsterKillMap[lastMonster.cardId] = (s.monsterKillMap[lastMonster.cardId] || 0) + 1;
        }
      }

      // Track play dates
      const today = new Date().toISOString().slice(0, 10);
      if (!s.playDates.includes(today)) {
        s.playDates.push(today);
      }

      saveStats(s);
      return s;
    },

    getStats() {
      const s = getStats();
      // Compute derived values
      s.mostDeadlyMonster = topEntry(s.monsterKillMap);
      s.favoriteWeapon = topEntry(s.weaponEquipMap);
      return s;
    },

    clear() {
      storage.delete(STORAGE_KEY);
    },
  };
}

function topEntry(map) {
  let best = null;
  let bestCount = 0;
  for (const [id, count] of Object.entries(map || {})) {
    if (count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best ? { cardId: best, count: bestCount } : null;
}
