import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRNG } from "../src/logic/rng.js";

describe("createRNG", () => {
  it("same seed produces identical sequence", () => {
    const a = createRNG(42);
    const b = createRNG(42);
    for (let i = 0; i < 100; i++) {
      assert.equal(a.next(), b.next());
    }
  });

  it("different seeds produce different sequences", () => {
    const a = createRNG(1);
    const b = createRNG(2);
    const vals = [];
    for (let i = 0; i < 10; i++) vals.push(a.next() !== b.next());
    assert.ok(vals.some(Boolean), "Expected at least one difference");
  });

  it("next returns values between 0 and 1", () => {
    const rng = createRNG(99);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      assert.ok(v >= 0 && v < 1, `Value out of range: ${v}`);
    }
  });

  it("nextInt returns values in [min, max]", () => {
    const rng = createRNG(77);
    for (let i = 0; i < 1000; i++) {
      const v = rng.nextInt(3, 7);
      assert.ok(v >= 3 && v <= 7, `Value out of range: ${v}`);
    }
  });

  it("shuffle produces a permutation with same elements", () => {
    const rng = createRNG(55);
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = rng.shuffle(input);
    assert.equal(result.length, input.length);
    assert.deepEqual(result.slice().sort((a, b) => a - b), input);
  });

  it("shuffle does not mutate input", () => {
    const rng = createRNG(55);
    const input = [1, 2, 3, 4, 5];
    const copy = input.slice();
    rng.shuffle(input);
    assert.deepEqual(input, copy);
  });

  it("shuffle with same seed produces identical order", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const a = createRNG(123).shuffle(arr);
    const b = createRNG(123).shuffle(arr);
    assert.deepEqual(a, b);
  });
});
