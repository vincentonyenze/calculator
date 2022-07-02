// The calculator engine. Pure functions only: text in, text (or a number)
// out. No DOM, no global state. That's what lets Step 7 test it in Node.
//
// An expression is a string using the characters a computer uses for
// maths: "12+3*(4-1.5)". The page turns * / - into × ÷ − for display.

export const INITIAL = "0";

// Longest expression we accept, so the display (and the maths) stay sane
const MAX_LENGTH = 100;

const OPERATORS = "+-*/";

// ===== Small helpers =====
const isDigit = (char) => char >= "0" && char <= "9";
const isOperator = (char) => OPERATORS.includes(char);

// The number being typed at the end, e.g. "12+3.5" -> "3.5", "12+" -> ""
function currentNumber(expression) {
  return expression.match(/[\d.]*$/)[0];
}

// How many "(" are still waiting for a ")"
function openBrackets(expression) {
  let depth = 0;
  for (const char of expression) {
    if (char === "(") depth++;
    if (char === ")") depth--;
  }
  return depth;
}

// ===== Typing =====
// Returns the expression after typing one character. If the character
// isn't allowed here, the expression comes back unchanged, so the
// calculator can never get into a state it can't calculate.
export function appendInput(expression, char) {
  if (expression.length >= MAX_LENGTH) return expression;

  if (isDigit(char)) return appendDigit(expression, char);
  if (char === ".") return appendDecimal(expression);
  if (isOperator(char)) return appendOperator(expression, char);
  if (char === "(") return appendOpenBracket(expression);
  if (char === ")") return appendCloseBracket(expression);
  return expression; // anything else is ignored
}

function appendDigit(expression, digit) {
  if (expression === INITIAL) return digit; // "0" then "7" -> "7", not "07"

  const last = expression.at(-1);
  // "(2+3)" then "4" means (2+3)×4
  if (last === ")") return `${expression}*${digit}`;

  // "5+0" then "7" -> "5+7": no leading zeros like "07"
  if (currentNumber(expression) === "0") return expression.slice(0, -1) + digit;

  return expression + digit;
}

function appendDecimal(expression) {
  const number = currentNumber(expression);
  if (number.includes(".")) return expression; // only one "." per number

  const last = expression.at(-1);
  if (last === ")") return `${expression}*0.`;
  // "5+" then "." -> "5+0.", which reads better than "5+."
  if (number === "") return `${expression}0.`;
  return `${expression}.`;
}

function appendOperator(expression, operator) {
  const last = expression.at(-1);
  const beforeLast = expression.at(-2);

  // Start a negative number at the beginning: "0" then "-" -> "-"
  if (expression === INITIAL && operator === "-") return "-";

  // Nothing to apply the operator to after "(" ... except a minus sign: "(-3"
  if (last === "(") return operator === "-" ? `${expression}-` : expression;

  // "5" then "." then "+" -> "5+": drop a dot with nothing after it
  if (last === ".") return expression.slice(0, -1) + operator;

  if (isOperator(last)) {
    // "5*" then "-" -> "5*-": a negative number after × or ÷ is fine
    if (operator === "-" && (last === "*" || last === "/")) return `${expression}-`;

    // "5*-" then "+" -> "5+": replace both the operator and the minus sign
    if (last === "-" && isOperator(beforeLast)) return expression.slice(0, -2) + operator;

    // A lone "-" at the start can't become "+" or "×"
    if (expression === "-") return expression;

    // "5+" then "×" -> "5×": changing your mind replaces the operator
    return expression.slice(0, -1) + operator;
  }

  return expression + operator;
}

function appendOpenBracket(expression) {
  if (expression === INITIAL) return "(";
  const last = expression.at(-1);
  // "2(" means 2×(…), and so does ")(" or "2.("
  if (isDigit(last) || last === "." || last === ")") return `${expression}*(`;
  return `${expression}(`;
}

function appendCloseBracket(expression) {
  const last = expression.at(-1);
  // Only close a bracket that was opened, and only after a number or ")"
  if (openBrackets(expression) <= 0) return expression;
  if (!(isDigit(last) || last === ")" || last === ".")) return expression;
  return `${expression})`;
}

// ===== Tokenizer =====
// Step 1 of calculating: cut the text into meaningful pieces ("tokens").
//   "12+3.5*(2-1)"
//   -> 12, +, 3.5, *, (, 2, -, 1, )
// Each token is an object: { type: "number", value: 12 },
// { type: "operator", value: "+" }, or { type: "paren", value: "(" }.
// After this step nobody has to look at single characters again.

// Thrown for anything that isn't valid maths
export class CalcError extends Error {
  name = "CalcError";
}

// Is a "-" at this position a minus sign ("-5", "2*-3", "(-1") rather
// than subtraction ("5-3")? Yes if nothing a number could be subtracted
// from comes before it.
function isNegativeSign(tokens) {
  const previous = tokens.at(-1);
  return (
    previous === undefined ||
    previous.type === "operator" ||
    (previous.type === "paren" && previous.value === "(")
  );
}

export function tokenize(expression) {
  const tokens = [];
  let i = 0;

  while (i < expression.length) {
    const char = expression[i];

    // A number: read every digit and "." that follows, all at once
    if (isDigit(char) || char === ".") {
      const text = expression.slice(i).match(/^[\d.]+/)[0];
      if (text === "." || text.split(".").length > 2) {
        throw new CalcError(`"${text}" isn't a number`);
      }
      tokens.push({ type: "number", value: Number.parseFloat(text) });
      i += text.length;
      continue;
    }

    if (char === "-" && isNegativeSign(tokens)) {
      const next = expression[i + 1];
      if (isDigit(next) || next === ".") {
        // "-5": read the number and make it negative
        const text = expression.slice(i + 1).match(/^[\d.]+/)[0];
        tokens.push({ type: "number", value: -Number.parseFloat(text) });
        i += 1 + text.length;
      } else {
        // "-(2+3)" is the same as -1 × (2+3)
        tokens.push({ type: "number", value: -1 }, { type: "operator", value: "*" });
        i += 1;
      }
      continue;
    }

    if (isOperator(char)) {
      tokens.push({ type: "operator", value: char });
    } else if (char === "(" || char === ")") {
      tokens.push({ type: "paren", value: char });
    } else {
      throw new CalcError(`Unexpected "${char}"`);
    }
    i += 1;
  }

  return tokens;
}

// ===== Evaluator =====
// Step 2 of calculating: work out what the tokens add up to, with the
// right order of operations: brackets first, then × ÷, then + −.
// So 2+3×4 is 14, not 20.
//
// We do it in two passes, using Edsger Dijkstra's "shunting-yard" algorithm:
//   1. Reorder the tokens so each operator comes AFTER its two numbers:
//        2 + 3 * 4   ->   2 3 4 * +
//      This order is called Reverse Polish Notation (RPN). It needs no
//      brackets and no precedence rules: they're built into the order.
//   2. Read the RPN left to right with a stack. A number goes on the
//      stack; an operator takes the top two off and puts the answer back.

// Higher number = done first
const PRECEDENCE = { "+": 1, "-": 1, "*": 2, "/": 2 };

// Pass 1: tokens in normal order -> tokens in RPN order
function toRPN(tokens) {
  const output = [];
  const waiting = []; // operators and "(" not placed yet (a stack)

  for (const token of tokens) {
    if (token.type === "number") {
      output.push(token); // numbers go straight through
    } else if (token.type === "operator") {
      // Before this operator waits, place any waiting operator that should
      // happen first: higher precedence, or equal (left to right: 8-3-2 = 3)
      while (
        waiting.length > 0 &&
        waiting.at(-1).type === "operator" &&
        PRECEDENCE[waiting.at(-1).value] >= PRECEDENCE[token.value]
      ) {
        output.push(waiting.pop());
      }
      waiting.push(token);
    } else if (token.value === "(") {
      waiting.push(token);
    } else {
      // ")": place everything back to the matching "(", then drop the pair
      while (waiting.length > 0 && waiting.at(-1).value !== "(") {
        output.push(waiting.pop());
      }
      if (waiting.length === 0) throw new CalcError("Too many closing brackets");
      waiting.pop(); // the "("
    }
  }

  // Place what's left. A "(" still here was never closed: like most
  // calculators we close it for you, so "(2+3" means "(2+3)".
  while (waiting.length > 0) {
    const token = waiting.pop();
    if (token.type === "operator") output.push(token);
  }
  return output;
}

function applyOperator(operator, a, b) {
  switch (operator) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      if (b === 0) throw new CalcError("Can't divide by zero");
      return a / b;
  }
}

// Pass 2: RPN tokens -> one number
function evaluateRPN(rpn) {
  const stack = [];

  for (const token of rpn) {
    if (token.type === "number") {
      stack.push(token.value);
      continue;
    }
    if (stack.length < 2) throw new CalcError("Incomplete expression");
    const b = stack.pop(); // the top is the RIGHT-hand number: 8 2 / is 8÷2
    const a = stack.pop();
    stack.push(applyOperator(token.value, a, b));
  }

  if (stack.length !== 1) throw new CalcError("Incomplete expression");
  return stack[0];
}

// Ignore what's unfinished at the end, so "5+" or "5×(" count as "5".
// Real calculators do the same when you press = too early.
function trimIncomplete(expression) {
  return expression.replace(/[-+*/(]+$/, "");
}

// ===== Floating point =====
// Computers store numbers in binary, and most decimals (like 0.1) can't be
// written exactly in binary, just as 1/3 can't be written exactly in
// decimal (0.3333…). So 0.1 + 0.2 = 0.30000000000000004.
//
// The error is always far out in the last few digits. Rounding the answer
// to 12 significant digits removes it, and is still more precision than
// any real calculator shows.
const PRECISION = 12;

function tidy(value) {
  // Too big for JavaScript (over about 1.8 × 10^308) becomes Infinity,
  // and Infinity - Infinity is NaN. Neither is an answer.
  if (!Number.isFinite(value)) throw new CalcError("Number too large");

  const rounded = Number(value.toPrecision(PRECISION));
  // -0 exists in JavaScript (try -1 * 0). Nobody wants to see it.
  return rounded === 0 ? 0 : rounded;
}

// The whole thing: "2+3*4" -> 14. Throws CalcError for invalid maths.
export function calculate(expression) {
  const complete = trimIncomplete(expression);
  if (complete === "") throw new CalcError("Nothing to calculate");
  return tidy(evaluateRPN(toRPN(tokenize(complete))));
}

// The answer to show while typing, or null when there's nothing worth
// showing: a lone number ("12" = 12 isn't news) or maths that doesn't
// work yet ("5÷0" might become "5÷0.5").
export function preview(expression) {
  try {
    if (tokenize(trimIncomplete(expression)).length < 2) return null;
    return calculate(expression);
  } catch (error) {
    if (error instanceof CalcError) return null;
    throw error;
  }
}

// A number written so it can be typed back into an expression: no
// "1e+21" (we have no "e" key) and no thousands commas.
// 0.0000001 stays 0.0000001, 1e21 becomes "1000000000000000000000".
export function toExpression(value) {
  return value.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 20 });
}

// ===== Deleting =====
export function deleteLast(expression) {
  const shorter = expression.slice(0, -1);
  return shorter === "" ? INITIAL : shorter;
}
