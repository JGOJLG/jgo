import type { ReactNode } from "react";

type FileCategorySectionProps = {
  clientId: number;
  category: string;
  title: string;
  description: string;
  fileCount: number;
  defaultOpen?: boolean;
  tone?: "sage" | "blue" | "lavender" | "cream";
  children: ReactNode;
};

export default function FileCategorySection({
  title,
  description,
  fileCount,
  defaultOpen = false,
  tone = "sage",
  children,
}: FileCategorySectionProps) {
  const toneClasses =
    tone === "blue"
      ? {
          icon: "bg-[#e7f1f9] text-[#5c7893]",
          count: "bg-[#edf5fb] text-[#5c7893]",
          hover: "hover:bg-[#f8fbfe]",
        }
      : tone === "lavender"
        ? {
            icon: "bg-[#eee9f5] text-[#75638f]",
            count: "bg-[#f3eef8] text-[#75638f]",
            hover: "hover:bg-[#fbf9fd]",
          }
        : tone === "cream"
          ? {
              icon: "bg-[#f7eedf] text-[#8a6f47]",
              count: "bg-[#faf3e8] text-[#8a6f47]",
              hover: "hover:bg-[#fdfaf5]",
            }
          : {
              icon: "bg-[#e7efe2] text-[#5f7756]",
              count: "bg-[#edf3e9] text-[#5f7756]",
              hover: "hover:bg-[#f9fbf7]",
            };

  return (
    <details
      open={defaultOpen}
      className="group bg-white"
    >
      <summary
        className={`flex cursor-pointer list-none items-center gap-4 px-5 py-4 transition sm:px-6 ${toneClasses.hover}`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-semibold ${toneClasses.icon}`}
        >
          ▤
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-[#33412f]">
              {title}
            </h4>

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses.count}`}
            >
              {fileCount} {fileCount === 1 ? "document" : "documents"}
            </span>
          </div>

          <p className="mt-1 text-sm text-[#7d897b]">
            {description}
          </p>
        </div>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#dfe6db] bg-white text-lg text-[#647d5b] transition-transform duration-200 group-open:rotate-180">
         ⌄
        </span>
      </summary>

      <div className="border-t border-[#edf0ea] bg-[#fbfcf9] px-5 py-5 sm:px-6">
        {children}
      </div>
    </details>
  );
}
