"use client";

import { ReactNode, useEffect, useState } from "react";

type FileCategory =
  | "Resume"
  | "Cover Letter"
  | "Invoice"
  | "Notes"
  | "Interview"
  | "Other";

type FileCategorySectionProps = {
  clientId: number;
  category: FileCategory;
  title: string;
  description: string;
  fileCount: number;
  children: ReactNode;
};

function CategoryIcon({ category }: { category: FileCategory }) {
  const sharedProps = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (category === "Resume") {
    return (
      <svg {...sharedProps}>
        <path d="M6 3.75h8.25L18 7.5v12.75H6z" />
        <path d="M14.25 3.75V7.5H18" />
        <path d="M8.75 11h6.5" />
        <path d="M8.75 14h6.5" />
        <path d="M8.75 17h4.25" />
      </svg>
    );
  }

  if (category === "Cover Letter") {
    return (
      <svg {...sharedProps}>
        <rect x="3.75" y="5.25" width="16.5" height="13.5" rx="2" />
        <path d="m4.5 7 7.5 5 7.5-5" />
      </svg>
    );
  }

  if (category === "Invoice") {
    return (
      <svg {...sharedProps}>
        <path d="M6 3.75h12v16.5l-2-1.25-2 1.25-2-1.25-2 1.25-2-1.25-2 1.25z" />
        <path d="M9 8.25h6" />
        <path d="M9 11.5h6" />
        <path d="M9 14.75h3.5" />
      </svg>
    );
  }

  if (category === "Notes") {
    return (
      <svg {...sharedProps}>
        <path d="M5.25 4.5h13.5v15H5.25z" />
        <path d="M8.5 8.25h7" />
        <path d="M8.5 11.75h7" />
        <path d="M8.5 15.25h4.5" />
      </svg>
    );
  }

  if (category === "Interview") {
    return (
      <svg {...sharedProps}>
        <path d="M7.5 17.25 4.5 19.5v-4.25A6.25 6.25 0 0 1 3.75 12c0-3.73 3.7-6.75 8.25-6.75S20.25 8.27 20.25 12 16.55 18.75 12 18.75a9.9 9.9 0 0 1-4.5-1.5Z" />
        <path d="M8.25 12h.01" />
        <path d="M12 12h.01" />
        <path d="M15.75 12h.01" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <path d="m9.5 12.5 5.65-5.65a3 3 0 1 1 4.25 4.25l-7.78 7.78a5 5 0 0 1-7.07-7.07l7.42-7.42a3.5 3.5 0 0 1 4.95 4.95l-7.43 7.42a2 2 0 0 1-2.82-2.82l6.72-6.72" />
    </svg>
  );
}

export default function FileCategorySection({
  clientId,
  category,
  title,
  description,
  fileCount,
  children,
}: FileCategorySectionProps) {
  const storageKey = `jgo-client-${clientId}-files-${category}`;
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const savedState = window.localStorage.getItem(storageKey);

    if (savedState === "closed") {
      setIsOpen(false);
    }

    if (savedState === "open") {
      setIsOpen(true);
    }
  }, [storageKey]);

  function toggleSection() {
    const nextState = !isOpen;

    setIsOpen(nextState);
    window.localStorage.setItem(
      storageKey,
      nextState ? "open" : "closed"
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e1e8dd] bg-white">
      <button
        type="button"
        onClick={toggleSection}
        aria-expanded={isOpen}
        className="flex w-full flex-col gap-3 border-b border-[#e7ece3] bg-[#fafbf8] px-5 py-4 text-left transition hover:bg-[#f6f8f3] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8efe4] text-[#5e7557]">
            <CategoryIcon category={category} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#344331]">
              {title}
            </h3>

            <p className="mt-1 text-xs leading-5 text-[#849080]">
              {description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 pl-[52px] sm:pl-0">
          <span className="rounded-full border border-[#dbe4d6] bg-white px-3 py-1 text-xs font-semibold text-[#6f806a]">
            {fileCount} {fileCount === 1 ? "file" : "files"}
          </span>

          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`text-[#70806b] transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      {isOpen ? (
        <div className="divide-y divide-[#e7ece3]">
          {children}
        </div>
      ) : null}
    </section>
  );
}
