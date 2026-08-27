"use client";

import { useEffect } from "react";

function loadHtml2Pdf() {
  return new Promise<any>((resolve, reject) => {
    const w = window as any;
    if (w.html2pdf) return resolve(w.html2pdf);
    const existing = document.getElementById("jgo-html2pdf") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).html2pdf), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = "jgo-html2pdf";
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => resolve((window as any).html2pdf);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function resumeName(article: HTMLElement) {
  const name = article.querySelector("h1")?.textContent?.trim() || "JGO";
  const cleaned = name.replace(/[^a-zA-Z0-9 .'-]/g, "").replace(/\s+/g, " ").trim();
  return `${cleaned || "JGO"} Resume.pdf`;
}

function enhanceLinkedIn(root: HTMLElement) {
  const paragraphs = Array.from(root.querySelectorAll("p"));
  const contact = paragraphs.find((p) => /linkedin\.com|linkedin/i.test(p.textContent || ""));
  if (!contact) return;
  const html = contact.innerHTML;
  const urlMatch = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s<|]+/i) || (contact.textContent || "").match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s|]+/i);
  if (!urlMatch) return;
  const url = urlMatch[0].replace(/[),.;]+$/, "");
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  contact.innerHTML = html.replace(new RegExp(escaped, "i"), `<a href="${url}" style="color:inherit;text-decoration:none">LinkedIn</a>`);
}

export default function ResumeExportEnhancer() {
  useEffect(() => {
    const handler = async (event: MouseEvent) => {
      if (window.location.pathname !== "/resume-builder") return;
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button") as HTMLButtonElement | null;
      if (!button || button.textContent?.trim() !== "Download PDF") return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const articles = Array.from(document.querySelectorAll("article")) as HTMLElement[];
      const source = articles.find((a) => a.querySelector("h1"));
      if (!source) return;

      const original = button.textContent;
      button.disabled = true;
      button.textContent = "Downloading…";
      try {
        const html2pdf = await loadHtml2Pdf();
        const clone = source.cloneNode(true) as HTMLElement;
        clone.style.width = "8.5in";
        clone.style.minHeight = "11in";
        clone.style.maxWidth = "none";
        clone.style.margin = "0";
        clone.style.padding = "0.5in 0.6in";
        clone.style.boxShadow = "none";
        clone.style.background = "white";
        clone.style.color = "black";
        enhanceLinkedIn(clone);
        await html2pdf().set({
          margin: 0,
          filename: resumeName(source),
          image: { type: "jpeg", quality: 1 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"], avoid: [".role-head", "li", "h2"] },
        }).from(clone).save();
      } catch (err) {
        console.error("JGO PDF export failed", err);
        alert("PDF download could not be generated. Please try again.");
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
