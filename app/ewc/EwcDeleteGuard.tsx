"use client";

import { useEffect } from "react";

export default function EwcDeleteGuard() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;

      const label = (button.textContent || "").trim();
      if (label !== "×") return;

      const confirmed = window.confirm(
        "Are you sure you want to delete this finance row? This will remove the entire row.",
      );

      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
