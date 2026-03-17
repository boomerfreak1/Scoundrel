import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { processCommand } from "../src/logic/commands.js";
import { validateState } from "../src/logic/state.js";
import { getAvailableActions } from "../src/logic/turn.js";

function playGame(seed) {
  let { state } = processCommand(null, {
    type: "NEW_GAME",
    payload: { seed },
  });

  let moves = 0;
  const maxMoves = 500;

  while (state.gameStatus === "playing" && moves < maxMoves) {
    const actions = getAvailableActions(state);
    if (actions.length === 0) {
      throw new Error(
        `No available actions at move ${moves}, seed ${seed}, ` +
          `room: ${state.room.length}, dungeon: ${state.dungeon.length}, ` +
          `health: ${state.health}, status: ${state.gameStatus}`
      );
    }

    // Pick the first available action (deterministic strategy)
    const command = actions[0];
    const { state: newState, result } = processCommand(state, command);

    if (!result.success) {
      throw new Error(
        `Command failed at move ${moves}: ${result.message}, ` +
          `command: ${JSON.stringify(command)}, seed ${seed}`
      );
    }

    // Validate state after every command
    const validation = validateState(newState);
    if (!validation.valid) {
      throw new Error(
        `State corruption at move ${moves}, seed ${seed}: ` +
          validation.errors.join(", ")
      );
    }

    state = newState;
    moves++;
  }

  if (moves >= maxMoves) {
    throw new Error(`Game did not terminate after ${maxMoves} moves, seed ${seed}`);
  }

  return { state, moves };
}

describe("full playthrough simulation", () => {
  it("100 seeded games complete without corruption", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const { state } = playGame(seed);

      // Game must have ended
      assert.ok(
        state.gameStatus === "won" || state.gameStatus === "lost",
        `Seed ${seed}: game ended with status '${state.gameStatus}'`
      );

      // Score must be calculated
      assert.notEqual(
        state.score,
        null,
        `Seed ${seed}: score is null`
      );

      // Final validation
      const validation = validateState(state);
      if (state.gameStatus === "won") {
        // Won games may have health > 0 and all cards accounted for
        assert.ok(state.health > 0, `Seed ${seed}: won with non-positive health`);
      }
    }
  });

  it("same seed produces identical game sequence", () => {
    const seed = 42;
    const game1 = playGame(seed);
    const game2 = playGame(seed);
    assert.equal(game1.moves, game2.moves);
    assert.deepEqual(game1.state, game2.state);
  });
});
