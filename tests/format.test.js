import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { formatResult, groupDigits } from "../js/format.js";

describe("formatResult", () => {
  test("adds thousands separators", () => {
    assert.equal(formatResult(1234567.891), "1,234,567.891");
  });

  test("leaves small whole numbers alone", () => {
    assert.equal(formatResult(14), "14");
  });

  test("shows negative numbers", () => {
    assert.equal(formatResult(-2500), "-2,500");
  });

  test("uses scientific notation for huge numbers", () => {
    assert.equal(formatResult(1.23456789e21), "1.2345679E21");
  });

  test("uses scientific notation for tiny numbers", () => {
    assert.equal(formatResult(2.5e-12), "2.5E-12");
  });

  test("shows zero as 0", () => {
    assert.equal(formatResult(0), "0");
  });
});

describe("groupDigits", () => {
  test("groups every number in an expression", () => {
    assert.equal(groupDigits("1234567+5000"), "1,234,567+5,000");
  });

  test("never groups the digits after the decimal point", () => {
    assert.equal(groupDigits("1234.56789"), "1,234.56789");
  });

  test("keeps a decimal point that's still being typed", () => {
    assert.equal(groupDigits("1000."), "1,000.");
  });

  test("leaves short numbers and symbols alone", () => {
    assert.equal(groupDigits("(12*-3)"), "(12*-3)");
  });
});
