"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type FileRowProps = {
  file: {
    id: number;
    file_name: string;
    file_path: string;
    file_type: string | null;
    file_size: number | null;
  };
};

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(kilobytes >= 100 ? 0 : 1)} KB`;
  }

  const megabytes = kilobytes / 1024;

  return `${megabytes.toFixed(megabytes >= 100 ? 0 : 1)} MB`;
}

function getFileDetails(fileType: string | null, fileName: string) {
  const normalizedType = fileType?.toLowerCase() ?? "";
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (
    normalizedType.includes("spreadsheet") ||
    normalizedType.includes("excel") ||
    normalizedType.includes("sheet") ||
    ["xls", "xlsx", "csv"].includes(extension)
  ) {
    return {
      label: "Spreadsheet",
      icon: "▦",
      iconClassName: "bg-[#e8f2e6] text-[#55704f]",
    };
  }

  if (
    normalizedType.includes("pdf") ||
    extension === "pdf"
  ) {
    return {
      label: "PDF",
      icon: "▤",
      iconClassName: "bg-[#f7e9e6] text-[#9a554d]",
    };
  }

  if (
    normalizedType.includes("word") ||
    normalizedType.includes("document") ||
    ["doc", "docx"].includes(extension)
  ) {
    return {
      label: "Word document",
      icon: "▤",
      iconClassName: "bg-[#e7edf4] text-[#52697b]",
    };
  }

  if (
    normalizedType.includes("image") ||
    ["jpg", "jpeg", "png", "gif", "webp"].includes(extension)
  ) {
    return {
      label: "Image",
      icon: "▧",
      iconClassName: "bg-[#eee8f3] text-[#6d5878]",
    };
  }

  if (
    normalizedType.includes("text") ||
    extension === "txt"
  ) {
    return {
      label: "Text file",
      icon: "▤",
      iconClassName: "bg-[#f3efe5] text-[#806e4f]",
    };
  }

  return {
    label: extension ? `${extension.toUpperCase()} file` : "Document",
    icon: "▤",
    iconClassName: "bg-[#edf2e9] text-[#647d5b]",
  };
}

export default function FileRow({ file }: FileRowProps) {
  const router = useRouter();

  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileDetails = getFileDetails(file.file_type, file.file_name);

  async function handleDownload() {
    setErrorMessage("");
    setIsDownloading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from("client-files")
        .createSignedUrl(file.file_path, 60);

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.signedUrl) {
        throw new Error("A secure download link could not be created.");
      }

      const anchor = document.createElement("a");
      anchor.href = data.signedUrl;
      anchor.download = file.file_name;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Could not download file: ${error.message}`
          : "Could not download this file."
      );
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${file.file_name}" permanently? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setIsDeleting(true);

    try {
      const supabase = createClient();

      const { error: storageError } = await supabase.storage
        .from("client-files")
        .remove([file.file_path]);

      if (storageError) {
        throw new Error(
          `The stored file could not be removed: ${storageError.message}`
        );
      }

      const { error: databaseError } = await supabase
        .from("client_files")
        .delete()
        .eq("id", file.id);

      if (databaseError) {
        throw new Error(
          `The file record could not be removed: ${databaseError.message}`
        );
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Could not delete file: ${error.message}`
          : "Could not delete this file."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="group px-5 py-4 transition hover:bg-[#fafbf8]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-semibold ${fileDetails.iconClassName}`}
          >
            {fileDetails.icon}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#344331]">
              {file.file_name}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#849080]">
              <span>{fileDetails.label}</span>
              <span aria-hidden="true">•</span>
              <span>{formatFileSize(file.file_size)}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pl-[60px] sm:pl-0">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || isDeleting}
            className="rounded-lg border border-[#d7e1d0] bg-white px-3 py-2 text-xs font-semibold text-[#4d6247] transition hover:bg-[#f3f6f0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading ? "Preparing..." : "Download"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDownloading || isDeleting}
            className="rounded-lg border border-[#ead4d0] bg-white px-3 py-2 text-xs font-semibold text-[#a45f58] transition hover:bg-[#fbefed] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-3 rounded-xl bg-[#fbefed] px-4 py-3 text-sm font-semibold text-[#9a554d]">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
