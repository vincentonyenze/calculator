// Turning keyboard keys (and pasted text) into calculator input.
// No DOM code here either, so it's tested in tests/keyboard.test.js.

// Keys that type themselves: 0-9 . + - * / ( )
const TYPING_KEYS = "0123456789.+-*/()";

// Other keys, and what they mean on the calculator
const KEY_MAP = {
  Enter: { action: "equals" },
  "=": { action: "equals" },
  Backspace: { action: "backspace" },
  Escape: { action: "clear" },
  Delete: { action: "clear" },
  "%": { action: "percent" },
  F9: { action: "negate" }, // the ± key in Windows Calculator
  x: { value: "*" }, // people often type x for "times"
  X: { value: "*" },
  ",": { value: "." }, // the decimal key on some number pads
};

// event.key -> { value } or { action }, or null if the key isn't ours.
// event.key is the character produced ("7", "+"), so the number pad and
// the top row give the same result without any extra work.
export function keyFromKeyboard(key) {
  if (TYPING_KEYS.includes(key)) return { value: key };
  return KEY_MAP[key] ?? null;
}

// Pasted text -> characters the calculator understands.
// "1,234 × 2" -> "1234*2". Anything else (letters, $) is left for
// appendInput to ignore.
export function cleanPastedText(text) {
  return text
    .replace(/[×xX]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-") // the display's minus and the "en dash" Word likes
    .replace(/[\s,]/g, ""); // spaces, line breaks and thousands commas
}
