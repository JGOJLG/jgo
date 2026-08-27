"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    jspdf?: { jsPDF: new (opts?: any) => any };
  }
}

const LEFT = 43;
const RIGHT = 43;
const TOP = 52;
const BOTTOM = 44;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - LEFT - RIGHT;

function loadJsPdf() {
  return new Promise<any>((resolve, reject) => {
    if (window.jspdf?.jsPDF) return resolve(window.jspdf.jsPDF);
    const existing = document.getElementById("jgo-jspdf") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.jspdf?.jsPDF), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = "jgo-jspdf";
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js";
    script.onload = () => resolve(window.jspdf?.jsPDF);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function cleanName(name: string) {
  return name.replace(/[^a-zA-Z0-9 .'-]/g, "").replace(/\s+/g, " ").trim() || "JGO";
}

function resumeName(article: HTMLElement) {
  return `${cleanName(article.querySelector("h1")?.textContent?.trim() || "JGO")} Resume.pdf`;
}

function findLinkedInUrl() {
  const stored = sessionStorage.getItem("jgoResumeLinkedIn");
  if (stored) return stored;
  const textareas = Array.from(document.querySelectorAll("textarea")) as HTMLTextAreaElement[];
  for (const area of textareas) {
    const match = area.value.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)\]|]+/i);
    if (match) return match[0].replace(/[),.;]+$/, "");
  }
  const article = document.querySelector("article");
  const match = article?.textContent?.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s|]+/i);
  return match?.[0]?.replace(/[),.;]+$/, "") || "";
}

function captureLinkedInBeforeParse() {
  const raw = (document.querySelector("textarea") as HTMLTextAreaElement | null)?.value || "";
  const markdown = raw.match(/\[[^\]]*LinkedIn[^\]]*\]\((https?:\/\/(?:www\.)?linkedin\.com\/[^)]+)\)/i);
  const plain = raw.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)\]|]+/i);
  const url = (markdown?.[1] || plain?.[0] || "").replace(/[),.;]+$/, "");
  if (url) sessionStorage.setItem("jgoResumeLinkedIn", url);
}

function contactParts(text: string, linkedInUrl: string) {
  const raw = text.split("|").map((x) => x.trim()).filter(Boolean);
  return raw.map((part) => {
    if (/linkedin\.com/i.test(part) || /^linkedin$/i.test(part)) return { text: "LinkedIn", url: linkedInUrl || "" };
    return { text: part, url: "" };
  });
}

function sectionBody(section: HTMLElement) {
  return section.querySelector(":scope > div") as HTMLElement | null;
}

function buildVectorPdf(article: HTMLElement, jsPDF: any) {
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait", compress: true });
  let y = TOP;
  const linkedInUrl = findLinkedInUrl();

  const setNormal = (size = 10.2) => { doc.setFont("times", "normal"); doc.setFontSize(size); };
  const setBold = (size = 10.2) => { doc.setFont("times", "bold"); doc.setFontSize(size); };
  const lineHeight = (size: number) => size * 1.2;
  const newPage = () => { doc.addPage(); y = TOP; };
  const ensure = (height: number) => { if (y + height > PAGE_HEIGHT - BOTTOM) newPage(); };

  const name = article.querySelector("h1")?.textContent?.trim() || "";
  setBold(18);
  doc.text(name, PAGE_WIDTH / 2, y, { align: "center" });
  y += 18;

  const contact = article.querySelector("h1 + p")?.textContent?.trim() || "";
  const parts = contactParts(contact, linkedInUrl);
  setNormal(9.5);
  const separator = "  |  ";
  const labels = parts.map((p) => p.text);
  const fullContact = labels.join(separator);
  const fullWidth = doc.getTextWidth(fullContact);
  let x = (PAGE_WIDTH - fullWidth) / 2;
  parts.forEach((part, index) => {
    const width = doc.getTextWidth(part.text);
    if (part.url) {
      doc.textWithLink(part.text, x, y, { url: part.url });
    } else {
      doc.text(part.text, x, y);
    }
    x += width;
    if (index < parts.length - 1) {
      doc.text(separator, x, y);
      x += doc.getTextWidth(separator);
    }
  });
  y += 15;

  const renderHeading = (title: string) => {
    ensure(22);
    y += 2;
    setBold(10.2);
    doc.text(title, LEFT, y);
    y += 3;
    doc.setLineWidth(0.6);
    doc.line(LEFT, y, PAGE_WIDTH - RIGHT, y);
    y += 8;
  };

  const renderParagraph = (text: string) => {
    setNormal(10.2);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    for (const line of lines) {
      ensure(lineHeight(10.2));
      doc.text(line, LEFT, y);
      y += lineHeight(10.2);
    }
    y += 1;
  };

  const renderBullet = (text: string) => {
    setNormal(10.2);
    const bulletX = LEFT + 8;
    const textX = LEFT + 19;
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 19);
    lines.forEach((line: string, index: number) => {
      ensure(lineHeight(10.2));
      if (index === 0) doc.text("•", bulletX, y);
      doc.text(line, textX, y);
      y += lineHeight(10.2);
    });
    y += 0.5;
  };

  const sections = Array.from(article.querySelectorAll(":scope > section")) as HTMLElement[];
  for (const section of sections) {
    const title = section.querySelector("h2")?.textContent?.trim() || "";
    if (!title) continue;
    const body = sectionBody(section);
    renderHeading(title);
    if (!body) continue;

    if (/SUMMARY/i.test(title) || /COMPETENC/i.test(title)) {
      renderParagraph(body.textContent?.trim() || "");
      continue;
    }

    if (/EXPERIENCE/i.test(title)) {
      const roles = Array.from(body.children) as HTMLElement[];
      for (const role of roles) {
        const children = Array.from(role.children) as HTMLElement[];
        const jobTitle = children[0]?.textContent?.trim() || "";
        const companyDate = children[1];
        const company = companyDate?.children?.[0]?.textContent?.trim() || "";
        const dates = companyDate?.children?.[1]?.textContent?.trim() || "";
        const ul = role.querySelector("ul");
        const bullets = Array.from(ul?.querySelectorAll("li") || []).map((li) => li.textContent?.trim() || "").filter(Boolean);

        ensure(34);
        setBold(10.2);
        doc.text(jobTitle, LEFT, y);
        y += lineHeight(10.2);
        setNormal(10.2);
        doc.text(company, LEFT, y);
        if (dates) doc.text(dates, PAGE_WIDTH - RIGHT, y, { align: "right" });
        y += lineHeight(10.2) + 1;
        bullets.forEach(renderBullet);
        y += 3;
      }
      continue;
    }

    if (/EDUCATION/i.test(title)) {
      const entries = Array.from(body.children) as HTMLElement[];
      for (const entry of entries) {
        ensure(28);
        const degree = entry.children[0]?.textContent?.trim() || "";
        const school = entry.children[1]?.textContent?.trim() || "";
        setBold(10.2);
        doc.text(degree, LEFT, y);
        y += lineHeight(10.2);
        if (school) {
          setNormal(10.2);
          doc.text(school, LEFT, y);
          y += lineHeight(10.2);
        }
        y += 2;
      }
      continue;
    }

    renderParagraph(body.textContent?.trim() || "");
  }

  doc.setProperties({ title: resumeName(article).replace(/\.pdf$/i, "") });
  doc.save(resumeName(article));
}

function downloadWord(article: HTMLElement) {
  const clone = article.cloneNode(true) as HTMLElement;
  const linkedInUrl = findLinkedInUrl();
  const contact = clone.querySelector("h1 + p") as HTMLElement | null;
  if (contact) {
    const parts = contactParts(contact.textContent?.trim() || "", linkedInUrl);
    contact.innerHTML = parts.map((p) => p.url ? `<a href="${p.url}" style="color:#000;text-decoration:none">LinkedIn</a>` : p.text).join(" &nbsp;|&nbsp; ");
  }
  clone.style.boxShadow = "none";
  const name = cleanName(clone.querySelector("h1")?.textContent?.trim() || "JGO");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:8.5in 11in;margin:.72in .60in .60in}.job-title{font-weight:700}body{font-family:Georgia,'Times New Roman',serif;font-size:10.2pt;line-height:1.2;color:#000}h1{text-align:center;font-size:18pt;margin:0 0 2pt}h2{font-size:10.2pt;border-bottom:1px solid #000;padding-bottom:2pt;margin:7pt 0 4pt}p{margin:1.4pt 0}ul{margin:2pt 0 5pt 17pt;padding:0}li{margin:0 0 1pt}</style></head><body>${clone.innerHTML}</body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name} Resume.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function ResumeExportEnhancer() {
  useEffect(() => {
    const handler = async (event: MouseEvent) => {
      if (window.location.pathname !== "/resume-builder") return;
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button") as HTMLButtonElement | null;
      if (!button) return;
      const label = button.textContent?.trim() || "";

      if (label === "Format JGO Resume") {
        captureLinkedInBeforeParse();
        return;
      }

      if (label !== "Download PDF" && label !== "Download Word") return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const article = Array.from(document.querySelectorAll("article")).find((a) => a.querySelector("h1")) as HTMLElement | undefined;
      if (!article) return;

      const original = button.textContent;
      button.disabled = true;
      button.textContent = "Downloading…";
      try {
        if (label === "Download Word") {
          downloadWord(article);
        } else {
          const jsPDF = await loadJsPdf();
          if (!jsPDF) throw new Error("PDF engine did not load.");
          buildVectorPdf(article, jsPDF);
        }
      } catch (err) {
        console.error("JGO resume export failed", err);
        alert("Resume download could not be generated. Please try again.");
      } finally {
        button.disabled = false;
        button.textContent = original;
      }
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  return null;
}
