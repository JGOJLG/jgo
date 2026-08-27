"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function EwcSafetyShell({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function markSavedSoon() {
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("saved"), 900);
  }

  function saveNow() {
    const active = document.activeElement as HTMLElement | null;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
      active.blur();
    }
    markSavedSoon();
  }

  useEffect(() => {
    function protectDelete(event: globalThis.MouseEvent) {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;

      const row = button.closest(".group");
      const isEwcRow = Boolean(row?.querySelector('input[id^="ewc-cell-"]'));
      if (!isEwcRow) return;

      const text = (button.textContent || "").trim().toLowerCase();
      const label = (button.getAttribute("aria-label") || "").toLowerCase();
      const title = (button.getAttribute("title") || "").toLowerCase();
      const looksLikeDelete =
        text === "×" ||
        text === "✕" ||
        text === "delete" ||
        label.includes("delete") ||
        title.includes("delete");

      if (!looksLikeDelete) return;

      const confirmed = window.confirm(
        "Are you sure you want to delete this finance row? This will remove the entire row.",
      );

      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    }

    document.addEventListener("click", protectDelete, true);
    return () => document.removeEventListener("click", protectDelete, true);
  }, []);

  return (
    <div onInputCapture={markSavedSoon}>
      <div className="sticky top-0 z-40 flex items-center justify-end gap-3 border-b border-[#dfe6db] bg-[#f7f8f3]/95 px-5 py-3 backdrop-blur lg:px-10">
        <span className={`text-xs font-semibold ${status === "saving" ? "text-[#8a6b3f]" : "text-[#647d5b]"}`}>
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Autosave on"}
        </span>
        <button
          type="button"
          onClick={saveNow}
          className="rounded-xl bg-[#647d5b] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4d6247]"
        >
          Save
        </button>
      </div>
      {children}
    </div>
  );
}
