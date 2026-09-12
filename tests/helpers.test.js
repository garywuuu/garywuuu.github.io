import { describe, expect, it, beforeEach } from "vitest";
import site from "../script.js";

const { el, formatMonth, hostFromUrl, safeFileName, setStatus } = site;

describe("el", () => {
  it("creates a node with the requested tag", () => {
    expect(el("section").tagName).toBe("SECTION");
  });

  it("maps class and text attrs to className and textContent", () => {
    const node = el("p", { class: "cardText", text: "hello" });
    expect(node.className).toBe("cardText");
    expect(node.textContent).toBe("hello");
  });

  it("sets remaining attrs as string attributes and skips nullish values", () => {
    const node = el("a", { href: "/a.pdf", tabindex: 0, download: null, hidden: undefined });
    expect(node.getAttribute("href")).toBe("/a.pdf");
    expect(node.getAttribute("tabindex")).toBe("0");
    expect(node.hasAttribute("download")).toBe(false);
    expect(node.hasAttribute("hidden")).toBe(false);
  });

  it("registers function values for on* keys as event listeners", () => {
    let clicks = 0;
    const node = el("button", { onclick: () => (clicks += 1) });
    node.dispatchEvent(new window.Event("click"));
    expect(clicks).toBe(1);
  });

  it("treats non-function on* values as attributes", () => {
    const node = el("button", { onclick: "noop()" });
    expect(node.getAttribute("onclick")).toBe("noop()");
  });

  it("appends children in order", () => {
    const node = el("div", {}, [el("span", { text: "a" }), "b"]);
    expect(node.textContent).toBe("ab");
    expect(node.children).toHaveLength(1);
  });
});

describe("formatMonth", () => {
  it("formats YYYY-MM and YYYY-MM-DD", () => {
    expect(formatMonth("2024-01")).toBe("Jan 2024");
    expect(formatMonth("2024-12-31")).toBe("Dec 2024");
  });

  it("returns an empty string for missing input", () => {
    expect(formatMonth("")).toBe("");
    expect(formatMonth(undefined)).toBe("");
  });

  it("returns the input unchanged when there is no month part", () => {
    expect(formatMonth("2024")).toBe("2024");
  });

  it("falls back to the raw month when it is out of range", () => {
    expect(formatMonth("2024-13")).toBe("13 2024");
  });
});

describe("hostFromUrl", () => {
  it("returns the hostname without a www prefix", () => {
    expect(hostFromUrl("https://www.example.com/a/b?c=1")).toBe("example.com");
    expect(hostFromUrl("https://docs.example.com")).toBe("docs.example.com");
  });

  it("returns the input when it is not a valid URL", () => {
    expect(hostFromUrl("not a url")).toBe("not a url");
  });
});

describe("safeFileName", () => {
  it("returns the last non-empty path segment", () => {
    expect(safeFileName("assets/papers/thesis.pdf")).toBe("thesis.pdf");
    expect(safeFileName("/a/b/c/")).toBe("c");
  });

  it("returns an empty string for missing input", () => {
    expect(safeFileName("")).toBe("");
    expect(safeFileName(undefined)).toBe("");
  });

  it("returns the input when there are no segments", () => {
    expect(safeFileName("/")).toBe("/");
  });
});

describe("setStatus", () => {
  beforeEach(() => {
    document.body.innerHTML = '<p id="researchStatus"></p>';
  });

  it("shows the message", () => {
    setStatus("researchStatus", "Loading…");
    const node = document.getElementById("researchStatus");
    expect(node.textContent).toBe("Loading…");
    expect(node.style.display).toBe("block");
  });

  it("hides the node when the message is empty", () => {
    setStatus("researchStatus", "Loading…");
    setStatus("researchStatus", "");
    const node = document.getElementById("researchStatus");
    expect(node.textContent).toBe("");
    expect(node.style.display).toBe("none");
  });

  it("does nothing when the node is missing", () => {
    expect(() => setStatus("missingStatus", "hi")).not.toThrow();
  });
});
