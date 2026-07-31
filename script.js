(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const EXTERNAL_LINK_ATTRS = { target: "_blank", rel: "noreferrer" };

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return await res.json();
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

  function externalPill(href, text) {
    return el("a", { class: "pill", href, ...EXTERNAL_LINK_ATTRS, text });
  }

  function emptyContainer(id) {
    const node = document.getElementById(id);
    if (!node) return null;
    node.innerHTML = "";
    return node;
  }

  function linkCardPlaceholder() {
    return el("div", { class: "linkCardImg", "aria-hidden": "true" });
  }

  // Renders a list-backed section, reporting load state through its status node.
  function renderSection({ statusId, data, emptyMessage, render }) {
    const items = Array.isArray(data) ? data : [];
    setStatus(statusId, items.length ? "" : emptyMessage);
    render(items);
  }

  function renderLinkCard(link) {
    const hasImg = Boolean(link.image);
    const img = hasImg
      ? el("img", {
          class: "linkCardImg",
          src: link.image,
          alt: link.title ? `${link.title} preview` : "Link preview",
        })
      : linkCardPlaceholder();

    // If image 404, replace with blank placeholder box
    if (hasImg) {
      img.addEventListener("error", () => {
        img.replaceWith(linkCardPlaceholder());
      });
    }

    const right = el("div", {}, [
      el("h3", { class: "linkCardTitle", text: link.title || "Link" }),
      link.description ? el("p", { class: "linkCardDesc", text: link.description }) : el("span"),
      el("div", { class: "linkCardHost", text: hostFromUrl(link.url) }),
    ]);

    return el(
      "a",
      { class: "linkCard", href: link.url, ...EXTERNAL_LINK_ATTRS, "aria-label": link.title || "Link" },
      [img, right]
    );
  }

  function renderPapers(papers) {
    const list = emptyContainer("researchList");
    if (!list) return;

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
        externalPill(p.pdf, "View PDF"),
        el("a", { class: "pill", href: p.pdf, download: safeFileName(p.pdf), text: "Download" }),
      ]);

      // Optional extra links
      if (Array.isArray(p.links)) {
        for (const l of p.links) {
          if (!l || !l.url) continue;
          actions.append(externalPill(l.url, l.label || hostFromUrl(l.url)));
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

  function renderExperience(exps) {
    const list = emptyContainer("experienceList");
    if (!list) return;

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

  function setupActiveNav() {
    const links = $$(".nav a");
    const sections = $$("main .section");
    if (!links.length || !sections.length) return;

    const byHash = new Map(links.map((a) => [a.getAttribute("href"), a]));
    let isProgrammaticScroll = false;
    let programmaticScrollTimeout = null;
    const headerOffset = 110; // keep in sync with CSS scroll-margin-top
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setActiveLink(href) {
      for (const a of links) a.removeAttribute("aria-current");
      const target = byHash.get(href);
      if (target) target.setAttribute("aria-current", "true");
    }

    // Choose the last section whose top is above the header-adjusted scroll position.
    function updateActiveFromScroll() {
      // While we're animating a click-driven scroll, don't override the chosen tab.
      if (isProgrammaticScroll) return;

      const scrollPos = window.scrollY + headerOffset + 1;

      // If we're very close to the top, force About.
      if (window.scrollY < 40) {
        setActiveLink("#about");
        return;
      }

      let activeSection = sections[0];
      for (const section of sections) {
        if (scrollPos >= section.offsetTop) {
          activeSection = section;
        }
      }

      // If we're very close to the bottom, force the last section (Contact).
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        activeSection = sections[sections.length - 1];
      }

      if (activeSection) {
        setActiveLink(`#${activeSection.id}`);
      }
    }

    // Initial state
    updateActiveFromScroll();

    // Scroll listener (throttled with rAF)
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveFromScroll();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Recalculate on resize (in case layout shifts)
    window.addEventListener("resize", updateActiveFromScroll);

    // Handle click events on navigation links
    for (const link of links) {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || !href.startsWith("#")) return;

        e.preventDefault();
        const targetId = href.slice(1);
        const targetSection = document.getElementById(targetId);
        if (!targetSection) return;

        // Update active immediately
        setActiveLink(href);

        // Temporarily lock the active tab while we smooth scroll,
        // so the underline jumps straight to the clicked section.
        isProgrammaticScroll = true;
        if (programmaticScrollTimeout) clearTimeout(programmaticScrollTimeout);

        targetSection.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });

        // After the scroll animation, unlock and sync from scroll position once.
        programmaticScrollTimeout = setTimeout(() => {
          isProgrammaticScroll = false;
          updateActiveFromScroll();
        }, prefersReducedMotion ? 0 : 650);
      });
    }
  }

  function matchPhotoToProse() {
    const prose = $(".aboutProse");
    const photo = $(".aboutPhoto");
    if (prose && photo) {
      const proseHeight = prose.offsetHeight;
      photo.style.height = proseHeight + "px";
    }
  }

  async function main() {
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    setupActiveNav();

    setStatus("researchStatus", "Loading research…");
    setStatus("experienceStatus", "Loading experience…");

    try {
      const [papers, exps] = await Promise.all([
        fetchJson("data/papers.json"),
        fetchJson("data/experience.json"),
      ]);

      renderSection({
        statusId: "researchStatus",
        data: papers,
        emptyMessage: "No research yet.",
        render: renderPapers,
      });
      renderSection({
        statusId: "experienceStatus",
        data: exps,
        emptyMessage: "No experience entries yet.",
        render: renderExperience,
      });
    } catch (err) {
      console.error(err);
      const failure = "Failed to load data. Check the JSON files under data/.";
      for (const id of ["researchStatus", "experienceStatus"]) setStatus(id, failure);
    }

    // Match photo height after a short delay to ensure content is rendered
    setTimeout(matchPhotoToProse, 50);
    window.addEventListener("resize", matchPhotoToProse);
  }

  document.addEventListener("DOMContentLoaded", main);
})();
