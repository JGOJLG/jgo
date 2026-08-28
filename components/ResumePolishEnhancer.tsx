"use client";

import { useEffect } from "react";

const PAGE_W = 612;
const PAGE_H = 792;
const LEFT = 46;
const RIGHT = 46;
const TOP = 54;
const BOTTOM = 46;
const CONTENT_W = PAGE_W - LEFT - RIGHT;

function findLinkedIn(raw: string) {
  const markdown = raw.match(/\[[^\]]*LinkedIn[^\]]*\]\((https?:\/\/(?:www\.)?linkedin\.com\/[^)]+)\)/i);
  const plain = raw.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)\]|]+/i);
  return (markdown?.[1] || plain?.[0] || "").replace(/[),.;]+$/, "");
}

function currentLinkedIn() {
  const textareas = Array.from(document.querySelectorAll("textarea")) as HTMLTextAreaElement[];
  for (const area of textareas) {
    const found = findLinkedIn(area.value || "");
    if (found) {
      sessionStorage.setItem("jgoResumeLinkedIn", found);
      return found;
    }
  }
  return sessionStorage.getItem("jgoResumeLinkedIn") || "";
}

function cleanContact(text: string) {
  return text
    .split("|")
    .map((p) => (/linkedin\.com/i.test(p) || /^\s*linkedin\s*$/i.test(p) ? "LinkedIn" : p.trim()))
    .filter(Boolean);
}

function getArticle() {
  return Array.from(document.querySelectorAll("article")).find((a) => a.querySelector("h1")) as HTMLElement | undefined;
}

function getSection(article: HTMLElement, name: RegExp) {
  const h = Array.from(article.querySelectorAll("h2")).find((x) => name.test((x.textContent || "").trim()));
  return h?.nextElementSibling as HTMLElement | null;
}

function polishPreview() {
  if (window.location.pathname !== "/resume-builder") return;
  const article = getArticle();
  if (!article) return;

  const linkedIn = currentLinkedIn();
  const contact = article.querySelector("h1 + p") as HTMLElement | null;
  if (contact) {
    const parts = cleanContact(contact.textContent || "");
    const desired = parts.map((p) => p === "LinkedIn" && linkedIn
      ? `<a data-jgo-linkedin="1" href="${linkedIn}" target="_blank" rel="noreferrer" style="color:inherit;text-decoration:underline;text-underline-offset:2px">LinkedIn</a>`
      : p).join(" &nbsp;|&nbsp; ");
    if (contact.innerHTML !== desired) contact.innerHTML = desired;
  }

  const exp = getSection(article, /^PROFESSIONAL EXPERIENCE$/i);
  if (exp) {
    Array.from(exp.children).forEach((role) => {
      const el = role as HTMLElement;
      el.style.marginBottom = "12px";
      const row = el.firstElementChild as HTMLElement | null;
      if (!row) return;
      row.style.display = "grid";
      row.style.gridTemplateColumns = "minmax(0, 1fr) max-content";
      row.style.width = "100%";
      row.style.columnGap = "18px";
      row.style.alignItems = "baseline";
      const date = row.lastElementChild as HTMLElement | null;
      if (date) {
        date.style.justifySelf = "end";
        date.style.textAlign = "right";
        date.style.whiteSpace = "nowrap";
        date.style.fontWeight = "400";
      }
    });
  }

  const edu = getSection(article, /^EDUCATION$/i);
  if (edu) Array.from(edu.children).forEach((entry) => ((entry as HTMLElement).style.marginBottom = "10px"));
}

function loadJsPdf() {
  return new Promise<any>((resolve, reject) => {
    const w = window as any;
    if (w.jspdf?.jsPDF) return resolve(w.jspdf.jsPDF);
    const old = document.getElementById("jgo-authoritative-jspdf") as HTMLScriptElement | null;
    if (old) {
      old.addEventListener("load", () => resolve((window as any).jspdf?.jsPDF), { once: true });
      old.addEventListener("error", reject, { once: true });
      return;
    }
    const s = document.createElement("script");
    s.id = "jgo-authoritative-jspdf";
    s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js";
    s.async = true;
    s.onload = () => resolve((window as any).jspdf?.jsPDF);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function filename(article: HTMLElement, ext: string) {
  const raw = article.querySelector("h1")?.textContent?.trim() || "JGO";
  const name = raw.replace(/[^a-zA-Z0-9 .'-]/g, "").replace(/\s+/g, " ").trim() || "JGO";
  return `${name} Resume.${ext}`;
}

function roleParts(role: HTMLElement) {
  const children = Array.from(role.children) as HTMLElement[];
  const row = children[0];
  const title = children[1]?.textContent?.trim() || "";
  const company = row?.children?.[0]?.textContent?.trim() || "";
  const dates = row?.children?.[1]?.textContent?.trim() || "";
  const intro = children.find((c) => c.tagName === "P")?.textContent?.trim() || "";
  const bullets = Array.from(role.querySelectorAll("ul li")).map((li) => li.textContent?.trim() || "").filter(Boolean);
  return { company, dates, title, intro, bullets };
}

function renderPdf(article: HTMLElement, jsPDF: any) {
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait", compress: true });
  let y = TOP;
  const lh = 12.2;
  const newPage = () => { doc.addPage(); y = TOP; };
  const ensure = (h: number) => { if (y + h > PAGE_H - BOTTOM) newPage(); };
  const normal = (size = 10.1) => { doc.setFont("times", "normal"); doc.setFontSize(size); };
  const bold = (size = 10.1) => { doc.setFont("times", "bold"); doc.setFontSize(size); };
  const italic = (size = 10.1) => { doc.setFont("times", "italic"); doc.setFontSize(size); };

  const paragraph = (text: string, extraBottom = 2) => {
    normal();
    const lines = doc.splitTextToSize(text, CONTENT_W);
    lines.forEach((line: string) => { ensure(lh); doc.text(line, LEFT, y); y += lh; });
    y += extraBottom;
  };
  const heading = (text: string) => {
    ensure(22);
    y += 5;
    bold();
    doc.text(text, LEFT, y);
    y += 3;
    doc.setLineWidth(.6);
    doc.line(LEFT, y, PAGE_W - RIGHT, y);
    y += 10;
  };
  const bullet = (text: string) => {
    normal();
    const lines = doc.splitTextToSize(text, CONTENT_W - 20);
    lines.forEach((line: string, i: number) => {
      ensure(lh);
      if (i === 0) doc.text("•", LEFT + 5, y);
      doc.text(line, LEFT + 17, y);
      y += lh;
    });
  };

  const name = article.querySelector("h1")?.textContent?.trim() || "";
  bold(18);
  doc.text(name, PAGE_W / 2, y, { align: "center" });
  y += 17;

  const contactEl = article.querySelector("h1 + p") as HTMLElement | null;
  const contactParts = cleanContact(contactEl?.textContent || "");
  const linkedIn = currentLinkedIn();
  normal(9.5);
  const sep = "  |  ";
  const full = contactParts.join(sep);
  let x = (PAGE_W - doc.getTextWidth(full)) / 2;
  contactParts.forEach((part, i) => {
    const width = doc.getTextWidth(part);
    if (part === "LinkedIn" && linkedIn) doc.textWithLink(part, x, y, { url: linkedIn });
    else doc.text(part, x, y);
    x += width;
    if (i < contactParts.length - 1) { doc.text(sep, x, y); x += doc.getTextWidth(sep); }
  });
  y += 13;

  const summary = getSection(article, /^PROFESSIONAL SUMMARY$/i);
  if (summary) { heading("PROFESSIONAL SUMMARY"); paragraph(summary.textContent?.trim() || "", 1); }

  const comps = getSection(article, /^CORE COMPETENCIES$/i);
  if (comps) { heading("CORE COMPETENCIES"); paragraph(comps.textContent?.trim() || "", 1); }

  const exp = getSection(article, /^PROFESSIONAL EXPERIENCE$/i);
  if (exp) {
    heading("PROFESSIONAL EXPERIENCE");
    Array.from(exp.children).forEach((node) => {
      const r = roleParts(node as HTMLElement);
      ensure(38);
      bold();
      doc.text(r.company, LEFT, y);
      normal();
      if (r.dates) doc.text(r.dates, PAGE_W - RIGHT, y, { align: "right" });
      y += lh;
      italic();
      doc.text(r.title, LEFT, y);
      y += lh;
      if (r.intro) paragraph(r.intro, 1);
      r.bullets.forEach(bullet);
      y += 8;
    });
  }

  const edu = getSection(article, /^EDUCATION$/i);
  if (edu) {
    heading("EDUCATION");
    Array.from(edu.children).forEach((node) => {
      const entry = node as HTMLElement;
      const parts = Array.from(entry.children) as HTMLElement[];
      const first = parts[0]?.textContent?.trim() || "";
      const second = parts[1]?.textContent?.trim() || "";
      ensure(28);
      bold(); doc.text(first, LEFT, y); y += lh;
      if (second) { normal(); doc.text(second, LEFT, y); y += lh; }
      y += 8;
    });
  }

  doc.setProperties({ title: filename(article, "pdf").replace(/\.pdf$/i, "") });
  doc.save(filename(article, "pdf"));
}

function renderWord(article: HTMLElement) {
  const linkedIn = currentLinkedIn();
  const contact = cleanContact(article.querySelector("h1 + p")?.textContent || "")
    .map((p) => p === "LinkedIn" && linkedIn ? `<a href="${linkedIn}" style="color:#000;text-decoration:underline">LinkedIn</a>` : p)
    .join(" &nbsp;|&nbsp; ");
  const summary = getSection(article, /^PROFESSIONAL SUMMARY$/i)?.textContent?.trim() || "";
  const comps = getSection(article, /^CORE COMPETENCIES$/i)?.textContent?.trim() || "";
  const exp = getSection(article, /^PROFESSIONAL EXPERIENCE$/i);
  const edu = getSection(article, /^EDUCATION$/i);
  const roles = exp ? Array.from(exp.children).map((n) => roleParts(n as HTMLElement)) : [];
  const edus = edu ? Array.from(edu.children).map((n) => Array.from((n as HTMLElement).children).map((c) => (c.textContent || "").trim())) : [];
  const sec = (title: string, body: string) => body ? `<h2>${title}</h2>${body}` : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:8.5in 11in;margin:.72in .64in .62in}body{font-family:Georgia,'Times New Roman',serif;font-size:10.2pt;line-height:1.2;color:#000}h1{text-align:center;font-size:18pt;margin:0 0 2pt}.contact{text-align:center;font-size:9.5pt;margin:0 0 8pt}h2{font-size:10.2pt;border-bottom:1px solid #000;padding-bottom:2pt;margin:8pt 0 4pt}.role{margin:0 0 9pt}.row{width:100%;border-collapse:collapse}.row td{padding:0}.company{font-weight:bold}.date{text-align:right;white-space:nowrap}.title{font-style:italic;margin:0 0 1pt}.intro{margin:1pt 0}ul{margin:2pt 0 0 17pt;padding:0}li{margin:0 0 1pt}.edu{margin:0 0 8pt}.degree{font-weight:bold}</style></head><body><h1>${nameEscape(article.querySelector("h1")?.textContent || "")}</h1><div class="contact">${contact}</div>${sec("PROFESSIONAL SUMMARY", summary ? `<p>${nameEscape(summary)}</p>` : "")}${sec("CORE COMPETENCIES", comps ? `<p>${nameEscape(comps)}</p>` : "")}${roles.length ? `<h2>PROFESSIONAL EXPERIENCE</h2>${roles.map((r) => `<div class="role"><table class="row"><tr><td class="company">${nameEscape(r.company)}</td><td class="date">${nameEscape(r.dates)}</td></tr></table><div class="title">${nameEscape(r.title)}</div>${r.intro ? `<p class="intro">${nameEscape(r.intro)}</p>` : ""}<ul>${r.bullets.map((b) => `<li>${nameEscape(b)}</li>`).join("")}</ul></div>`).join("")}` : ""}${edus.length ? `<h2>EDUCATION</h2>${edus.map((e) => `<div class="edu"><div class="degree">${nameEscape(e[0] || "")}</div>${e[1] ? `<div>${nameEscape(e[1])}</div>` : ""}</div>`).join("")}` : ""}</body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename(article, "doc");
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function nameEscape(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c] || c));
}

export default function ResumePolishEnhancer() {
  useEffect(() => {
    if (window.location.pathname !== "/resume-builder") return;
    let raf = 0;
    const run = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(polishPreview); };
    run();
    const observer = new MutationObserver(run);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    document.addEventListener("input", run, true);

    const click = async (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest("button") as HTMLButtonElement | null;
      if (!button) return;
      const label = (button.textContent || "").trim();
      if (label !== "Download PDF" && label !== "Download Word") return;
      const article = getArticle();
      if (!article) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const old = button.textContent;
      button.disabled = true;
      button.textContent = "Downloading…";
      try {
        polishPreview();
        if (label === "Download Word") renderWord(article);
        else {
          const jsPDF = await loadJsPdf();
          if (!jsPDF) throw new Error("PDF engine unavailable");
          renderPdf(article, jsPDF);
        }
      } catch (error) {
        console.error("JGO resume export error", error);
        alert("The resume could not be downloaded. Please refresh and try again.");
      } finally {
        button.disabled = false;
        button.textContent = old;
      }
    };
    document.addEventListener("click", click, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("input", run, true);
      document.removeEventListener("click", click, true);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
