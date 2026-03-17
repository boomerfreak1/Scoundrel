// High score recording, ranking, retrieval.

const STORAGE_KEY = "highScores";
const MAX_SCORES = 10;

export function createHighScoreManager(storage) {
  function getScores() {
    return storage.load(STORAGE_KEY) || [];
  }

  function saveScores(scores) {
    storage.save(STORAGE_KEY, scores);
  }

  function sortScores(scores) {
    return scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.turns !== b.turns) return a.turns - b.turns;
      return new Date(b.date) - new Date(a.date);
    });
  }

  return {
    recordScore(entry) {
      const scores = getScores();
      scores.push(entry);
      const sorted = sortScores(scores).slice(0, MAX_SCORES);
      saveScores(sorted);
      return sorted;
    },

    getTopScores(n = MAX_SCORES) {
      return sortScores(getScores()).slice(0, n);
    },

    isHighScore(score) {
      const scores = getScores();
      if (scores.length < MAX_SCORES) return true;
      const sorted = sortScores(scores);
      return score > sorted[sorted.length - 1].score;
    },

    getRank(score) {
      const scores = sortScores(getScores());
      for (let i = 0; i < scores.length; i++) {
        if (score > scores[i].score) return i + 1;
        if (score === scores[i].score) return i + 1;
      }
      if (scores.length < MAX_SCORES) return scores.length + 1;
      return null;
    },

    clear() {
      storage.delete(STORAGE_KEY);
    },
  };
}
