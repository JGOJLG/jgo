import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Client = {
  id: number;
  name: string | null;
};

type ClientFile = {
  id: number;
  client_id: number | null;
  file_name: string | null;
  file_path: string | null;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string | null;
  category: string | null;
};

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return "Unknown size";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getFileLabel(fileType: string | null, fileName: string | null) {
  const type = fileType?.toLowerCase() ?? "";
  const name = fileName?.toLowerCase() ?? "";

  if (type.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (
    type.includes("word") ||
    type.includes("officedocument") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ) {
    return "DOC";
  }
  if (type.includes("image")) return "IMG";
  if (type.includes("text") || name.endsWith(".txt")) return "TXT";

  return "FILE";
}

export default async function DocsPage() {
  const supabase = await createClient();

  const [filesResult, clientsResult] = await Promise.all([
    supabase
      .from("client_files")
      .select(
        "id, client_id, file_name, file_path, file_type, file_size, uploaded_at, category"
      )
      .order("uploaded_at", { ascending: false }),
    supabase.from("clients").select("id, name"),
  ]);

  const files = (filesResult.data ?? []) as ClientFile[];
  const clients = (clientsResult.data ?? []) as Client[];

  const clientNameById = new Map(
    clients.map((client) => [client.id, client.name || "Unnamed Client"])
  );

  const clientFileCount = files.filter((file) => file.client_id).length;
  const businessFileCount = files.filter((file) => !file.client_id).length;
  const recentFiles = files.slice(0, 4);

  return (
    <section className="min-w-0 flex-1 bg-[#f6f5ef]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#7f9975]">
              Document Hub
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#243128]">
              JGO Docs
            </h1>
            <p className="mt-2 text-sm text-[#708075]">
              Everything in one place.
            </p>
          </div>

          <Link
            href="/docs/upload"
            className="w-fit rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4d6247]"
          >
            + Upload Files
          </Link>
        </div>
      </header>

      <div className="space-y-7 p-6 lg:p-10">
        {filesResult.error || clientsResult.error ? (
          <section className="rounded-2xl border border-red-300 bg-red-50 p-5">
            <h2 className="font-bold text-red-700">JGO Docs Error</h2>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-red-700">
              {JSON.stringify(
                {
                  files: filesResult.error,
                  clients: clientsResult.error,
                },
                null,
                2
              )}
            </pre>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "All Documents",
              value: files.length,
              detail: "Everything in JGO Docs",
            },
            {
              label: "Business Files",
              value: businessFileCount,
              detail: "Your JGO Hire documents",
            },
            {
              label: "Client Files",
              value: clientFileCount,
              detail: "Connected to clients",
            },
            {
              label: "Lead Files",
              value: 0,
              detail: "Coming in the next phase",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-[#708075]">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-[#243128]">
                {item.value}
              </p>
              <p className="mt-3 text-xs font-semibold text-[#7f9975]">
                {item.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-dashed border-[#cbd8c4] bg-white p-8 text-center shadow-sm lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f9975]">
            Upload
          </p>
          <h2 className="mt-3 text-2xl font-bold text-[#243128]">
            Drag and drop files here
          </h2>
          <p className="mt-2 text-sm text-[#708075]">
            PDF, DOCX, DOC, JPG, PNG, and TXT
          </p>

          <Link
            href="/docs/upload"
            className="mt-6 inline-block rounded-xl border border-[#cbd8c4] bg-[#fbfcf9] px-5 py-3 text-sm font-semibold text-[#4d6247] transition hover:bg-white"
          >
            Browse Files
          </Link>
        </section>

        {recentFiles.length > 0 ? (
          <section>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f9975]">
                Quick Access
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#243128]">
                Recent Files
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {recentFiles.map((file) => (
                <Link
                  key={file.id}
                  href={
                    file.client_id ? `/clients/${file.client_id}` : "/docs"
                  }
                  className="group rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#cbd8c4]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-xl bg-[#eef2e9] px-3 py-2 text-xs font-bold text-[#5c7454]">
                      {getFileLabel(file.file_type, file.file_name)}
                    </span>
                    <span className="text-xs text-[#8a968d]">
                      {formatFileSize(file.file_size)}
                    </span>
                  </div>

                  <h3 className="mt-5 line-clamp-2 text-sm font-bold text-[#243128] group-hover:text-[#647d5b]">
                    {file.file_name || "Untitled file"}
                  </h3>

                  <p className="mt-2 text-xs font-semibold text-[#7f9975]">
                    {file.client_id
                      ? clientNameById.get(file.client_id) || "Client"
                      : "Business File"}
                  </p>

                  <p className="mt-1 text-xs text-[#8a968d]">
                    {formatDate(file.uploaded_at)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-[#dfe6db] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#243128]">
                All Documents
              </h2>
              <p className="mt-1 text-sm text-[#708075]">
                Client files already uploaded elsewhere in JGO OS appear here
                automatically.
              </p>
            </div>
            <span className="w-fit rounded-full bg-[#eef2e9] px-3 py-1.5 text-xs font-semibold text-[#5c7454]">
              {files.length} {files.length === 1 ? "file" : "files"}
            </span>
          </div>

          {files.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#cfd9c9] bg-[#fbfcf9] p-10 text-center">
              <p className="text-sm font-semibold text-[#3d4d39]">
                No files uploaded yet
              </p>
              <p className="mt-2 text-sm text-[#708075]">
                Files added through client profiles will automatically appear
                here.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {files.map((file) => (
                <Link
                  key={file.id}
                  href={
                    file.client_id ? `/clients/${file.client_id}` : "/docs"
                  }
                  className="group rounded-2xl border border-[#e4e9df] bg-[#fbfcf9] p-5 transition hover:border-[#cbd8c4] hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#5c7454] shadow-sm">
                      {getFileLabel(file.file_type, file.file_name)}
                    </span>
                    <span className="text-xs text-[#8a968d]">
                      {formatFileSize(file.file_size)}
                    </span>
                  </div>

                  <h3 className="mt-5 line-clamp-2 text-sm font-bold text-[#243128] group-hover:text-[#647d5b]">
                    {file.file_name || "Untitled file"}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#eef2e9] px-2.5 py-1 text-[11px] font-semibold text-[#5c7454]">
                      {file.category || "Uncategorized"}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#708075]">
                      {file.client_id
                        ? clientNameById.get(file.client_id) || "Client"
                        : "Business"}
                    </span>
                  </div>

                  <p className="mt-4 text-xs text-[#8a968d]">
                    Uploaded {formatDate(file.uploaded_at)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
