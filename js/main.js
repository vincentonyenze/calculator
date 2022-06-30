// Entry point: the only script loaded by index.html.
// It connects the page (buttons, keyboard, display) to the maths engine.
import { setupThemeToggle } from "./theme.js";
import { INITIAL, appendInput, deleteLast, calculate, CalcError } from "./calculator.js";
import { formatResult, groupDigits } from "./format.js";

const elements = {
  keypad: document.getElementById("keypad"),
  expression: document.getElementById("expression"),
  result: document.getElementById("result"),
  themeBtn: document.getElementById("theme-btn"),
};

// Expressions longer than these get a smaller font, so they stay readable
const MEDIUM_TEXT_FROM = 12;
const SMALL_TEXT_FROM = 20;

const state = {
  expression: INITIAL,
  result: "", // the text under the expression: "= 14", or an error message
  isError: false,
};

// ===== Display =====
// The engine uses * / -, people expect × ÷ −
const DISPLAY_SYMBOLS = { "*": "×", "/": "÷", "-": "−" };

function toDisplay(expression) {
  return expression.replace(/[*/-]/g, (symbol) => DISPLAY_SYMBOLS[symbol]);
}

function render() {
  // "1234*-5" -> "1,234×−5"
  const text = toDisplay(groupDigits(state.expression));
  elements.expression.textContent = text;
  elements.expression.classList.toggle(
    "display__expression--medium",
    text.length >= MEDIUM_TEXT_FROM && text.length < SMALL_TEXT_FROM
  );
  elements.expression.classList.toggle(
    "display__expression--small",
    text.length >= SMALL_TEXT_FROM
  );

  elements.result.textContent = state.result;
  elements.result.classList.toggle("display__result--error", state.isError);
}

// ===== Calculating =====
function equals() {
  try {
    const value = calculate(state.expression);
    state.result = `= ${toDisplay(formatResult(value))}`;
    state.isError = false;
  } catch (error) {
    // Invalid maths gets a friendly message; anything else is a bug in our code
    if (!(error instanceof CalcError)) throw error;
    state.result = error.message;
    state.isError = true;
  }
}

// ===== Input =====
// Commands that aren't "type this character". percent and negate
// arrive in a later step.
const actions = {
  clear: () => INITIAL,
  backspace: deleteLast,
};

// One listener for the whole keypad (event delegation)
function handleKeypadClick(event) {
  const key = event.target.closest(".key");
  if (!key) return;

  const { value, action } = key.dataset;

  if (action === "equals") {
    equals();
    render();
    return;
  }

  // Any other key: the old answer no longer matches what's on screen
  state.result = "";
  state.isError = false;

  if (value !== undefined) {
    state.expression = appendInput(state.expression, value);
  } else if (actions[action]) {
    state.expression = actions[action](state.expression);
  } else {
    console.info(`"${action}" isn't built yet.`);
  }
  render();
}

// ===== Init =====
elements.keypad.addEventListener("click", handleKeypadClick);
setupThemeToggle(elements.themeBtn);
render();
