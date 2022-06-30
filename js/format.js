// Making numbers easy to read on the display. Like calculator.js this has
// no DOM code: text in, text out, so it's tested in tests/format.test.js.

// Up to 12 significant digits with thousands separators: 1,234,567.891
const standard = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 12 });

// Huge and tiny numbers: 1.2345679E21 instead of 25 digits of zeros
const scientific = new Intl.NumberFormat("en-US", {
  notation: "scientific",
  maximumSignificantDigits: 8,
});

// Beyond these, a number is easier to read in scientific notation
const LARGE = 1e15;
const SMALL = 1e-9;

export function formatResult(value) {
  const size = Math.abs(value);
  const useScientific = size >= LARGE || (size > 0 && size < SMALL);
  return (useScientific ? scientific : standard).format(value);
}

// Add commas to every number inside an expression, but only to the whole
// part: "1234567.1234+5000" -> "1,234,567.1234+5,000"
export function groupDigits(expression) {
  return expression.replace(/\d+(\.\d*)?/g, (number) => {
    const [whole, decimals] = number.split(".");
    // \B(?=(\d{3})+(?!\d)) finds each spot with a multiple of 3 digits after it
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decimals === undefined ? grouped : `${grouped}.${decimals}`;
  });
}
