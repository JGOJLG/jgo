import { createClient } from "@/lib/supabase-server";
import FileCategorySection from "./FileCategorySection";
import FileRow from "./FileRow";

type ClientFileListProps = {
  clientId: number;
};

const DOCUMENT_GROUPS = [
  {
    title: "Original Documents",
    description: "The materials the client started with",
    tone: "sage" as const,
    categories: [
      {
        value: "Old Resume",
        title: "Old Resume",
        description: "The client’s original or previous resume",
      },
      {
        value: "Old Cover Letter",
        title: "Old Cover Letter",
        description: "The client’s original or previous cover letter",
      },
      {
        value: "Job Descriptions",
        title: "Job Descriptions",
        description: "Target roles used to tailor client materials",
      },
    ],
  },
  {
    title: "Final Deliverables",
    description: "Completed documents prepared for the client",
    tone: "blue" as const,
    categories: [
      {
        value: "Finished Resume",
        title: "Finished Resume",
        description: "The final resume delivered to the client",
      },
      {
        value: "Finished Cover Letter",
        title: "Finished Cover Letter",
        description: "The final cover letter delivered to the client",
      },
    ],
  },
  {
    title: "JGO Resources",
    description: "Branded resources included with the client’s service",
    tone: "lavender" as const,
    categories: [
      {
        value: "Resume Ready Report™",
        title: "Resume Ready Report™",
        description: "The client’s personalized resume review report",
      },
      {
        value: "Cover Letter Guide™",
        title: "Cover Letter Guide™",
        description: "The JGO guide for future cover letter updates",
      },
    ],
  },
] as const;

const NEW_CATEGORIES = DOCUMENT_GROUPS.flatMap((group) =>
  group.categories.map((category) => category.value)
);

type ClientFile = {
  id: number;
  client_id: number;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
};

export default async function ClientFileList({
  clientId,
}: ClientFileListProps) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("client_files")
    .select(
      "id, client_id, file_name, file_path, file_type, file_size, category"
    )
    .eq("client_id", clientId)
    .order("id", { ascending: false });

  if (error) {
    console.error("Unable to load client files:", error);

    return (
      <div className="rounded-2xl border border-[#ead4d0] bg-[#fbefed] px-5 py-4">
        <p className="text-sm font-semibold text-[#9a554d]">
          We could not load this client&apos;s documents.
        </p>

        <p className="mt-1 text-sm leading-6 text-[#a76a63]">
          Refresh the page and try again.
        </p>
      </div>
    );
  }

  const files = (data ?? []) as ClientFile[];

  const legacyFiles = files.filter(
    (file) =>
      !file.category ||
      !NEW_CATEGORIES.includes(
        file.category as (typeof NEW_CATEGORIES)[number]
      )
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#e2e9de] bg-[#f8faf6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#3d4d39]">
            Document Library
          </p>

          <p className="mt-1 text-xs text-[#849080]">
            Open only the section you need.
          </p>
        </div>

        <p className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#647d5b] shadow-sm">
          {files.length} {files.length === 1 ? "document" : "documents"}
        </p>
      </div>

      <div className="space-y-6">
        {DOCUMENT_GROUPS.map((group) => {
          const groupFileCount = group.categories.reduce(
            (total, category) =>
              total +
              files.filter((file) => file.category === category.value).length,
            0
          );

          return (
            <section
              key={group.title}
              className="overflow-hidden rounded-[24px] border border-[#dfe6db] bg-white shadow-sm"
            >
              <div
                className={`border-b px-5 py-4 sm:px-6 ${
                  group.tone === "sage"
                    ? "border-[#dce6d7] bg-[#eef4ea]"
                    : group.tone === "blue"
                      ? "border-[#dbe7f2] bg-[#eef6fc]"
                      : "border-[#e4ddef] bg-[#f4f0f9]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-[#2f3d2c]">
                      {group.title}
                    </h3>

                    <p className="mt-1 text-sm text-[#71806f]">
                      {group.description}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#647d5b]">
                    {groupFileCount}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-[#e8ece5]">
                {group.categories.map((category) => {
                  const categoryFiles = files.filter(
                    (file) => file.category === category.value
                  );

                  return (
                    <FileCategorySection
                      key={category.value}
                      clientId={clientId}
                      category={category.value}
                      title={category.title}
                      description={category.description}
                      fileCount={categoryFiles.length}
                      defaultOpen={categoryFiles.length > 0}
                      tone={group.tone}
                    >
                      {categoryFiles.length > 0 ? (
                        <div className="space-y-3">
                          {categoryFiles.map((file) => (
                            <FileRow
                              key={file.id}
                              file={{
                                id: file.id,
                                file_name: file.file_name,
                                file_path: file.file_path,
                                file_type: file.file_type,
                                file_size: file.file_size,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-[#d5ddd1] bg-white/70 p-4 text-sm text-[#8a968d]">
                          No document uploaded yet.
                        </div>
                      )}
                    </FileCategorySection>
                  );
                })}
              </div>
            </section>
          );
        })}

        {legacyFiles.length > 0 ? (
          <section className="overflow-hidden rounded-[24px] border border-[#e4dfd6] bg-white shadow-sm">
            <div className="border-b border-[#e7e1d8] bg-[#faf5ec] px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#2f3d2c]">
                    Previous Uploads
                  </h3>

                  <p className="mt-1 text-sm text-[#7d897b]">
                    Files uploaded before the new document categories were added.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#8a6f47]">
                  {legacyFiles.length}
                </span>
              </div>
            </div>

            <FileCategorySection
              clientId={clientId}
              category="Previous Uploads"
              title="Previous Uploads"
              description="Existing files are preserved here so nothing is lost"
              fileCount={legacyFiles.length}
              defaultOpen
              tone="cream"
            >
              <div className="space-y-3">
                {legacyFiles.map((file) => (
                  <FileRow
                    key={file.id}
                    file={{
                      id: file.id,
                      file_name: file.file_name,
                      file_path: file.file_path,
                      file_type: file.file_type,
                      file_size: file.file_size,
                    }}
                  />
                ))}
              </div>
            </FileCategorySection>
          </section>
        ) : null}
      </div>
    </div>
  );
}
