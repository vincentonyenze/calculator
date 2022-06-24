// Light / dark theme switch.
// Until the user clicks the button, the theme follows the system setting.
// After that, their choice is saved and wins.

const STORAGE_KEY = "calculator:theme";
const root = document.documentElement; // the <html> element
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

// The theme on screen right now: a saved choice, or else the system's
function currentTheme() {
  return root.dataset.theme ?? (darkQuery.matches ? "dark" : "light");
}

// The button shows the theme you'll switch TO, and says so to screen readers
function updateButton(button) {
  const next = currentTheme() === "dark" ? "light" : "dark";
  button.textContent = next === "dark" ? "🌙" : "☀️";
  button.setAttribute("aria-label", `Switch to ${next} theme`);
}

export function setupThemeToggle(button) {
  updateButton(button);

  button.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked (e.g. private mode): the theme still changes, it just isn't remembered
    }
    updateButton(button);
  });

  // If the system switches (e.g. night mode at sunset), keep the button right
  darkQuery.addEventListener("change", () => updateButton(button));
}
