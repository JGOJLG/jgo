import ClientFileList from "./ClientFileList";
import ClientFileUploader from "./ClientFileUploader";

type ClientFileManagerProps = {
  clientId: number;
};

export default function ClientFileManager({
  clientId,
}: ClientFileManagerProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#dfe7da] bg-white shadow-sm">
      <div className="border-b border-[#e7ece3] px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b9272]">
              Documents
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#2f3d2c]">
              Client Files
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#71806f]">
              Upload and manage resumes, cover letters, reports, invoices,
              notes, and other client documents.
            </p>
          </div>

          <div className="inline-flex w-fit items-center rounded-full bg-[#eef3ea] px-3 py-1.5 text-xs font-semibold text-[#617458]">
            Secure storage
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
        <ClientFileUploader clientId={clientId} />

        <ClientFileList clientId={clientId} />
      </div>
    </section>
  );
}
