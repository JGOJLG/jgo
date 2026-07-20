"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Props = {
  clientId: number;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const FILE_CATEGORIES = [
  "Resume",
  "Cover Letter",
  "Invoice",
  "Notes",
  "Interview",
  "Other",
] as const;

type FileCategory = (typeof FILE_CATEGORIES)[number];

export default function ClientFileUploader({ clientId }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategory, setSelectedCategory] =
    useState<FileCategory>("Other");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);

    if (files.length > 0) {
      await uploadFiles(files);
    }
  }

  async function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 0) {
      await uploadFiles(files);
    }

    event.target.value = "";
  }

  async function uploadFiles(files: File[]) {
    setErrorMessage("");
    setMessage("");

    const oversizedFile = files.find(
      (file) => file.size > MAX_FILE_SIZE
    );

    if (oversizedFile) {
      setErrorMessage(
        `${oversizedFile.name} is larger than 25 MB.`
      );
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      for (const file of files) {
        const cleanFileName = file.name
          .replace(/[^a-zA-Z0-9.\-_]/g, "-")
          .replace(/-+/g, "-");

        const uniqueFileName = `${Date.now()}-${crypto.randomUUID()}-${cleanFileName}`;
        const filePath = `clients/${clientId}/${uniqueFileName}`;

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

        const { error: databaseError } = await supabase
          .from("client_files")
          .insert({
            client_id: clientId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type || null,
            file_size: file.size,
            category: selectedCategory,
          });

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
        files.length === 1
          ? `File uploaded to ${selectedCategory}.`
          : `${files.length} files uploaded to ${selectedCategory}.`
      );

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
    <div>
      <div className="mb-4">
        <label
          htmlFor="file-category"
          className="mb-2 block text-sm font-semibold text-[#3d4d39]"
        >
          File category
        </label>

        <select
          id="file-category"
          value={selectedCategory}
          onChange={(event) =>
            setSelectedCategory(event.target.value as FileCategory)
          }
          disabled={isUploading}
          className="w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm font-semibold text-[#445240] outline-none transition focus:border-[#7f9975] focus:ring-2 focus:ring-[#dfe8da] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {FILE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <p className="mt-2 text-xs leading-5 text-[#849080]">
          Every file in this upload will be saved under this category.
        </p>
      </div>

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
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
          isDragging
            ? "border-[#647d5b] bg-[#eef2e9]"
            : "border-[#cfd9c9] bg-[#fbfcf9] hover:border-[#7f9975] hover:bg-[#f7f9f4]"
        } ${isUploading ? "cursor-wait opacity-70" : ""}`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e7eee2] text-2xl text-[#647d5b]">
          ↑
        </div>

        <p className="mt-4 text-sm font-semibold text-[#3d4d39]">
          {isUploading
            ? "Uploading your files..."
            : `Upload to ${selectedCategory}`}
        </p>

        <p className="mt-2 text-xs leading-5 text-[#708075]">
          Drag and drop files here, or click this box to choose files.
        </p>

        <p className="mt-2 text-xs text-[#9aa59c]">
          Maximum file size: 25 MB per file
        </p>
      </div>

      {message ? (
        <div className="mt-3 rounded-xl bg-[#e7f1e6] px-4 py-3 text-sm font-semibold text-[#55704f]">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-3 rounded-xl bg-[#fbefed] px-4 py-3 text-sm font-semibold text-[#9a554d]">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
