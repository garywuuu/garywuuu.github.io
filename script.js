(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return await res.json();
  }

  function currentPath() {
    const path = window.location.pathname.replace(/index\.html$/, "");
    if (path.length > 1 && path.endsWith("/")) return path;
    return path || "/";
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, String(v));
    }
    for (const c of children) node.append(c);
    return node;
  }

  function formatMonth(ym) {
    // Accepts YYYY-MM or YYYY-MM-DD
    if (!ym) return "";
    const parts = ym.split("-");
    if (parts.length < 2) return ym;
    const year = parts[0];
    const monthIdx = Number(parts[1]) - 1;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = months[monthIdx] ?? parts[1];
    return `${m} ${year}`;
  }

  function hostFromUrl(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  function safeFileName(path) {
    if (!path) return "";
    const seg = path.split("/").filter(Boolean);
    return seg[seg.length - 1] || path;
  }

  function setStatus(id, msg) {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = msg || "";
    node.style.display = msg ? "block" : "none";
  }

  function renderLinkCard(link) {
    const hasImg = Boolean(link.image);
    const img = hasImg
      ? el("img", {
          class: "linkCardImg",
          src: link.image,
          alt: link.title ? `${link.title} preview` : "Link preview",
        })
      : el("div", { class: "linkCardImg", "aria-hidden": "true" });

    // If image 404, replace with blank placeholder box
    if (hasImg) {
      img.addEventListener("error", () => {
        const placeholder = el("div", { class: "linkCardImg", "aria-hidden": "true" });
        img.replaceWith(placeholder);
      });
    }

    const right = el("div", {}, [
      el("h3", { class: "linkCardTitle", text: link.title || "Link" }),
      link.description ? el("p", { class: "linkCardDesc", text: link.description }) : el("span"),
      el("div", { class: "linkCardHost", text: hostFromUrl(link.url) }),
    ]);

    return el(
      "a",
      { class: "linkCard", href: link.url, target: "_blank", rel: "noreferrer", "aria-label": link.title || "Link" },
      [img, right]
    );
  }

  function renderPapers(papers) {
    const list = document.getElementById("researchList");
    if (!list) return;
    list.innerHTML = "";

    for (const [idx, p] of papers.entries()) {
      const titleRow = el("div", {}, [
        el("h3", { class: "cardTitle", text: p.title || "Untitled research" }),
        el(
          "div",
          { class: "cardMeta" },
          [
            p.venue ? el("span", { text: p.venue }) : el("span"),
            p.venue && p.year ? el("span", { text: " • " }) : el("span"),
            p.year ? el("span", { text: String(p.year) }) : el("span"),
          ].filter((n) => n.textContent !== "")
        ),
      ]);

      const actions = el("div", { class: "row" }, [
        el("a", { class: "pill", href: p.pdf, target: "_blank", rel: "noreferrer", text: "View PDF" }),
        el("a", { class: "pill", href: p.pdf, download: safeFileName(p.pdf), text: "Download" }),
      ]);

      // Optional extra links
      if (Array.isArray(p.links)) {
        for (const l of p.links) {
          if (!l || !l.url) continue;
          actions.append(el("a", { class: "pill", href: l.url, target: "_blank", rel: "noreferrer", text: l.label || hostFromUrl(l.url) }));
        }
      }

      const card = el("article", { class: "card" }, [
        titleRow,
        p.summary ? el("p", { class: "cardText", text: p.summary }) : el("span"),
        actions,
      ]);

      if (p.abstract) {
        const detailsId = `research-abs-${idx}`;
        const btn = el("button", {
          class: "pill",
          type: "button",
          "aria-expanded": "false",
          "aria-controls": detailsId,
          text: "Show abstract",
        });
        const details = el("div", { class: "details", id: detailsId, hidden: "true" }, [el("p", { class: "cardText", text: p.abstract })]);

        btn.addEventListener("click", () => {
          const open = btn.getAttribute("aria-expanded") === "true";
          btn.setAttribute("aria-expanded", open ? "false" : "true");
          btn.textContent = open ? "Show abstract" : "Hide abstract";
          if (open) details.setAttribute("hidden", "true");
          else details.removeAttribute("hidden");
        });

        actions.append(btn);
        card.append(details);
      }

      list.append(card);
    }
  }

  function renderExperience(exps, linksById) {
    const list = document.getElementById("experienceList");
    if (!list) return;
    list.innerHTML = "";

    const score = (e) => {
      // prefer end date, otherwise start date; higher is more recent
      const key = e.end || e.start || "";
      return key.replaceAll("-", "");
    };
    const sorted = [...exps].sort((a, b) => (score(b) > score(a) ? 1 : -1));

    for (const e of sorted) {
      // Title and org
      const titleText = e.title || "Role";
      const metaText = e.org ? ` • ${e.org}` : "";
      const children = [el("h3", { text: `${titleText}${metaText}` })];

      // Bullets as a single paragraph
      if (Array.isArray(e.bullets) && e.bullets.length) {
        const paragraphText = e.bullets.join(" ");
        children.push(el("p", { text: paragraphText }));
      }

      const entry = el("div", { class: "experienceEntry" }, children);
      list.append(entry);
    }
  }

  function setupBackToGame() {
    if (document.body.classList.contains("playPage")) return;
    if (!document.querySelector(".siteHeader")) return;
    if (document.querySelector(".backToGame")) return;
    const bar = el("div", { class: "backToGame" }, [
      el("a", { class: "playCta", href: "/", text: "Back to game" }),
    ]);
    document.body.append(bar);
  }

  function setupActiveNav() {
    const links = $$(".nav a");
    if (!links.length) return;

    const path = currentPath();
    for (const a of links) {
      const href = a.getAttribute("href");
      if (!href) continue;
      const normalized = href === "/" ? "/" : href.endsWith("/") ? href : `${href}/`;
      const isActive = normalized === "/" ? path === "/" : path.startsWith(normalized);
      if (isActive) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }
  }

  function matchPhotoToProse() {
    const prose = document.querySelector(".aboutProse");
    const photo = document.querySelector(".aboutPhoto");
    if (prose && photo) {
      const proseHeight = prose.offsetHeight;
      photo.style.height = proseHeight + "px";
    }
  }

  async function main() {
    const yearNodes = $$("[data-year], #year");
    const year = String(new Date().getFullYear());
    for (const node of yearNodes) node.textContent = year;

    setupActiveNav();
    setupBackToGame();

    const needsResearch = Boolean(document.getElementById("researchList"));
    const needsExperience = Boolean(document.getElementById("experienceList"));

    if (needsResearch) setStatus("researchStatus", "Loading research…");
    if (needsExperience) setStatus("experienceStatus", "Loading experience…");

    if (needsResearch || needsExperience) {
      try {
        const [papers, exps, links] = await Promise.all([
          needsResearch ? fetchJson("/data/papers.json") : Promise.resolve([]),
          needsExperience ? fetchJson("/data/experience.json") : Promise.resolve([]),
          fetchJson("/data/links.json").catch(() => ({})),
        ]);

        if (needsResearch) {
          if (!Array.isArray(papers) || papers.length === 0) setStatus("researchStatus", "No research yet.");
          else setStatus("researchStatus", "");
          renderPapers(Array.isArray(papers) ? papers : []);
        }

        if (needsExperience) {
          if (!Array.isArray(exps) || exps.length === 0) setStatus("experienceStatus", "No experience entries yet.");
          else setStatus("experienceStatus", "");
          renderExperience(Array.isArray(exps) ? exps : [], links && typeof links === "object" ? links : {});
        }
      } catch (err) {
        console.error(err);
        if (needsResearch) setStatus("researchStatus", "Failed to load data. Check the JSON files under data/.");
        if (needsExperience) setStatus("experienceStatus", "Failed to load data. Check the JSON files under data/.");
      }
    }

    setTimeout(matchPhotoToProse, 50);
    window.addEventListener("resize", matchPhotoToProse);
  }

  document.addEventListener("DOMContentLoaded", main);
})();
