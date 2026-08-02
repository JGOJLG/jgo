"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type ClientOption = {
  id: number;
  name: string;
};

type LeadOption = {
  id: number;
  name: string;
};

type Props = {
  clients: ClientOption[];
  leads: LeadOption[];
};

type OwnerType = "business" | "client" | "lead" | "unassigned";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const BUSINESS_CATEGORIES = [
  "Career Resources",
  "Templates",
  "Marketing",
  "Brand Assets",
  "Finance",
  "Legal",
  "Internal",
  "Other",
] as const;

const CLIENT_CATEGORIES = [
  "Old Resume",
  "Old Cover Letter",
  "Job Descriptions",
  "Finished Resume",
  "Finished Cover Letter",
  "Resume Ready Report™",
  "Cover Letter Guide™",
  "Other",
] as const;

const LEAD_CATEGORIES = [
  "Resume",
  "Cover Letter",
  "Job Description",
  "Notes",
  "Other",
] as const;

function cleanFileName(fileName: string) {
  return fileName
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

export default function JgoDocsUploader({ clients, leads }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ownerType, setOwnerType] = useState<OwnerType>("business");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("Career Resources");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const availableCategories = useMemo(() => {
    if (ownerType === "client") return CLIENT_CATEGORIES;
    if (ownerType === "lead") return LEAD_CATEGORIES;
    if (ownerType === "business") return BUSINESS_CATEGORIES;
    return ["Unassigned"] as const;
  }, [ownerType]);

  function resetMessages() {
    setMessage("");
    setErrorMessage("");
  }

  function updateOwnerType(value: OwnerType) {
    setOwnerType(value);
    setSelectedClientId("");
    setSelectedLeadId("");

    if (value === "client") {
      setSelectedCategory("Old Resume");
    } else if (value === "lead") {
      setSelectedCategory("Resume");
    } else if (value === "unassigned") {
      setSelectedCategory("Unassigned");
    } else {
      setSelectedCategory("Career Resources");
    }

    resetMessages();
  }

  function openFilePicker() {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function validateAndSetFiles(files: File[]) {
    resetMessages();

    const oversizedFile = files.find(
      (file) => file.size > MAX_FILE_SIZE
    );

    if (oversizedFile) {
      setErrorMessage(
        `${oversizedFile.name} is larger than 25 MB.`
      );
      return;
    }

    setSelectedFiles(files);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);

    if (files.length > 0) {
      validateAndSetFiles(files);
    }
  }

  function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 0) {
      validateAndSetFiles(files);
    }

    event.target.value = "";
  }

  function removeFile(indexToRemove: number) {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove)
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    if (selectedFiles.length === 0) {
      setErrorMessage("Choose at least one file before uploading.");
      return;
    }

    if (ownerType === "client" && !selectedClientId) {
      setErrorMessage("Choose the client these files belong to.");
      return;
    }

    if (ownerType === "lead" && !selectedLeadId) {
      setErrorMessage("Choose the lead these files belong to.");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      for (const file of selectedFiles) {
        const safeName = cleanFileName(file.name);
        const uniqueFileName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

        const ownerFolder =
          ownerType === "client"
            ? `clients/${selectedClientId}`
            : ownerType === "lead"
              ? `leads/${selectedLeadId}`
              : ownerType === "business"
                ? "business"
                : "unassigned";

        const filePath = `${ownerFolder}/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("client-files")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadError) {
          throw new Error(
            `Could not upload ${file.name}: ${uploadError.message}`
          );
        }

        const insertPayload = {
          client_id:
            ownerType === "client" ? Number(selectedClientId) : null,
          lead_id:
            ownerType === "lead" ? Number(selectedLeadId) : null,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type || null,
          file_size: file.size,
          category:
            ownerType === "business" || ownerType === "unassigned"
              ? null
              : selectedCategory,
          business_category:
            ownerType === "business" ? selectedCategory : null,
          owner_type: ownerType,
          favorite: false,
          archived: false,
        };

        const { error: databaseError } = await supabase
          .from("client_files")
          .insert(insertPayload);

        if (databaseError) {
          await supabase.storage
            .from("client-files")
            .remove([filePath]);

          throw new Error(
            `Could not save ${file.name}: ${databaseError.message}`
          );
        }
      }

      setMessage(
        selectedFiles.length === 1
          ? "Your file was uploaded to JGO Docs."
          : `${selectedFiles.length} files were uploaded to JGO Docs.`
      );
      setSelectedFiles([]);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-[#dfe6db] bg-white p-6 shadow-sm lg:p-7"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f9975]">
          Upload Details
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#243128]">
          Add files to JGO Docs
        </h2>
        <p className="mt-2 text-sm text-[#708075]">
          Choose where the files belong, then drag and drop or browse.
        </p>
      </div>

      <div>
        <label className="mb-3 block text-sm font-semibold text-[#3d4d39]">
          Where should these files live?
        </label>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              value: "business",
              label: "Business",
              detail: "Your JGO Hire files",
            },
            {
              value: "client",
              label: "Client",
              detail: "Attach to a client",
            },
            {
              value: "lead",
              label: "Lead",
              detail: "Attach to a lead",
            },
            {
              value: "unassigned",
              label: "Unassigned",
              detail: "Organize later",
            },
          ].map((option) => {
            const isSelected = ownerType === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  updateOwnerType(option.value as OwnerType)
                }
                disabled={isUploading}
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-[#7f9975] bg-[#eef2e9]"
                    : "border-[#e2e8de] bg-[#fbfcf9] hover:border-[#cbd8c4] hover:bg-white"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <p className="text-sm font-bold text-[#243128]">
                  {option.label}
                </p>
                <p className="mt-1 text-xs text-[#708075]">
                  {option.detail}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {ownerType === "client" ? (
        <div>
          <label
            htmlFor="client"
            className="mb-2 block text-sm font-semibold text-[#3d4d39]"
          >
            Client
          </label>
          <select
            id="client"
            value={selectedClientId}
            onChange={(event) =>
              setSelectedClientId(event.target.value)
            }
            disabled={isUploading}
            className="w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm font-semibold text-[#445240] outline-none transition focus:border-[#7f9975] focus:ring-2 focus:ring-[#dfe8da] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {ownerType === "lead" ? (
        <div>
          <label
            htmlFor="lead"
            className="mb-2 block text-sm font-semibold text-[#3d4d39]"
          >
            Lead
          </label>
          <select
            id="lead"
            value={selectedLeadId}
            onChange={(event) =>
              setSelectedLeadId(event.target.value)
            }
            disabled={isUploading}
            className="w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm font-semibold text-[#445240] outline-none transition focus:border-[#7f9975] focus:ring-2 focus:ring-[#dfe8da] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Choose a lead</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {ownerType !== "unassigned" ? (
        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-semibold text-[#3d4d39]"
          >
            Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(event.target.value)
            }
            disabled={isUploading}
            className="w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm font-semibold text-[#445240] outline-none transition focus:border-[#7f9975] focus:ring-2 focus:ring-[#dfe8da] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelection}
        disabled={isUploading}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
          isDragging
            ? "border-[#647d5b] bg-[#eef2e9]"
            : "border-[#cfd9c9] bg-[#fbfcf9] hover:border-[#7f9975] hover:bg-white"
        } ${isUploading ? "cursor-wait opacity-70" : ""}`}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7eee2] text-2xl font-bold text-[#647d5b]">
          ↑
        </div>

        <p className="mt-4 text-base font-bold text-[#243128]">
          {isUploading
            ? "Uploading your files..."
            : "Drag and drop files here"}
        </p>

        <p className="mt-2 text-sm text-[#708075]">
          Or click this area to browse your computer.
        </p>

        <p className="mt-2 text-xs text-[#9aa59c]">
          Maximum file size: 25 MB per file
        </p>
      </div>

      {selectedFiles.length > 0 ? (
        <div className="rounded-2xl border border-[#e2e8de] bg-[#fbfcf9] p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-[#243128]">
              Selected Files
            </p>
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              disabled={isUploading}
              className="text-xs font-semibold text-[#7f9975] hover:text-[#4d6247] disabled:opacity-60"
            >
              Clear all
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#3d4d39]">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-[#8a968d]">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                  className="shrink-0 text-xs font-semibold text-[#9a554d] hover:text-[#7f4039] disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl bg-[#e7f1e6] px-4 py-3 text-sm font-semibold text-[#55704f]">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl bg-[#fbefed] px-4 py-3 text-sm font-semibold text-[#9a554d]">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-[#edf0ea] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push("/docs")}
          disabled={isUploading}
          className="rounded-xl border border-[#d7e1d0] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] transition hover:bg-[#f8faf6] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isUploading || selectedFiles.length === 0}
          className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4d6247] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading
            ? "Uploading..."
            : `Upload ${
                selectedFiles.length > 0
                  ? selectedFiles.length
                  : ""
              } ${selectedFiles.length === 1 ? "File" : "Files"}`}
        </button>
      </div>
    </form>
  );
}
