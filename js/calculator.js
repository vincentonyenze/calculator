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

// ===== Deleting =====
export function deleteLast(expression) {
  const shorter = expression.slice(0, -1);
  return shorter === "" ? INITIAL : shorter;
}
