// Replay command log storage.

export function createReplayManager(storage) {
  return {
    saveReplay(seed, commandLog, variantId = "classic") {
      storage.save(`replay:${seed}`, { seed, variantId, commands: commandLog });
    },

    getReplay(seed) {
      return storage.load(`replay:${seed}`);
    },

    hasReplay(seed) {
      return !!storage.load(`replay:${seed}`);
    },

    clear() {
      const keys = storage.listKeys("replay:");
      for (const k of keys) storage.delete(k);
    },
  };
}
