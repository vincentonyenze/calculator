import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { addEntry, parseHistory, MAX_ENTRIES } from "../js/history.js";

const entry = (expression, result = 1, at = 1) => ({ expression, result, at });

describe("addEntry", () => {
  test("puts the newest calculation first", () => {
    const history = addEntry([entry("1+1")], entry("2+2"));
    assert.deepEqual(history.map((e) => e.expression), ["2+2", "1+1"]);
  });

  test("doesn't change the list it was given", () => {
    const original = [entry("1+1")];
    addEntry(original, entry("2+2"));
    assert.equal(original.length, 1);
  });

  test("skips the same sum twice in a row", () => {
    const history = addEntry([entry("1+1")], entry("1+1"));
    assert.equal(history.length, 1);
  });

  test("allows the same sum again later", () => {
    const history = addEntry([entry("2+2"), entry("1+1")], entry("1+1"));
    assert.equal(history.length, 3);
  });

  test(`keeps at most ${MAX_ENTRIES} entries, dropping the oldest`, () => {
    let history = [];
    for (let i = 0; i < MAX_ENTRIES + 5; i++) {
      history = addEntry(history, entry(`${i}+1`));
    }
    assert.equal(history.length, MAX_ENTRIES);
    assert.equal(history[0].expression, `${MAX_ENTRIES + 4}+1`);
  });
});

describe("parseHistory", () => {
  test("reads a saved list", () => {
    const saved = JSON.stringify([entry("2+2", 4, 100)]);
    assert.deepEqual(parseHistory(saved), [entry("2+2", 4, 100)]);
  });

  test("returns an empty list when nothing was saved", () => {
    assert.deepEqual(parseHistory(null), []);
  });

  test("returns an empty list for text that isn't JSON", () => {
    assert.deepEqual(parseHistory("not json {"), []);
  });

  test("drops broken entries and keeps the good ones", () => {
    const saved = JSON.stringify([entry("2+2", 4), { expression: "x" }, null, entry("3+3", 6)]);
    assert.deepEqual(parseHistory(saved).map((e) => e.expression), ["2+2", "3+3"]);
  });
});
