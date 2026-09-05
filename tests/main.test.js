import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import site from "../script.js";

const { main } = site;

const PAGE_HTML = `
  <nav class="nav"><a href="#about">About</a></nav>
  <main>
    <section id="about" class="section"><div class="aboutProse"></div><div class="aboutPhoto"></div></section>
    <section id="research" class="section"><p id="researchStatus"></p><div id="researchList"></div></section>
    <section id="experience" class="section"><p id="experienceStatus"></p><div id="experienceList"></div></section>
  </main>
  <footer><span id="year"></span></footer>
`;

function mockFetch(responses) {
  return vi.fn(async (path) => {
    if (!(path in responses)) return { ok: false, status: 404, json: async () => ({}) };
    const entry = responses[path];
    if (entry instanceof Error) throw entry;
    return { ok: true, status: 200, json: async () => entry };
  });
}

const statusText = (id) => document.getElementById(id).textContent;

describe("main", () => {
  beforeEach(() => {
    document.body.innerHTML = PAGE_HTML;
    vi.useFakeTimers();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the current year, papers and experience", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        "data/papers.json": [{ title: "Paper A", pdf: "assets/papers/a.pdf" }],
        "data/experience.json": [{ title: "Engineer", org: "Acme" }],
        "data/links.json": { acme: { url: "https://acme.com" } },
      })
    );

    await main();

    expect(document.getElementById("year").textContent).toBe(String(new Date().getFullYear()));
    expect(document.querySelectorAll("#researchList article.card")).toHaveLength(1);
    expect(document.querySelectorAll("#experienceList .experienceEntry")).toHaveLength(1);
    expect(statusText("researchStatus")).toBe("");
    expect(statusText("experienceStatus")).toBe("");
  });

  it("requests the data files without caching", async () => {
    const fetchMock = mockFetch({
      "data/papers.json": [],
      "data/experience.json": [],
      "data/links.json": {},
    });
    vi.stubGlobal("fetch", fetchMock);

    await main();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith("data/papers.json", { cache: "no-store" });
  });

  it("shows empty states when the data files have no entries", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ "data/papers.json": [], "data/experience.json": [], "data/links.json": {} })
    );

    await main();

    expect(statusText("researchStatus")).toBe("No research yet.");
    expect(statusText("experienceStatus")).toBe("No experience entries yet.");
  });

  it("shows empty states when the data files are not arrays", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ "data/papers.json": {}, "data/experience.json": {}, "data/links.json": {} })
    );

    await main();

    expect(statusText("researchStatus")).toBe("No research yet.");
    expect(statusText("experienceStatus")).toBe("No experience entries yet.");
    expect(document.getElementById("researchList").children).toHaveLength(0);
  });

  it("tolerates a missing links.json", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ "data/papers.json": [], "data/experience.json": [{ title: "Engineer" }] })
    );

    await main();

    expect(statusText("experienceStatus")).toBe("");
    expect(document.querySelectorAll("#experienceList .experienceEntry")).toHaveLength(1);
  });

  it("tolerates a links.json that is not an object", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        "data/papers.json": [],
        "data/experience.json": [{ title: "Engineer" }],
        "data/links.json": "not an object",
      })
    );

    await main();

    expect(document.querySelectorAll("#experienceList .experienceEntry")).toHaveLength(1);
  });

  it("shows an error status when a required data file fails to load", async () => {
    vi.stubGlobal("fetch", mockFetch({ "data/experience.json": [], "data/links.json": {} }));

    await main();

    const message = "Failed to load data. Check the JSON files under data/.";
    expect(statusText("researchStatus")).toBe(message);
    expect(statusText("experienceStatus")).toBe(message);
    expect(console.error).toHaveBeenCalled();
  });

  it("shows an error status when the network request rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await main();

    expect(statusText("researchStatus")).toBe("Failed to load data. Check the JSON files under data/.");
  });

  it("sizes the about photo once the content has rendered", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ "data/papers.json": [], "data/experience.json": [], "data/links.json": {} })
    );
    Object.defineProperty(document.querySelector(".aboutProse"), "offsetHeight", {
      value: 300,
      configurable: true,
    });

    await main();
    vi.advanceTimersByTime(50);

    expect(document.querySelector(".aboutPhoto").style.height).toBe("300px");
  });

  it("resizes the about photo when the window resizes", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ "data/papers.json": [], "data/experience.json": [], "data/links.json": {} })
    );

    await main();

    Object.defineProperty(document.querySelector(".aboutProse"), "offsetHeight", {
      value: 250,
      configurable: true,
    });
    window.dispatchEvent(new window.Event("resize"));

    expect(document.querySelector(".aboutPhoto").style.height).toBe("250px");
  });
});
