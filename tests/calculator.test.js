// Automated tests for the calculator engine. Run them with:  npm test
//
// Each test feeds the engine some input and checks the output. They run in
// Node, without a browser, in well under a second. That only works because
// calculator.js has no DOM code in it.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL,
  appendInput,
  deleteLast,
  tokenize,
  calculate,
  toExpression,
  CalcError,
} from "../js/calculator.js";

// Press keys one after another, starting from a fresh calculator
function type(keys) {
  return [...keys].reduce(appendInput, INITIAL);
}

// The values of the tokens, which are easier to compare than whole objects
function tokenValues(expression) {
  return tokenize(expression).map((token) => token.value);
}

describe("typing (appendInput)", () => {
  // [keys pressed, expected expression, what the rule is]
  const cases = [
    ["123", "123", "digits are added"],
    ["007", "7", "no leading zeros"],
    ["5+07", "5+7", "no leading zeros after an operator"],
    ["1.2.3", "1.23", "only one decimal point per number"],
    [".5", "0.5", "a bare . becomes 0."],
    ["5+.", "5+0.", "a . after an operator becomes 0."],
    ["5+*", "5*", "a new operator replaces the last one"],
    ["5*-3", "5*-3", "minus after × makes a negative number"],
    ["5*-+", "5+", "an operator replaces × and the minus sign"],
    ["-5", "-5", "a minus sign can start the expression"],
    ["-+", "-", "a lone minus sign can't become +"],
    ["+5", "0+5", "an operator first applies to the 0"],
    ["5.+3", "5+3", "a dot with nothing after it is dropped"],
    ["(2+3)4", "(2+3)*4", "a number after ) means multiply"],
    ["2(3)", "2*(3)", "( after a number means multiply"],
    ["(5)(2)", "(5)*(2)", ")( means multiply"],
    ["(-3)", "(-3)", "minus sign after ("],
    ["(*", "(", "no × straight after ("],
    ["5)", "5", "no ) without a ("],
    ["(5+)", "(5+", "no ) straight after an operator"],
  ];

  for (const [keys, expected, rule] of cases) {
    test(`${rule}: "${keys}" -> "${expected}"`, () => {
      assert.equal(type(keys), expected);
    });
  }

  test("ignores keys that aren't part of maths", () => {
    assert.equal(appendInput("5", "x"), "5");
  });

  test("stops at 100 characters", () => {
    const long = "1".repeat(100);
    assert.equal(appendInput(long, "2"), long);
  });
});

describe("deleting (deleteLast)", () => {
  test("removes the last character", () => {
    assert.equal(deleteLast("123"), "12");
  });

  test("goes back to 0 instead of an empty display", () => {
    assert.equal(deleteLast("7"), INITIAL);
  });
});

describe("tokenize", () => {
  test("splits numbers, operators and brackets", () => {
    assert.deepEqual(tokenValues("12+3.5*(2-1)"), [12, "+", 3.5, "*", "(", 2, "-", 1, ")"]);
  });

  test("reads a minus at the start as a negative number", () => {
    assert.deepEqual(tokenValues("-5+3"), [-5, "+", 3]);
  });

  test("reads a minus after an operator as a negative number", () => {
    assert.deepEqual(tokenValues("2*-3"), [2, "*", -3]);
  });

  test("reads a minus after a number as subtraction", () => {
    assert.deepEqual(tokenValues("5-3"), [5, "-", 3]);
  });

  test("turns -(...) into -1 × (...)", () => {
    assert.deepEqual(tokenValues("-(2)"), [-1, "*", "(", 2, ")"]);
  });

  test("rejects unknown characters", () => {
    assert.throws(() => tokenize("5$"), CalcError);
  });

  test("rejects numbers with two dots", () => {
    assert.throws(() => tokenize("1.2.3"), CalcError);
  });
});

describe("calculate", () => {
  // [expression, expected answer, why]
  const cases = [
    ["7", 7, "a single number"],
    ["2+3", 5, "addition"],
    ["2+3*4", 14, "× before +"],
    ["2*3+4", 10, "× before + (other order)"],
    ["(2+3)*4", 20, "brackets first"],
    ["8-3-2", 3, "subtraction goes left to right"],
    ["8/2/2", 2, "division goes left to right"],
    ["10/4", 2.5, "decimal answers"],
    ["2*-3", -6, "negative numbers"],
    ["-2*-2", 4, "two negatives"],
    ["-(2+3)", -5, "minus before brackets"],
    ["2*(3+(4-1))*2", 24, "nested brackets"],
    ["((7))", 7, "brackets around a number"],
    ["(2+3", 5, "an unclosed bracket is closed for you"],
    ["5+", 5, "an operator at the end is ignored"],
    ["5*(", 5, "an operator and ( at the end are ignored"],
  ];

  for (const [expression, expected, why] of cases) {
    test(`${why}: ${expression} = ${expected}`, () => {
      assert.equal(calculate(expression), expected);
    });
  }

  test("refuses to divide by zero", () => {
    assert.throws(() => calculate("5/0"), { name: "CalcError", message: "Can't divide by zero" });
  });

  test("notices division by zero inside brackets", () => {
    assert.throws(() => calculate("5/(3-3)"), CalcError);
  });

  test("has nothing to calculate for an empty bracket", () => {
    assert.throws(() => calculate("("), CalcError);
  });
});

describe("floating point", () => {
  test("0.1 + 0.2 is exactly 0.3", () => {
    assert.equal(calculate("0.1+0.2"), 0.3);
  });

  test("1 ÷ 3 × 3 is exactly 1", () => {
    assert.equal(calculate("1/3*3"), 1);
  });

  test("1.1 × 3 is exactly 3.3", () => {
    assert.equal(calculate("1.1*3"), 3.3);
  });

  test("keeps 12 significant digits", () => {
    assert.equal(calculate("2/3"), 0.666666666667);
  });

  test("never answers -0", () => {
    assert.ok(Object.is(calculate("-1*0"), 0));
  });

  test("refuses numbers too large for JavaScript", () => {
    assert.throws(() => calculate("9".repeat(400)), { message: "Number too large" });
  });
});

describe("toExpression", () => {
  test("writes small numbers without an e", () => {
    assert.equal(toExpression(0.0000001), "0.0000001");
  });

  test("writes large numbers without an e or commas", () => {
    assert.equal(toExpression(1e21), "1000000000000000000000");
  });

  test("keeps negative numbers", () => {
    assert.equal(toExpression(-2.5), "-2.5");
  });
});
