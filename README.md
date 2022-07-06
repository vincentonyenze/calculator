# Calculator

An expression calculator built with plain HTML, CSS and JavaScript. No frameworks, no libraries, and **no `eval()`**: the maths engine (tokenizer and shunting-yard evaluator) is written from scratch and covered by **116 automated tests**.

This is **Project 9** in my beginner-to-expert web development roadmap, and the first project of Level 2. It's also my first project with automated tests, a `package.json`, and a feature built on a branch and merged with a pull request.

<!-- Add a screenshot: save one as screenshot.png in this folder and uncomment the line below -->
<!-- ![Calculator screenshot](screenshot.png) -->

## Features

- Whole expressions with the correct **order of operations**: `2+3×4 = 14`
- **Brackets**, including nested ones; an unclosed bracket is closed for you
- **Live preview** of the answer while you type
- Carry on from an answer (`+`), or start a new sum (a number)
- **%** like a shop calculator: `80 + 15%` → `92`
- **±** flips the sign of the last number or bracket
- No floating-point surprises: `0.1 + 0.2 = 0.3`
- Thousands separators, and scientific notation for huge or tiny answers
- Friendly errors such as *Can't divide by zero*
- Input rules that make invalid sums impossible (no `5+×3`, no `1.2.3`)
- **Full keyboard support**, with on-screen buttons that press down
- **Copy and paste** whole expressions (`1,234 × 2` pastes as `1234*2`)
- **History panel**: the last 50 calculations, saved in the browser; click one to reuse it
- Light and dark themes (follows your system until you choose)
- Screen-reader friendly: labelled buttons, and answers announced on `=`

## Keyboard shortcuts

| Key | Action |
|---|---|
| `0`–`9` `.` | Digits and decimal point |
| `+` `-` `*` `/` (or `x`) | Operators |
| `(` `)` | Brackets |
| `Enter` or `=` | Equals |
| `Backspace` | Delete last |
| `Esc` / `Delete` | Clear all (or close History) |
| `%` | Percent |
| `F9` | ± (plus or minus) |
| `Ctrl+C` / `Ctrl+V` | Copy the expression / paste one in |

## Built with

- HTML5 (`<output>`, `aria-live`, `aria-expanded`, `aria-keyshortcuts`, `inert`)
- CSS3 (Grid with spanning cells, custom properties, light/dark themes, `prefers-reduced-motion`)
- Vanilla JavaScript (ES6+) in ES modules
- `Intl.NumberFormat`, `localStorage`, `matchMedia`, clipboard events
- **Node's built-in test runner** (`node --test`): no testing library needed

## How it works

Pressing `=` on `2+3*4` runs three steps, all in `js/calculator.js`:

**1. Tokenize**: cut the text into pieces.
```
"2+3*4"  →  2   +   3   *   4
```

**2. Reorder** with the **shunting-yard algorithm** (Dijkstra, 1961) into Reverse Polish Notation, where each operator comes after its two numbers. The order of operations is now built into the order of the tokens:
```
2 + 3 * 4   →   2 3 4 * +
```

**3. Evaluate** with a stack: numbers are pushed, and each operator pops two, calculates, and pushes the answer.
```
2 → [2]   3 → [2,3]   4 → [2,3,4]   * → [2,12]   + → [14]
```

The answer is then rounded to 12 significant digits, which removes floating-point errors like `0.30000000000000004`.

### Why not `eval()`?

`eval()` runs *any* JavaScript, not just maths, so text that reaches it (from a paste or saved history) could run code. It also can't give helpful errors like *Can't divide by zero*. Writing the evaluator is safer, and it's how real interpreters and compilers work.

### Logic separate from the page

The engine files (`calculator.js`, `format.js`, `keyboard.js`, `history.js`) contain **no DOM code**: text in, text or numbers out. That's what makes them testable in Node without a browser. `main.js` is the only file that connects them to the page.

## What I learned

- **Tokenizing and parsing:** how text becomes something a computer can calculate
- **The shunting-yard algorithm,** Reverse Polish Notation and stacks
- **Operator precedence** and left-to-right evaluation (`8-3-2 = 3`)
- **Floating point:** why `0.1 + 0.2 ≠ 0.3`, and how to deal with it
- **Pure functions** and separating logic from the UI
- **Automated testing** with `node --test` and `node:assert`, table-driven tests, and property tests ("± twice changes nothing")
- **`package.json`** and npm scripts
- **Input validation by design:** making invalid states impossible
- **Keyboard handling:** `event.key`, `preventDefault`, and one `press()` for clicks, keys and paste
- **Accessibility:** `aria-live` announcements, `inert`, focus management, keyboard shortcuts
- **Number formatting** with `Intl.NumberFormat`, and the difference between a value, its display and its typed form
- **Git branches and pull requests:** building a feature on a branch and merging it

## How to run

1. Clone the repository:
   ```bash
   git clone https://github.com/vincentonyenze/calculator.git
   cd calculator
   ```
2. Open the folder in VS Code and start **Live Server** (right-click `index.html` → *Open with Live Server*).

A local server is needed because browsers block ES modules on pages opened straight from a file (`file://`). There's nothing to install.

## Running the tests

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm test             # run all tests once
npm run test:watch   # re-run them every time a file is saved
```

There are 116 tests across four files:

| File | Tests |
|---|---|
| `tests/calculator.test.js` | input rules, tokenizer, evaluator, floating point, preview, ±, % |
| `tests/format.test.js` | thousands separators, scientific notation |
| `tests/keyboard.test.js` | key mapping, cleaning pasted text |
| `tests/history.test.js` | adding entries, limits, damaged saved data |

## Project structure

```
calculator/
├── index.html          # Display, keypad, history panel
├── style.css           # Layout, keypad grid, themes, history panel
├── package.json        # npm scripts for the tests
├── js/
│   ├── main.js         # Connects the page to the engine: state, render, events
│   ├── calculator.js   # The engine: input rules, tokenizer, evaluator, ±, %
│   ├── format.js       # Number formatting for the display
│   ├── keyboard.js     # Keyboard keys and pasted text -> calculator input
│   ├── history.js      # History list and saving it
│   └── theme.js        # Light / dark theme switch
├── tests/              # Automated tests (node --test)
└── README.md
```

## Known limitations

- Answers smaller than 10⁻²⁰ become 0 when you carry on calculating with them (they still display correctly).
- Precision is 12 significant digits, like most calculators. It's not suitable for exact money calculations with very large amounts.
- No exponents, square roots or other scientific functions.
- History is saved in this browser only.

## Possible improvements

- Scientific functions: `^`, `√`, `sin`, `cos`, `log`
- A cursor, so you can edit the middle of an expression
- Repeat the last operation when `=` is pressed again (`2 + 3 = = =` → 8, 11)
- Deploy it to GitHub Pages
