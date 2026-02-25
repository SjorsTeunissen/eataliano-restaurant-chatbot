import "@testing-library/jest-dom/vitest";

// Polyfill scrollIntoView for jsdom
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = () => {};
}
