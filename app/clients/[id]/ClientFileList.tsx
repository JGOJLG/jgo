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
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#3d4d39]">
            Document Library
          </p>

          <p className="mt-1 text-xs text-[#849080]">
            Organized by stage and document type
          </p>
        </div>

        <p className="rounded-full bg-[#edf2e9] px-3 py-1.5 text-xs font-semibold text-[#647d5b]">
          {files.length} {files.length === 1 ? "document" : "documents"}
        </p>
      </div>

      <div className="space-y-8">
        {DOCUMENT_GROUPS.map((group) => (
          <section key={group.title}>
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#2f3d2c]">
                {group.title}
              </h3>

              <p className="mt-1 text-sm text-[#7d897b]">
                {group.description}
              </p>
            </div>

            <div className="space-y-4">
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
                  >
                    {categoryFiles.length > 0 ? (
                      categoryFiles.map((file) => (
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
                      ))
                    ) : (
                      <p className="text-sm text-[#8a968d]">
                        No document uploaded yet.
                      </p>
                    )}
                  </FileCategorySection>
                );
              })}
            </div>
          </section>
        ))}

        {legacyFiles.length > 0 ? (
          <section>
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#2f3d2c]">
                Previous Uploads
              </h3>

              <p className="mt-1 text-sm text-[#7d897b]">
                Files uploaded before the new document categories were added.
              </p>
            </div>

            <FileCategorySection
              clientId={clientId}
              category="Previous Uploads"
              title="Previous Uploads"
              description="Existing files are preserved here so nothing is lost"
              fileCount={legacyFiles.length}
            >
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
            </FileCategorySection>
          </section>
        ) : null}
      </div>
    </div>
  );
}