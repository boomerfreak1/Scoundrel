// Achievement definitions and tracking.

const STORAGE_KEY = "achievements";

const DEFINITIONS = [
  { id: "perfect_health", name: "Unscathed", desc: "Win with 20 HP",
    check: (e) => e.outcome === "won" && e.health === 20 },
  { id: "skin_of_teeth", name: "Skin of Your Teeth", desc: "Win with 1 HP",
    check: (e) => e.outcome === "won" && e.health === 1 },
  { id: "pacifist_weapon", name: "Bare Knuckle Brawler", desc: "Win without equipping a weapon",
    check: (e) => e.outcome === "won" && e.weaponsUsed === 0 },
  { id: "ace_slayer", name: "Ace Slayer", desc: "Defeat both Aces in one game",
    check: (e, log) => {
      const slain = new Set(log.filter((v) => v.type === "MONSTER_SLAIN").map((v) => v.cardId));
      return slain.has("clubs_14") && slain.has("spades_14");
    } },
  { id: "no_avoid", name: "Nowhere to Run", desc: "Win without avoiding any rooms",
    check: (e) => e.outcome === "won" && e.roomsAvoided === 0 },
  { id: "potion_master", name: "Potion Master", desc: "Use every potion in the deck",
    check: (e, log) => {
      const healed = new Set(log.filter((v) => v.type === "HEALED").map((v) => v.cardId));
      for (let r = 2; r <= 10; r++) {
        if (!healed.has(`hearts_${r}`)) return false;
      }
      return true;
    } },
  { id: "speed_run", name: "Speed Demon", desc: "Win in 8 or fewer turns",
    check: (e) => e.outcome === "won" && e.turns <= 8 },
  { id: "high_roller", name: "High Roller", desc: "Score 18 or higher",
    check: (e) => e.outcome === "won" && e.score >= 18 },
  { id: "ten_wins", name: "Veteran", desc: "Win 10 games", cumulative: true,
    check: (e, log, stats) => stats.gamesWon >= 10 },
  { id: "fifty_games", name: "Dedicated", desc: "Play 50 games", cumulative: true,
    check: (e, log, stats) => stats.gamesPlayed >= 50 },
  { id: "daily_player", name: "Regular", desc: "Play on 7 different days", cumulative: true,
    check: (e, log, stats) => (stats.playDates || []).length >= 7 },
  { id: "perfect_bonus", name: "Bottoms Up", desc: "Win with a potion bonus on the last card",
    check: (e) => e.outcome === "won" && e.potionBonus > 0 },
];

export function createAchievementManager(storage) {
  function getUnlocked() {
    return storage.load(STORAGE_KEY) || {};
  }

  function saveUnlocked(unlocked) {
    storage.save(STORAGE_KEY, unlocked);
  }

  return {
    checkGame(scoreEntry, gameLog, stats) {
      const unlocked = getUnlocked();
      const newlyUnlocked = [];

      for (const def of DEFINITIONS) {
        if (unlocked[def.id]) continue;
        try {
          if (def.check(scoreEntry, gameLog, stats)) {
            unlocked[def.id] = { date: new Date().toISOString() };
            newlyUnlocked.push(def);
          }
        } catch (e) {
          // Skip failed checks
        }
      }

      if (newlyUnlocked.length > 0) {
        saveUnlocked(unlocked);
      }

      return newlyUnlocked;
    },

    getAchievements() {
      const unlocked = getUnlocked();
      return DEFINITIONS.map((def) => ({
        ...def,
        unlocked: !!unlocked[def.id],
        date: unlocked[def.id]?.date || null,
      }));
    },

    getProgress(stats) {
      return {
        ten_wins: { current: stats.gamesWon, target: 10 },
        fifty_games: { current: stats.gamesPlayed, target: 50 },
        daily_player: { current: (stats.playDates || []).length, target: 7 },
      };
    },

    clear() {
      storage.delete(STORAGE_KEY);
    },
  };
}
