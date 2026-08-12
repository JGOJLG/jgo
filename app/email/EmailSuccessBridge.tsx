"use client";

import { useEffect, useRef, useState } from "react";

const TOAST_KEY = "jgo-email-success-toast";

export default function EmailSuccessBridge() {
  const [toast, setToast] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show(message: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(message);
    sessionStorage.setItem(TOAST_KEY, message);
    timerRef.current = setTimeout(() => {
      setToast("");
      sessionStorage.removeItem(TOAST_KEY);
    }, 1400);
  }

  useEffect(() => {
    const pending = sessionStorage.getItem(TOAST_KEY);
    if (pending) show(pending);

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const url = typeof args[0] === "string" ? args[0] : args[0] instanceof Request ? args[0].url : "";
      if (url.includes("/api/email/send") && response.ok) {
        show("✓ Email Sent");
      }
      return response;
    };

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;
      if (button.textContent?.trim() !== "Save") return;

      const templateInput = document.querySelector<HTMLInputElement>('input[placeholder="Template name"]');
      if (!templateInput || !templateInput.value.trim()) return;
      const originalName = templateInput.value.trim();
      let attempts = 0;
      const watcher = window.setInterval(() => {
        attempts += 1;
        const currentInput = document.querySelector<HTMLInputElement>('input[placeholder="Template name"]');
        const errorVisible = Array.from(document.querySelectorAll("div")).some((node) => /could not save template|add a template name, subject, and email body/i.test(node.textContent || ""));
        if (!errorVisible && currentInput && currentInput.value.trim() === "") {
          window.clearInterval(watcher);
          show("✓ Template Saved");
          return;
        }
        if (attempts >= 40 || (currentInput && currentInput.value.trim() !== originalName && currentInput.value.trim() !== "")) {
          window.clearInterval(watcher);
        }
      }, 100);
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      window.fetch = originalFetch;
      document.removeEventListener("click", handleClick, true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed left-1/2 top-7 z-[9999] -translate-x-1/2 rounded-2xl border border-[#78916f] bg-[#52684b] px-7 py-4 text-sm font-bold text-white shadow-2xl">
      {toast}
    </div>
  );
}
