import { createClient } from "@/lib/supabase-server";
import FileCategorySection from "./FileCategorySection";
import FileRow from "./FileRow";

type ClientFileListProps = {
  clientId: number;
};

const FILE_CATEGORIES = [
  "Resume",
  "Cover Letter",
  "Invoice",
  "Notes",
  "Interview",
  "Other",
] as const;

type FileCategory = (typeof FILE_CATEGORIES)[number];

type ClientFile = {
  id: number;
  client_id: number;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: FileCategory | null;
};

const CATEGORY_DETAILS: Record<
  FileCategory,
  {
    title: string;
    description: string;
  }
> = {
  Resume: {
    title: "Resumes",
    description: "Current and previous resume versions",
  },
  "Cover Letter": {
    title: "Cover Letters",
    description: "General and role-specific cover letters",
  },
  Invoice: {
    title: "Invoices",
    description: "Invoices, receipts, and payment documents",
  },
  Notes: {
    title: "Notes",
    description: "Client notes, coaching notes, and planning documents",
  },
  Interview: {
    title: "Interview",
    description: "Interview preparation and interview-related documents",
  },
  Other: {
    title: "Other Files",
    description: "Additional client documents",
  },
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
          We could not load this client&apos;s files.
        </p>

        <p className="mt-1 text-sm leading-6 text-[#a76a63]">
          Refresh the page and try again.
        </p>
      </div>
    );
  }

  const files = (data ?? []) as ClientFile[];

  if (files.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d5ded0] bg-[#fbfcfa] px-5 py-10 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#edf2e9] text-lg font-semibold text-[#6a8062]">
          ▤
        </div>

        <h3 className="mt-4 text-sm font-semibold text-[#3d4d39]">
          No files uploaded yet
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7d897b]">
          Upload a resume, cover letter, report, invoice, or another client
          document. It will appear here automatically.
        </p>
      </div>
    );
  }

  const groupedFiles = FILE_CATEGORIES.map((category) => {
    const categoryFiles = files.filter(
      (file) => (file.category ?? "Other") === category
    );

    return {
      category,
      files: categoryFiles,
    };
  }).filter((group) => group.files.length > 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#3d4d39]">
            Uploaded Files
          </p>

          <p className="mt-1 text-xs text-[#849080]">
            Organized by document category
          </p>
        </div>

        <p className="rounded-full bg-[#edf2e9] px-3 py-1.5 text-xs font-semibold text-[#647d5b]">
          {files.length} {files.length === 1 ? "file" : "files"}
        </p>
      </div>

      <div className="space-y-5">
        {groupedFiles.map(({ category, files: categoryFiles }) => {
          const details = CATEGORY_DETAILS[category];

          return (
            <FileCategorySection
              key={category}
              clientId={clientId}
              category={category}
              title={details.title}
              description={details.description}
              fileCount={categoryFiles.length}
            >
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
            </FileCategorySection>
          );
        })}
      </div>
    </div>
  );
}
