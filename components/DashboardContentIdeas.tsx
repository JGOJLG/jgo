"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type DashboardContentIdea = {
  id: number;
  title: string;
  content_type: string;
  sort_order?: number | null;
};

type Props = {
  initialIdeas: DashboardContentIdea[];
};

const contentTypes = [
  "Social Video",
  "LinkedIn Post",
  "Substack Topic",
];

function getTypeStyle(type: string) {
  const normalized = type.toLowerCase();

  if (normalized.includes("substack")) {
    return "bg-[#f3eadf] text-[#8a6845]";
  }

  if (normalized.includes("linkedin")) {
    return "bg-[#e5eef6] text-[#55738d]";
  }

  return "bg-[#eee8f3] text-[#6d5878]";
}

export default function DashboardContentIdeas({
  initialIdeas,
}: Props) {
  const router = useRouter();
  const [ideas, setIdeas] =
    useState<DashboardContentIdea[]>(initialIdeas);
  const [title, setTitle] = useState("");
  const [contentType, setContentType] =
    useState("Social Video");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadOrderedIdeas() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("content_ideas")
      .select("id, title, content_type, sort_order")
      .eq("is_archived", false)
      .neq("status", "Posted")
      .order("sort_order", {
        ascending: true,
        nullsFirst: false,
      })
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error(
        "Unable to load ordered dashboard ideas:",
        error
      );
      return;
    }

    setIdeas((data ?? []) as DashboardContentIdea[]);
  }

  useEffect(() => {
    void loadOrderedIdeas();
  }, []);

  async function getNextSortOrder() {
    const supabase = createClient();

    const { data } = await supabase
      .from("content_ideas")
      .select("sort_order")
      .eq("is_archived", false)
      .neq("status", "Posted")
      .order("sort_order", {
        ascending: true,
        nullsFirst: false,
      })
      .limit(1);

    const currentFirst = data?.[0]?.sort_order;

    return typeof currentFirst === "number"
      ? currentFirst - 1
      : 0;
  }

  async function addIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("content_ideas")
      .insert({
        title: title.trim(),
        content_type: contentType,
        platform:
          contentType === "Substack Topic"
            ? "Substack"
            : contentType === "LinkedIn Post"
              ? "LinkedIn"
              : "Social Media",
        status: "Idea",
        is_archived: false,
        sort_order: await getNextSortOrder(),
        updated_at: new Date().toISOString(),
      })
      .select("id, title, content_type, sort_order")
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message || "Unable to add the content idea."
      );
      setSaving(false);
      return;
    }

    setTitle("");
    setSaving(false);
    await loadOrderedIdeas();
    router.refresh();
  }

  async function completeIdea(id: number) {
    const previous = ideas;
    setIdeas((current) =>
      current.filter((idea) => idea.id !== id)
    );
    setErrorMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("content_ideas")
      .update({
        status: "Posted",
        posted_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setIdeas(previous);
      setErrorMessage(error.message);
      return;
    }

    await loadOrderedIdeas();
    router.refresh();
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(145deg,rgba(242,247,239,0.96),rgba(255,255,255,0.78))] p-6 shadow-[0_18px_55px_rgba(71,91,66,0.11)] backdrop-blur-2xl lg:p-7">
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#dce9d5]/65 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f8966]">
              Content Ideas
            </p>

            <h3 className="mt-2 text-2xl font-bold text-[#243128]">
              What should I post next?
            </h3>

            <p className="mt-1 text-sm text-[#708075]">
              Your first five open ideas in saved order.
            </p>
          </div>

          <Link
            href="/content-ideas"
            aria-label="View all content ideas"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/85 bg-white/80 text-lg font-semibold text-[#647d5b] shadow-sm transition hover:translate-x-0.5 hover:bg-white"
          >
            →
          </Link>
        </div>

        <form
          onSubmit={addIdea}
          className="mt-5 grid gap-2 sm:grid-cols-[150px_1fr_auto]"
        >
          <select
            value={contentType}
            onChange={(event) =>
              setContentType(event.target.value)
            }
            className="rounded-xl border border-[#d7e1d0] bg-white/85 px-3 py-2.5 text-xs font-semibold text-[#4d6247] outline-none focus:border-[#9fb294]"
          >
            {contentTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Quickly add an idea..."
            className="min-w-0 rounded-xl border border-[#d7e1d0] bg-white/85 px-4 py-2.5 text-sm text-[#243128] outline-none placeholder:text-[#9aa59c] focus:border-[#9fb294] focus:ring-2 focus:ring-[#e8eee3]"
          />

          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#526b4b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Adding..." : "+ Add"}
          </button>
        </form>

        {errorMessage ? (
          <p className="mt-3 text-xs font-semibold text-[#9a554d]">
            {errorMessage}
          </p>
        ) : null}

        {ideas.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#cfd9c9] bg-white/55 p-5 text-center">
            <p className="text-sm font-semibold text-[#3d4d39]">
              No open content ideas
            </p>

            <p className="mt-1 text-xs text-[#708075]">
              Add one above whenever inspiration hits.
            </p>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-[#e8ede5] overflow-hidden rounded-2xl border border-white/85 bg-white/62">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <button
                  type="button"
                  onClick={() => completeIdea(idea.id)}
                  aria-label={`Mark ${idea.title} completed`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#b9c8b3] bg-white text-transparent transition hover:border-[#647d5b] hover:text-[#647d5b]"
                >
                  ✓
                </button>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#243128]">
                    {idea.title}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${getTypeStyle(
                    idea.content_type
                  )}`}
                >
                  {idea.content_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
