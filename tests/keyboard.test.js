import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { keyFromKeyboard, cleanPastedText } from "../js/keyboard.js";

describe("keyFromKeyboard", () => {
  test("digits type themselves", () => {
    assert.deepEqual(keyFromKeyboard("7"), { value: "7" });
  });

  test("operators and brackets type themselves", () => {
    for (const key of ["+", "-", "*", "/", "(", ")", "."]) {
      assert.deepEqual(keyFromKeyboard(key), { value: key });
    }
  });

  test("Enter and = mean equals", () => {
    assert.deepEqual(keyFromKeyboard("Enter"), { action: "equals" });
    assert.deepEqual(keyFromKeyboard("="), { action: "equals" });
  });

  test("Backspace deletes, Escape clears", () => {
    assert.deepEqual(keyFromKeyboard("Backspace"), { action: "backspace" });
    assert.deepEqual(keyFromKeyboard("Escape"), { action: "clear" });
  });

  test("x means multiply", () => {
    assert.deepEqual(keyFromKeyboard("x"), { value: "*" });
  });

  test("a comma is a decimal point", () => {
    assert.deepEqual(keyFromKeyboard(","), { value: "." });
  });

  test("other keys are ignored", () => {
    for (const key of ["a", "Tab", "ArrowLeft", " ", "Shift"]) {
      assert.equal(keyFromKeyboard(key), null);
    }
  });
});

describe("cleanPastedText", () => {
  test("turns display symbols into maths symbols", () => {
    assert.equal(cleanPastedText("6×3÷2−1"), "6*3/2-1");
  });

  test("removes spaces and thousands commas", () => {
    assert.equal(cleanPastedText(" 1,234 + 5 "), "1234+5");
  });

  test("removes line breaks", () => {
    assert.equal(cleanPastedText("2\n+\n3"), "2+3");
  });
});
