// Daily challenge persistence.

export function createDailyManager(storage) {
  function getDaily(dateStr) {
    return storage.load(`daily:${dateStr}`);
  }

  function saveDaily(dateStr, data) {
    storage.save(`daily:${dateStr}`, data);
  }

  function getHistory() {
    return storage.load("daily:history") || [];
  }

  return {
    hasPlayedToday(dateStr) {
      const d = getDaily(dateStr);
      return d && d.played;
    },

    recordDaily(dateStr, seed, scoreEntry) {
      saveDaily(dateStr, { date: dateStr, seed, score: scoreEntry.score, outcome: scoreEntry.outcome, played: true });
      const history = getHistory();
      history.push({ date: dateStr, score: scoreEntry.score, outcome: scoreEntry.outcome });
      storage.save("daily:history", history);
    },

    getDailyResult(dateStr) {
      return getDaily(dateStr);
    },

    getStreak() {
      const history = getHistory();
      if (history.length === 0) return 0;
      const sorted = history.map((h) => h.date).sort().reverse();
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        if (sorted.includes(ds)) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      return streak;
    },

    getHistory,

    clear() {
      const keys = storage.listKeys("daily:");
      for (const k of keys) storage.delete(k);
      storage.delete("daily:history");
    },
  };
}
