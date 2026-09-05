import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import site from "../script.js";

const { setupActiveNav, matchPhotoToProse } = site;

const NAV_HTML = `
  <nav class="nav">
    <a href="#about">About</a>
    <a href="#research">Research</a>
    <a href="#contact">Contact</a>
    <a href="https://example.com">External</a>
  </nav>
  <main>
    <section id="about" class="section"></section>
    <section id="research" class="section"></section>
    <section id="contact" class="section"></section>
  </main>
`;

function stubLayout(offsetTops, { scrollHeight = 3000, innerHeight = 800 } = {}) {
  for (const [id, top] of Object.entries(offsetTops)) {
    Object.defineProperty(document.getElementById(id), "offsetTop", { value: top, configurable: true });
  }
  Object.defineProperty(document.documentElement, "scrollHeight", { value: scrollHeight, configurable: true });
  window.innerHeight = innerHeight;
}

function scrollTo(y) {
  window.scrollY = y;
  window.dispatchEvent(new window.Event("scroll"));
  // Flush the requestAnimationFrame throttle.
  vi.advanceTimersByTime(0);
}

function activeHref() {
  const active = document.querySelector(".nav a[aria-current='true']");
  return active ? active.getAttribute("href") : null;
}

describe("setupActiveNav", () => {
  beforeEach(() => {
    document.body.innerHTML = NAV_HTML;
    window.scrollY = 0;
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 0));
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does nothing when there are no nav links or sections", () => {
    document.body.innerHTML = '<nav class="nav"></nav><main></main>';
    expect(() => setupActiveNav()).not.toThrow();
    expect(activeHref()).toBeNull();
  });

  it("marks the first link active at the top of the page", () => {
    stubLayout({ about: 0, research: 900, contact: 1800 });
    setupActiveNav();
    expect(activeHref()).toBe("#about");
  });

  it("updates the active link while scrolling", () => {
    stubLayout({ about: 0, research: 900, contact: 1800 });
    setupActiveNav();

    scrollTo(1000);
    expect(activeHref()).toBe("#research");

    scrollTo(50);
    expect(activeHref()).toBe("#about");
  });

  it("forces the last section active at the bottom of the page", () => {
    stubLayout({ about: 0, research: 900, contact: 2900 }, { scrollHeight: 3000, innerHeight: 800 });
    setupActiveNav();

    scrollTo(2200);
    expect(activeHref()).toBe("#contact");
  });

  it("keeps only one active link at a time", () => {
    stubLayout({ about: 0, research: 900, contact: 1800 });
    setupActiveNav();

    scrollTo(1000);
    scrollTo(1900);
    expect(document.querySelectorAll(".nav a[aria-current='true']")).toHaveLength(1);
    expect(activeHref()).toBe("#contact");
  });

  it("recomputes the active link on resize", () => {
    stubLayout({ about: 0, research: 900, contact: 1800 });
    setupActiveNav();

    window.scrollY = 1000;
    window.dispatchEvent(new window.Event("resize"));
    expect(activeHref()).toBe("#research");
  });

  it("smooth scrolls on click and locks the active link until the animation ends", () => {
    stubLayout({ about: 0, research: 900, contact: 1800 });
    setupActiveNav();

    const researchLink = document.querySelector(".nav a[href='#research']");
    const event = new window.Event("click", { cancelable: true });
    researchLink.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.getElementById("research").scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(activeHref()).toBe("#research");

    // Scroll events during the animation must not steal the active state.
    scrollTo(0);
    expect(activeHref()).toBe("#research");

    window.scrollY = 1000;
    vi.advanceTimersByTime(650);
    expect(activeHref()).toBe("#research");
  });

  it("restarts the unlock timer when a second link is clicked", () => {
    stubLayout({ about: 0, research: 900, contact: 1800 });
    setupActiveNav();

    document.querySelector(".nav a[href='#research']").dispatchEvent(new window.Event("click", { cancelable: true }));
    vi.advanceTimersByTime(400);
    document.querySelector(".nav a[href='#contact']").dispatchEvent(new window.Event("click", { cancelable: true }));

    // The first timer must not unlock the nav while the second scroll is running.
    window.scrollY = 0;
    vi.advanceTimersByTime(400);
    expect(activeHref()).toBe("#contact");

    vi.advanceTimersByTime(250);
    expect(activeHref()).toBe("#about");
  });

  it("scrolls instantly when the user prefers reduced motion", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    stubLayout({ about: 0, research: 900, contact: 1800 });
    setupActiveNav();

    document.querySelector(".nav a[href='#research']").dispatchEvent(new window.Event("click", { cancelable: true }));
    expect(document.getElementById("research").scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("ignores clicks on links that are not in-page anchors", () => {
    stubLayout({ about: 0, research: 900, contact: 1800 });
    setupActiveNav();

    const external = document.querySelector(".nav a[href='https://example.com']");
    const event = new window.Event("click", { cancelable: true });
    external.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(window.HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("ignores clicks whose target section does not exist", () => {
    document.body.innerHTML = NAV_HTML.replace('<section id="contact" class="section"></section>', "");
    stubLayout({ about: 0, research: 900 });
    setupActiveNav();

    const contactLink = document.querySelector(".nav a[href='#contact']");
    contactLink.dispatchEvent(new window.Event("click", { cancelable: true }));

    expect(window.HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(activeHref()).toBe("#about");
  });
});

describe("matchPhotoToProse", () => {
  it("matches the photo height to the prose height", () => {
    document.body.innerHTML = '<div class="aboutProse"></div><div class="aboutPhoto"></div>';
    Object.defineProperty(document.querySelector(".aboutProse"), "offsetHeight", { value: 420, configurable: true });

    matchPhotoToProse();
    expect(document.querySelector(".aboutPhoto").style.height).toBe("420px");
  });

  it("does nothing when either element is missing", () => {
    document.body.innerHTML = '<div class="aboutProse"></div>';
    expect(() => matchPhotoToProse()).not.toThrow();
  });
});
