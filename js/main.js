// Entry point: the only script loaded by index.html.
// It connects the page (buttons, keyboard, display) to the maths engine.
import { setupThemeToggle } from "./theme.js";

setupThemeToggle(document.getElementById("theme-btn"));
