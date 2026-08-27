"use client";

import { useEffect } from "react";

function findLinkedIn(raw: string) {
  const markdown = raw.match(/\[[^\]]*LinkedIn[^\]]*\]\((https?:\/\/(?:www\.)?linkedin\.com\/[^)]+)\)/i);
  const plain = raw.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)\]|]+/i);
  return (markdown?.[1] || plain?.[0] || "").replace(/[),.;]+$/, "");
}

function cleanLinkedInDisplay(text: string) {
  return text
    .split("|")
    .map((part) => (/linkedin\.com/i.test(part) ? "LinkedIn" : part.trim()))
    .filter(Boolean)
    .join(" | ");
}

function polishPreview() {
  if (window.location.pathname !== "/resume-builder") return;
  const article = document.querySelector("article") as HTMLElement | null;
  if (!article) return;

  const raw = (document.querySelector("textarea") as HTMLTextAreaElement | null)?.value || "";
  const linkedInUrl = findLinkedIn(raw) || sessionStorage.getItem("jgoResumeLinkedIn") || "";
  if (linkedInUrl) sessionStorage.setItem("jgoResumeLinkedIn", linkedInUrl);

  const contact = article.querySelector("h1 + p") as HTMLElement | null;
  if (contact) {
    const original = contact.textContent || "";
    const parts = cleanLinkedInDisplay(original).split("|").map((x) => x.trim()).filter(Boolean);
    contact.innerHTML = parts
      .map((part) => part === "LinkedIn" && linkedInUrl
        ? `<a href="${linkedInUrl}" target="_blank" rel="noreferrer" style="color:inherit;text-decoration:underline;text-underline-offset:2px">LinkedIn</a>`
        : part)
      .join(" &nbsp;|&nbsp; ");
  }

  const experienceHeading = Array.from(article.querySelectorAll("h2")).find((h) => /PROFESSIONAL EXPERIENCE/i.test(h.textContent || ""));
  const experienceBody = experienceHeading?.nextElementSibling as HTMLElement | null;
  if (experienceBody) {
    Array.from(experienceBody.children).forEach((role) => {
      const el = role as HTMLElement;
      el.style.marginBottom = "10px";
      const first = el.firstElementChild as HTMLElement | null;
      if (first) {
        first.style.display = "grid";
        first.style.gridTemplateColumns = "1fr auto";
        first.style.columnGap = "16px";
        first.style.alignItems = "baseline";
        const date = first.lastElementChild as HTMLElement | null;
        if (date) {
          date.style.justifySelf = "end";
          date.style.textAlign = "right";
          date.style.whiteSpace = "nowrap";
          date.style.fontWeight = "400";
        }
      }
    });
  }

  const educationHeading = Array.from(article.querySelectorAll("h2")).find((h) => /^EDUCATION$/i.test((h.textContent || "").trim()));
  const educationBody = educationHeading?.nextElementSibling as HTMLElement | null;
  if (educationBody) {
    Array.from(educationBody.children).forEach((entry) => {
      (entry as HTMLElement).style.marginBottom = "8px";
    });
  }
}

export default function ResumePolishEnhancer() {
  useEffect(() => {
    if (window.location.pathname !== "/resume-builder") return;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(polishPreview);
    };
    run();
    const observer = new MutationObserver(run);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    document.addEventListener("input", run, true);
    document.addEventListener("click", run, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("input", run, true);
      document.removeEventListener("click", run, true);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
