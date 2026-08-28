"use client";

import { useEffect } from "react";

function findLinkedIn(raw: string) {
  const markdown = raw.match(/\[[^\]]*LinkedIn[^\]]*\]\((https?:\/\/(?:www\.)?linkedin\.com\/[^)]+)\)/i);
  const plain = raw.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)\]|]+/i);
  return (markdown?.[1] || plain?.[0] || "").replace(/[),.;]+$/, "");
}

function getArticle() {
  return Array.from(document.querySelectorAll("article")).find((a) => a.querySelector("h1")) as HTMLElement | undefined;
}

function sectionFor(article: HTMLElement, pattern: RegExp) {
  const heading = Array.from(article.querySelectorAll("h2")).find((h) => pattern.test((h.textContent || "").trim()));
  return heading?.parentElement as HTMLElement | null;
}

function entries(section: HTMLElement | null) {
  if (!section) return [];
  return Array.from(section.children).filter((el) => el.tagName !== "H2") as HTMLElement[];
}

function polish() {
  if (window.location.pathname !== "/resume-builder") return;
  const article = getArticle();
  if (!article) return;

  const exp = sectionFor(article, /^PROFESSIONAL EXPERIENCE$/i);
  entries(exp).forEach((role) => {
    role.style.marginBottom = "14px";
    const row = role.firstElementChild as HTMLElement | null;
    if (!row) return;

    // The actual resume markup puts company and date directly inside this row.
    // Absolute positioning guarantees the date is flush with the resume's right edge.
    row.style.position = "relative";
    row.style.display = "block";
    row.style.width = "100%";
    row.style.minHeight = "1.2em";
    row.style.paddingRight = "145px";

    const company = row.firstElementChild as HTMLElement | null;
    const date = row.lastElementChild as HTMLElement | null;
    if (company) {
      company.style.display = "block";
      company.style.maxWidth = "calc(100% - 145px)";
    }
    if (date && date !== company) {
      date.style.position = "absolute";
      date.style.right = "0";
      date.style.top = "0";
      date.style.margin = "0";
      date.style.padding = "0";
      date.style.textAlign = "right";
      date.style.whiteSpace = "nowrap";
      date.style.fontWeight = "400";
    }
  });

  const edu = sectionFor(article, /^EDUCATION$/i);
  entries(edu).forEach((entry) => {
    entry.style.marginBottom = "11px";
  });

  const raw = (document.querySelector("textarea") as HTMLTextAreaElement | null)?.value || "";
  const found = findLinkedIn(raw);
  if (found) sessionStorage.setItem("jgoResumeLinkedIn", found);
  const linkedIn = found || sessionStorage.getItem("jgoResumeLinkedIn") || "";
  const contact = article.querySelector("h1 + p") as HTMLElement | null;
  if (contact && linkedIn && !contact.querySelector("a[data-jgo-linkedin]")) {
    const parts = (contact.textContent || "").split("|").map((p) => p.trim()).filter(Boolean);
    contact.innerHTML = parts.map((p) => {
      if (/linkedin/i.test(p)) return `<a data-jgo-linkedin="1" href="${linkedIn}" target="_blank" rel="noreferrer" style="color:inherit;text-decoration:underline">LinkedIn</a>`;
      return p;
    }).join(" &nbsp;|&nbsp; ");
  }
}

export default function ResumePolishEnhancer() {
  useEffect(() => {
    if (window.location.pathname !== "/resume-builder") return;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(polish);
    };
    run();
    const observer = new MutationObserver(run);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    document.addEventListener("input", run, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("input", run, true);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
