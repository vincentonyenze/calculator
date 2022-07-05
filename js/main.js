// Entry point: the only script loaded by index.html.
// It connects the page (buttons, keyboard, display) to the maths engine.
import { setupThemeToggle } from "./theme.js";
import {
  INITIAL,
  appendInput,
  deleteLast,
  calculate,
  preview,
  toExpression,
  CalcError,
} from "./calculator.js";
import { formatResult, groupDigits } from "./format.js";
import { keyFromKeyboard, cleanPastedText } from "./keyboard.js";

// How long a button looks pressed when its keyboard key is used
const PRESS_FLASH_MS = 120;

const elements = {
  keypad: document.getElementById("keypad"),
  display: document.querySelector(".display"),
  expression: document.getElementById("expression"),
  result: document.getElementById("result"),
  announcer: document.getElementById("announcer"),
  themeBtn: document.getElementById("theme-btn"),
};

// Expressions longer than these get a smaller font, so they stay readable
const MEDIUM_TEXT_FROM = 12;
const SMALL_TEXT_FROM = 20;

const state = {
  expression: INITIAL,
  // After "=": the sum that was calculated, shown small as "12+3×4 ="
  // while the answer takes the main line. null while typing.
  answeredFrom: null,
  error: "", // e.g. "Can't divide by zero", or "" when there's no error
};

// ===== Display =====
// The engine uses * / -, people expect × ÷ −
const DISPLAY_SYMBOLS = { "*": "×", "/": "÷", "-": "−" };

function toDisplay(expression) {
  return expression.replace(/[*/-]/g, (symbol) => DISPLAY_SYMBOLS[symbol]);
}

// "1234*-5" -> "1,234×−5"
function formatExpression(expression) {
  return toDisplay(groupDigits(expression));
}

// The small line under the expression: an error, "12+3×4 =" after an
// answer, or a live preview like "= 14" while typing
function resultLine() {
  if (state.error) return state.error;
  if (state.answeredFrom !== null) return `${formatExpression(state.answeredFrom)} =`;
  const value = preview(state.expression);
  return value === null ? "" : `= ${toDisplay(formatResult(value))}`;
}

function render() {
  const text = formatExpression(state.expression);
  elements.expression.textContent = text;
  elements.expression.classList.toggle(
    "display__expression--medium",
    text.length >= MEDIUM_TEXT_FROM && text.length < SMALL_TEXT_FROM
  );
  elements.expression.classList.toggle(
    "display__expression--small",
    text.length >= SMALL_TEXT_FROM
  );

  elements.result.textContent = resultLine();
  elements.result.classList.toggle("display__result--error", state.error !== "");
  elements.display.classList.toggle("display--answered", state.answeredFrom !== null);
}

// Tell screen readers. Clearing first means the same message twice in a
// row ("Can't divide by zero", again) is still read out.
function announce(message) {
  elements.announcer.textContent = "";
  requestAnimationFrame(() => {
    elements.announcer.textContent = message;
  });
}

// ===== Calculating =====
function equals() {
  // "=" again straight after an answer: nothing new to calculate
  if (state.answeredFrom !== null) return;

  try {
    const value = calculate(state.expression);
    state.answeredFrom = state.expression;
    // The answer becomes the expression, so you can carry on from it
    state.expression = toExpression(value);
    announce(`equals ${formatResult(value)}`);
  } catch (error) {
    // Invalid maths gets a friendly message; anything else is a bug in our code
    if (!(error instanceof CalcError)) throw error;
    state.error = error.message;
    announce(error.message);
  }
}

// Typing straight after "=": an operator carries on from the answer
// (14 then + gives 14+), but a number starts a new sum (14 then 5 gives 5)
function startsNewSum(value) {
  return /[\d.(]/.test(value);
}

// ===== Input =====
// Commands that aren't "type this character". percent and negate
// arrive in a later step.
const actions = {
  clear: () => INITIAL,
  backspace: deleteLast,
};

// Everything a key can do, whether it was clicked or (soon) typed.
// key: { value: "7" } or { action: "equals" }
function press({ value, action }) {
  if (action === "equals") {
    equals();
    render();
    return;
  }

  const wasAnswer = state.answeredFrom !== null;
  state.answeredFrom = null;
  state.error = "";

  if (value !== undefined) {
    const start = wasAnswer && startsNewSum(value) ? INITIAL : state.expression;
    state.expression = appendInput(start, value);
  } else if (actions[action]) {
    state.expression = actions[action](state.expression);
  } else {
    console.info(`"${action}" isn't built yet.`);
  }
  render();
}

// One listener for the whole keypad (event delegation)
function handleKeypadClick(event) {
  const key = event.target.closest(".key");
  if (!key) return;
  press(key.dataset);
}

// ===== Keyboard =====
// The on-screen button for a key, so it can look pressed
function findButton({ value, action }) {
  const selector = value !== undefined
    ? `[data-value="${CSS.escape(value)}"]`
    : `[data-action="${CSS.escape(action)}"]`;
  return elements.keypad.querySelector(selector);
}

function flashButton(button) {
  if (!button) return;
  button.classList.add("is-pressed");
  // A timer rather than keyup: keyup can be missed (e.g. if you switch
  // windows while holding a key), and the button would stay pressed
  clearTimeout(button.pressTimer);
  button.pressTimer = setTimeout(() => button.classList.remove("is-pressed"), PRESS_FLASH_MS);
}

function handleKeydown(event) {
  // Leave Ctrl+C, Ctrl+R, Alt+Tab and friends to the browser
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const key = keyFromKeyboard(event.key);
  if (!key) return;

  // Without this, Enter would ALSO click whichever button has focus,
  // and "/" opens Quick Find in Firefox
  event.preventDefault();
  press(key);
  flashButton(findButton(key));
}

// ===== Copy and paste =====
// Ctrl+C with nothing selected copies the expression (or the answer)
// as plain maths: "1234*-5", not "1,234×−5"
function handleCopy(event) {
  if (String(window.getSelection())) return; // copy the selection as usual
  event.preventDefault();
  event.clipboardData.setData("text/plain", state.expression);
}

// Ctrl+V types the pasted text in, one character at a time, through the
// same rules as the buttons. Bad characters are simply ignored.
function handlePaste(event) {
  event.preventDefault();
  const text = cleanPastedText(event.clipboardData.getData("text/plain"));
  for (const char of text) {
    press({ value: char });
  }
}

// ===== Init =====
elements.keypad.addEventListener("click", handleKeypadClick);
document.addEventListener("keydown", handleKeydown);
document.addEventListener("copy", handleCopy);
document.addEventListener("paste", handlePaste);
setupThemeToggle(elements.themeBtn);
render();
