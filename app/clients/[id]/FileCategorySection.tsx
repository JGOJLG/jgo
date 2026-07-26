"use client";

import { ReactNode } from "react";

type FileCategorySectionProps = {
  clientId: number;
  category: string;
  title: string;
  description: string;
  fileCount: number;
  children: ReactNode;
};

function CategoryIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3.75h8.25L18 7.5v12.75H6z" />
      <path d="M14.25 3.75V7.5H18" />
      <path d="M8.75 11h6.5" />
      <path d="M8.75 14h6.5" />
      <path d="M8.75 17h4.25" />
    </svg>
  );
}

export default function FileCategorySection({
  title,
  description,
  fileCount,
  children,
}: FileCategorySectionProps) {
  return (
    <div className="rounded-2xl border border-[#e1e8dd] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8efe4] text-[#5e7557]">
            <CategoryIcon />
          </div>

          <div>
            <h4 className="text-base font-semibold text-[#344331]">
              {title}
            </h4>

            <p className="mt-1 text-sm leading-5 text-[#849080]">
              {description}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#eef3ea] px-3 py-1 text-xs font-semibold text-[#647d5b]">
          {fileCount} {fileCount === 1 ? "document" : "documents"}
        </span>
      </div>

      <div className="mt-5 border-t border-[#edf1e9] pt-5">
        {children}
      </div>
    </div>
  );
}