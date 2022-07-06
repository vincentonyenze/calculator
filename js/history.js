// The list of past calculations, newest first, saved in localStorage.
// Each entry: { expression: "12+3*4", result: 24, at: 1656900000000 }
//
// The list logic is in pure functions (addEntry, parseHistory), tested in
// tests/history.test.js. Only loadHistory and saveHistory touch storage.

const STORAGE_KEY = "calculator:history";

// Enough to scroll back through, small enough to never fill up storage
export const MAX_ENTRIES = 50;

// A new list with the entry at the top. Pressing = on the same sum twice
// in a row doesn't add it twice. The oldest entries drop off the end.
export function addEntry(history, entry) {
  if (history[0]?.expression === entry.expression) return history;
  return [entry, ...history].slice(0, MAX_ENTRIES);
}

function isValidEntry(entry) {
  return (
    Boolean(entry) &&
    typeof entry.expression === "string" &&
    entry.expression !== "" &&
    Number.isFinite(entry.result) &&
    Number.isFinite(entry.at)
  );
}

// Saved text -> a list we can trust. Anything broken is dropped, so a
// damaged save can't crash the calculator.
export function parseHistory(text) {
  try {
    const saved = JSON.parse(text);
    if (!Array.isArray(saved)) return [];
    return saved.filter(isValidEntry).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function loadHistory() {
  try {
    return parseHistory(localStorage.getItem(STORAGE_KEY));
  } catch {
    return []; // storage blocked, e.g. some private browsing modes
  }
}

export function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn("Couldn't save history:", error.message);
  }
}
