// Seedable PRNG using mulberry32 algorithm.
// Zero browser dependencies. Must produce identical sequences for identical seeds.

function mulberry32(seed) {
  let state = seed | 0;
  return function () {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRNG(seed) {
  const _next = mulberry32(seed);

  return {
    next() {
      return _next();
    },

    nextInt(min, max) {
      return min + Math.floor(_next() * (max - min + 1));
    },

    shuffle(array) {
      const result = array.slice();
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(_next() * (i + 1));
        const tmp = result[i];
        result[i] = result[j];
        result[j] = tmp;
      }
      return result;
    },
  };
}
