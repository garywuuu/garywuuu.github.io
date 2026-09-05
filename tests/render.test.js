import { describe, expect, it, beforeEach } from "vitest";
import site from "../script.js";

const { renderLinkCard, renderPapers, renderExperience } = site;

describe("renderLinkCard", () => {
  it("renders an image, title, description and host", () => {
    const card = renderLinkCard({
      url: "https://www.example.com/post",
      title: "A post",
      description: "Some description",
      image: "assets/images/post.png",
    });

    expect(card.tagName).toBe("A");
    expect(card.getAttribute("href")).toBe("https://www.example.com/post");
    expect(card.getAttribute("target")).toBe("_blank");
    expect(card.getAttribute("aria-label")).toBe("A post");
    expect(card.querySelector("img.linkCardImg").getAttribute("alt")).toBe("A post preview");
    expect(card.querySelector(".linkCardTitle").textContent).toBe("A post");
    expect(card.querySelector(".linkCardDesc").textContent).toBe("Some description");
    expect(card.querySelector(".linkCardHost").textContent).toBe("example.com");
  });

  it("falls back to placeholders when title, description and image are missing", () => {
    const card = renderLinkCard({ url: "https://example.com" });
    expect(card.getAttribute("aria-label")).toBe("Link");
    expect(card.querySelector(".linkCardTitle").textContent).toBe("Link");
    expect(card.querySelector(".linkCardDesc")).toBeNull();
    expect(card.querySelector("img")).toBeNull();
    expect(card.querySelector("div.linkCardImg").getAttribute("aria-hidden")).toBe("true");
  });

  it("replaces a broken image with a placeholder box", () => {
    const card = renderLinkCard({ url: "https://example.com", image: "missing.png" });
    const img = card.querySelector("img.linkCardImg");
    img.dispatchEvent(new window.Event("error"));

    expect(card.querySelector("img")).toBeNull();
    expect(card.querySelector("div.linkCardImg").getAttribute("aria-hidden")).toBe("true");
  });

  it("uses an untitled image alt when there is no title", () => {
    const card = renderLinkCard({ url: "https://example.com", image: "a.png" });
    expect(card.querySelector("img").getAttribute("alt")).toBe("Link preview");
  });
});

describe("renderPapers", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="researchList"><span>stale</span></div>';
  });

  const list = () => document.getElementById("researchList");

  it("does nothing when the list container is missing", () => {
    document.body.innerHTML = "";
    expect(() => renderPapers([{ title: "x" }])).not.toThrow();
  });

  it("clears previous content and renders one card per paper", () => {
    renderPapers([{ title: "One" }, { title: "Two" }]);
    expect(list().textContent).not.toContain("stale");
    expect(list().querySelectorAll("article.card")).toHaveLength(2);
  });

  it("renders title, meta, summary and PDF actions", () => {
    renderPapers([
      {
        title: "Sparse models",
        venue: "NeurIPS",
        year: 2023,
        summary: "A summary.",
        pdf: "assets/papers/sparse.pdf",
      },
    ]);

    const card = list().querySelector("article.card");
    expect(card.querySelector(".cardTitle").textContent).toBe("Sparse models");
    expect(card.querySelector(".cardMeta").textContent).toBe("NeurIPS • 2023");
    expect(card.querySelector(".cardText").textContent).toBe("A summary.");

    const [view, download] = card.querySelectorAll("a.pill");
    expect(view.textContent).toBe("View PDF");
    expect(view.getAttribute("href")).toBe("assets/papers/sparse.pdf");
    expect(download.getAttribute("download")).toBe("sparse.pdf");
  });

  it("omits empty meta parts and falls back to a default title", () => {
    renderPapers([{ year: 2020 }]);
    const card = list().querySelector("article.card");
    expect(card.querySelector(".cardTitle").textContent).toBe("Untitled research");
    expect(card.querySelector(".cardMeta").textContent).toBe("2020");
  });

  it("renders extra links, labelling them by host when no label is given", () => {
    renderPapers([
      {
        title: "With links",
        links: [
          { url: "https://www.arxiv.org/abs/1", label: "arXiv" },
          { url: "https://code.example.com/repo" },
          { label: "no url" },
          null,
        ],
      },
    ]);

    const labels = Array.from(list().querySelectorAll("a.pill")).map((a) => a.textContent);
    expect(labels).toEqual(["View PDF", "Download", "arXiv", "code.example.com"]);
  });

  it("toggles the abstract details from the button", () => {
    renderPapers([{ title: "With abstract", abstract: "The abstract." }]);

    const btn = list().querySelector("button.pill");
    const details = list().querySelector(".details");
    expect(btn.getAttribute("aria-controls")).toBe(details.id);
    expect(details.id).toBe("research-abs-0");
    expect(details.hasAttribute("hidden")).toBe(true);

    btn.dispatchEvent(new window.Event("click"));
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(btn.textContent).toBe("Hide abstract");
    expect(details.hasAttribute("hidden")).toBe(false);

    btn.dispatchEvent(new window.Event("click"));
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.textContent).toBe("Show abstract");
    expect(details.hasAttribute("hidden")).toBe(true);
  });

  it("does not render an abstract toggle when there is no abstract", () => {
    renderPapers([{ title: "No abstract" }]);
    expect(list().querySelector("button.pill")).toBeNull();
    expect(list().querySelector(".details")).toBeNull();
  });
});

describe("renderExperience", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="experienceList"><span>stale</span></div>';
  });

  const list = () => document.getElementById("experienceList");

  it("does nothing when the list container is missing", () => {
    document.body.innerHTML = "";
    expect(() => renderExperience([{ title: "x" }], {})).not.toThrow();
  });

  it("sorts entries by end date, then start date, most recent first", () => {
    renderExperience(
      [
        { title: "Older", start: "2020-01", end: "2020-06" },
        { title: "Ongoing", start: "2024-01" },
        { title: "Middle", start: "2022-01", end: "2022-12" },
      ],
      {}
    );

    const titles = Array.from(list().querySelectorAll("h3")).map((h) => h.textContent);
    expect(titles).toEqual(["Ongoing", "Middle", "Older"]);
  });

  it("sorts undated entries last", () => {
    renderExperience([{ title: "Undated" }, { title: "Dated", start: "2019-01" }], {});

    const titles = Array.from(list().querySelectorAll("h3")).map((h) => h.textContent);
    expect(titles).toEqual(["Dated", "Undated"]);
  });

  it("renders the org next to the title and joins bullets into one paragraph", () => {
    renderExperience([{ title: "Engineer", org: "Acme", bullets: ["Built things.", "Shipped things."] }], {});

    const entry = list().querySelector(".experienceEntry");
    expect(entry.querySelector("h3").textContent).toBe("Engineer • Acme");
    expect(entry.querySelector("p").textContent).toBe("Built things. Shipped things.");
  });

  it("falls back to a default title and omits the paragraph without bullets", () => {
    renderExperience([{ bullets: [] }], {});

    const entry = list().querySelector(".experienceEntry");
    expect(entry.querySelector("h3").textContent).toBe("Role");
    expect(entry.querySelector("p")).toBeNull();
  });

  it("clears previous content and does not mutate the input array", () => {
    const exps = [{ title: "A", end: "2020-01" }, { title: "B", end: "2021-01" }];
    renderExperience(exps, {});

    expect(list().textContent).not.toContain("stale");
    expect(exps.map((e) => e.title)).toEqual(["A", "B"]);
  });
});
