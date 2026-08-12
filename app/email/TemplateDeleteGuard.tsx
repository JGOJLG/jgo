"use client";

import { useEffect } from "react";

export default function TemplateDeleteGuard() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;
      if (button.textContent?.trim() !== "Delete") return;
      if (button.dataset.confirmedDelete === "true") {
        delete button.dataset.confirmedDelete;
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const confirmed = window.confirm("Are you sure you want to delete this template?");
      if (!confirmed) return;

      button.dataset.confirmedDelete = "true";
      button.click();
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
