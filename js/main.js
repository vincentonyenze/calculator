// Entry point: the only script loaded by index.html.
// It connects the page (buttons, keyboard, display) to the maths engine.
import { setupThemeToggle } from "./theme.js";
import { INITIAL, appendInput, deleteLast } from "./calculator.js";

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
};

// ===== Display =====
// The engine uses * / -, people expect × ÷ −
const DISPLAY_SYMBOLS = { "*": "×", "/": "÷", "-": "−" };

function toDisplay(expression) {
  return expression.replace(/[*/-]/g, (symbol) => DISPLAY_SYMBOLS[symbol]);
}

function render() {
  const { expression } = state;
  elements.expression.textContent = toDisplay(expression);
  elements.expression.classList.toggle(
    "display__expression--medium",
    expression.length >= MEDIUM_TEXT_FROM && expression.length < SMALL_TEXT_FROM
  );
  elements.expression.classList.toggle(
    "display__expression--small",
    expression.length >= SMALL_TEXT_FROM
  );
}

// ===== Input =====
// Commands that aren't "type this character". percent, negate and equals
// arrive in later steps.
const actions = {
  clear: () => INITIAL,
  backspace: deleteLast,
};

// One listener for the whole keypad (event delegation)
function handleKeypadClick(event) {
  const key = event.target.closest(".key");
  if (!key) return;

  const { value, action } = key.dataset;
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
