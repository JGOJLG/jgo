"use client";

import {
  type DragEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase-browser";

type ContentIdea = {
  id: number;
  title: string;
  content_type: string;
  notes: string | null;
  status: string;
  is_archived: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at?: string | null;
};

type IdeaForm = {
  title: string;
  contentType: string;
  notes: string;
};

const emptyForm: IdeaForm = {
  title: "",
  contentType: "Social Video",
  notes: "",
};

const contentTypes = [
  "Social Video",
  "LinkedIn Post",
  "Substack Topic",
];

function isComplete(idea: ContentIdea) {
  return idea.status.trim().toLowerCase() === "posted";
}

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

function compareIdeas(a: ContentIdea, b: ContentIdea) {
  const aComplete = isComplete(a);
  const bComplete = isComplete(b);

  if (aComplete !== bComplete) {
    return aComplete ? 1 : -1;
  }

  if (!aComplete && !bComplete) {
    const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
  }

  return b.id - a.id;
}

export default function ContentIdeasPage() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingIdea, setEditingIdea] =
    useState<ContentIdea | null>(null);
  const [form, setForm] = useState<IdeaForm>(emptyForm);
  const [filter, setFilter] = useState("All");
  const [reordering, setReordering] = useState(false);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadIdeas() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("content_ideas")
      .select("*")
      .eq("is_archived", false)
      .order("sort_order", {
        ascending: true,
        nullsFirst: false,
      })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Unable to load content ideas:", error);
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setIdeas(((data ?? []) as ContentIdea[]).sort(compareIdeas));
    setLoading(false);
  }

  useEffect(() => {
    void loadIdeas();
  }, []);

  const visibleIdeas = useMemo(() => {
    const filtered = ideas.filter((idea) => {
      if (filter === "All") {
        return true;
      }

      return idea.content_type === filter;
    });

    return [...filtered].sort(compareIdeas);
  }, [ideas, filter]);

  const openCount = ideas.filter((idea) => !isComplete(idea)).length;
  const completedCount = ideas.filter(isComplete).length;

  function openNewIdea() {
    setEditingIdea(null);
    setForm(emptyForm);
    setErrorMessage("");
    setShowForm(true);
  }

  function openEditIdea(idea: ContentIdea) {
    if (reordering) {
      return;
    }

    setEditingIdea(idea);
    setForm({
      title: idea.title,
      contentType: idea.content_type,
      notes: idea.notes ?? "",
    });
    setErrorMessage("");
    setShowForm(true);
  }

  function updateForm(field: keyof IdeaForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function getNextSortOrder() {
    const openIdeas = ideas.filter((idea) => !isComplete(idea));

    if (openIdeas.length === 0) {
      return 0;
    }

    const smallestOrder = Math.min(
      ...openIdeas.map(
        (idea) => idea.sort_order ?? Number.MAX_SAFE_INTEGER
      )
    );

    return Number.isFinite(smallestOrder)
      ? smallestOrder - 1
      : 0;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.title.trim()) {
      setErrorMessage("Please add the content idea.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const supabase = createClient();

    const payload = {
      title: form.title.trim(),
      content_type: form.contentType,
      notes: form.notes.trim() || null,
      platform:
        form.contentType === "Substack Topic"
          ? "Substack"
          : form.contentType === "LinkedIn Post"
            ? "LinkedIn"
            : "Social Media",
      updated_at: new Date().toISOString(),
    };

    const result = editingIdea
      ? await supabase
          .from("content_ideas")
          .update(payload)
          .eq("id", editingIdea.id)
      : await supabase.from("content_ideas").insert({
          ...payload,
          status: "Idea",
          is_archived: false,
          sort_order: await getNextSortOrder(),
        });

    if (result.error) {
      console.error("Unable to save content idea:", result.error);
      setErrorMessage(result.error.message);
      setSaving(false);
      return;
    }

    setShowForm(false);
    setEditingIdea(null);
    setForm(emptyForm);
    setSaving(false);
    await loadIdeas();
  }

  async function toggleComplete(idea: ContentIdea) {
    if (reordering) {
      return;
    }

    const complete = isComplete(idea);
    const supabase = createClient();

    const { error } = await supabase
      .from("content_ideas")
      .update({
        status: complete ? "Idea" : "Posted",
        posted_date: complete
          ? null
          : new Date().toISOString().split("T")[0],
        sort_order: complete
          ? await getNextSortOrder()
          : idea.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", idea.id);

    if (error) {
      console.error("Unable to update content idea:", error);
      setErrorMessage(error.message);
      return;
    }

    await loadIdeas();
  }

  async function deleteIdea() {
    if (!editingIdea) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${editingIdea.title}" permanently?`
    );

    if (!confirmed) {
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("content_ideas")
      .delete()
      .eq("id", editingIdea.id);

    if (error) {
      console.error("Unable to delete content idea:", error);
      setErrorMessage(error.message);
      return;
    }

    setShowForm(false);
    setEditingIdea(null);
    setForm(emptyForm);
    await loadIdeas();
  }

  function beginReorder() {
    setFilter("All");
    setReordering(true);
    setErrorMessage("");

    setIdeas((current) => {
      const openIdeas = current
        .filter((idea) => !isComplete(idea))
        .sort(compareIdeas)
        .map((idea, index) => ({
          ...idea,
          sort_order: index,
        }));

      const completedIdeas = current
        .filter(isComplete)
        .sort(compareIdeas);

      return [...openIdeas, ...completedIdeas];
    });
  }

  function cancelReorder() {
    setReordering(false);
    setDraggedId(null);
    void loadIdeas();
  }

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    idea: ContentIdea
  ) {
    if (!reordering || isComplete(idea)) {
      event.preventDefault();
      return;
    }

    setDraggedId(idea.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(idea.id));
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    targetIdea: ContentIdea
  ) {
    if (
      !reordering ||
      draggedId === null ||
      draggedId === targetIdea.id ||
      isComplete(targetIdea)
    ) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    setIdeas((current) => {
      const openIdeas = current
        .filter((idea) => !isComplete(idea))
        .sort(compareIdeas);

      const completedIdeas = current
        .filter(isComplete)
        .sort(compareIdeas);

      const draggedIndex = openIdeas.findIndex(
        (idea) => idea.id === draggedId
      );
      const targetIndex = openIdeas.findIndex(
        (idea) => idea.id === targetIdea.id
      );

      if (
        draggedIndex === -1 ||
        targetIndex === -1 ||
        draggedIndex === targetIndex
      ) {
        return current;
      }

      const reordered = [...openIdeas];
      const [draggedIdea] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, draggedIdea);

      return [
        ...reordered.map((idea, index) => ({
          ...idea,
          sort_order: index,
        })),
        ...completedIdeas,
      ];
    });
  }

  async function saveOrder() {
    setSavingOrder(true);
    setErrorMessage("");

    const openIdeas = ideas
      .filter((idea) => !isComplete(idea))
      .sort(compareIdeas);

    const supabase = createClient();

    const results = await Promise.all(
      openIdeas.map((idea, index) =>
        supabase
          .from("content_ideas")
          .update({
            sort_order: index,
            updated_at: new Date().toISOString(),
          })
          .eq("id", idea.id)
      )
    );

    const failedResult = results.find((result) => result.error);

    if (failedResult?.error) {
      setErrorMessage(failedResult.error.message);
      setSavingOrder(false);
      return;
    }

    setReordering(false);
    setDraggedId(null);
    setSavingOrder(false);
    await loadIdeas();
  }

  return (
    <main className="min-h-screen min-w-0 flex-1 bg-[radial-gradient(circle_at_top_left,_rgba(218,231,211,0.92),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(236,229,244,0.72),_transparent_26%),linear-gradient(180deg,_#f8f9f5_0%,_#f3f5ef_100%)] text-[#243128]">
      <header className="border-b border-white/75 bg-white/62 px-6 py-7 shadow-[0_12px_35px_rgba(71,91,66,0.07)] backdrop-blur-2xl lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7f9975]">
              JGO Hire
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Content Ideas
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#708075]">
              A simple place to save ideas for social videos,
              LinkedIn posts, and Substack articles.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {reordering ? (
              <>
                <button
                  type="button"
                  onClick={cancelReorder}
                  className="rounded-2xl border border-[#d7e1d0] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveOrder}
                  disabled={savingOrder}
                  className="rounded-2xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(80,104,72,0.20)] disabled:opacity-50"
                >
                  {savingOrder ? "Saving..." : "Done"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={beginReorder}
                  disabled={openCount < 2}
                  className="rounded-2xl border border-[#d7e1d0] bg-white/85 px-5 py-3 text-sm font-semibold text-[#4d6247] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Reorder
                </button>

                <button
                  type="button"
                  onClick={openNewIdea}
                  className="rounded-2xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(80,104,72,0.20)] transition hover:-translate-y-0.5 hover:bg-[#526b4b]"
                >
                  + Add Idea
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-10">
        {errorMessage && !showForm ? (
          <div className="rounded-2xl border border-[#ead4d0] bg-[#fbefed] p-4 text-sm font-medium text-[#8d4f48]">
            {errorMessage}
          </div>
        ) : null}

        <section className="flex flex-col gap-4 rounded-[26px] border border-white/75 bg-white/62 p-5 shadow-[0_18px_50px_rgba(71,91,66,0.10)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {["All", ...contentTypes].map((item) => (
              <button
                key={item}
                type="button"
                disabled={reordering}
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === item
                    ? "bg-[#647d5b] text-white"
                    : "border border-[#d7e1d0] bg-white/75 text-[#647066] hover:bg-white"
                } disabled:cursor-not-allowed disabled:opacity-55`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex gap-4 text-xs font-semibold text-[#708075]">
            <span>{openCount} open</span>
            <span>{completedCount} completed</span>
          </div>
        </section>

        {reordering ? (
          <div className="rounded-2xl border border-[#d7e1d0] bg-[#f3f6f0] px-5 py-4 text-sm font-medium text-[#52684b]">
            Drag the open ideas into your preferred order, then click Done.
            Completed ideas stay at the bottom.
          </div>
        ) : null}

        {loading ? (
          <section className="rounded-[28px] border border-white/75 bg-white/62 p-10 text-center">
            <p className="text-sm font-semibold text-[#708075]">
              Loading ideas...
            </p>
          </section>
        ) : visibleIdeas.length === 0 ? (
          <section className="rounded-[28px] border border-dashed border-[#cfd9c9] bg-white/58 p-12 text-center">
            <h2 className="text-xl font-bold">
              No ideas here yet
            </h2>

            <p className="mt-2 text-sm text-[#708075]">
              Add a video, LinkedIn, or Substack idea whenever
              inspiration hits.
            </p>

            <button
              type="button"
              onClick={openNewIdea}
              className="mt-5 rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white"
            >
              + Add Idea
            </button>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[28px] border border-white/75 bg-white/64 shadow-[0_22px_60px_rgba(71,91,66,0.12)] backdrop-blur-2xl">
            <div className="divide-y divide-[#edf0ea]">
              {visibleIdeas.map((idea) => {
                const complete = isComplete(idea);
                const draggable = reordering && !complete;

                return (
                  <div
                    key={idea.id}
                    draggable={draggable}
                    onDragStart={(event) =>
                      handleDragStart(event, idea)
                    }
                    onDragOver={(event) =>
                      handleDragOver(event, idea)
                    }
                    onDragEnd={() => setDraggedId(null)}
                    className={`flex items-start gap-4 px-5 py-5 transition ${
                      complete
                        ? "bg-[#f2f5ef]/80"
                        : "bg-white/35 hover:bg-white/70"
                    } ${
                      draggable
                        ? "cursor-grab active:cursor-grabbing"
                        : ""
                    } ${
                      draggedId === idea.id
                        ? "opacity-45"
                        : ""
                    }`}
                  >
                    {draggable ? (
                      <span
                        aria-hidden="true"
                        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center text-lg font-bold tracking-[-0.3em] text-[#87967f]"
                      >
                        ⠿
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleComplete(idea)}
                        aria-label={
                          complete
                            ? `Move ${idea.title} back to open ideas`
                            : `Mark ${idea.title} complete`
                        }
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          complete
                            ? "border-[#647d5b] bg-[#647d5b] text-white"
                            : "border-[#b9c8b3] bg-white text-transparent hover:border-[#647d5b]"
                        }`}
                      >
                        ✓
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={reordering}
                      onClick={() => openEditIdea(idea)}
                      className="min-w-0 flex-1 text-left disabled:cursor-default"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${getTypeStyle(
                            idea.content_type
                          )}`}
                        >
                          {idea.content_type}
                        </span>

                        {complete ? (
                          <span className="rounded-full bg-[#e7f1e6] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#55704f]">
                            Completed
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 text-base font-bold leading-6 text-[#243128]">
                        {idea.title}
                      </p>

                      {idea.notes ? (
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-[#708075]">
                          {idea.notes}
                        </p>
                      ) : null}
                    </button>

                    {!reordering ? (
                      <button
                        type="button"
                        onClick={() => openEditIdea(idea)}
                        aria-label={`Edit ${idea.title}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d7e1d0] bg-white text-sm text-[#708075] transition hover:border-[#9fb294] hover:text-[#3d4d39]"
                      >
                        ✎
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 w-full max-w-xl overflow-hidden rounded-[30px] border border-white/80 bg-[#fbfcf9] shadow-[0_30px_100px_rgba(39,52,39,0.25)]">
            <div className="flex items-start justify-between border-b border-[#e4e9df] p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7f9975]">
                  Content Ideas
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {editingIdea ? "Edit Idea" : "Add Idea"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7e1d0] bg-white text-[#708075]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 p-6">
                <label className="block">
                  <span className="text-sm font-semibold text-[#3d4d39]">
                    Idea *
                  </span>

                  <input
                    required
                    value={form.title}
                    onChange={(event) =>
                      updateForm("title", event.target.value)
                    }
                    className={inputStyle}
                    placeholder="Add your content idea..."
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-[#3d4d39]">
                    Type
                  </span>

                  <select
                    value={form.contentType}
                    onChange={(event) =>
                      updateForm(
                        "contentType",
                        event.target.value
                      )
                    }
                    className={inputStyle}
                  >
                    {contentTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-[#3d4d39]">
                    Notes
                  </span>

                  <textarea
                    rows={5}
                    value={form.notes}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    className={`${inputStyle} resize-y`}
                    placeholder="Optional details, hook, or talking points..."
                  />
                </label>

                {errorMessage ? (
                  <div className="rounded-xl border border-[#ead4d0] bg-[#fbefed] p-4 text-sm font-medium text-[#8d4f48]">
                    {errorMessage}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#e4e9df] p-6 sm:flex-row sm:items-center">
                {editingIdea ? (
                  <button
                    type="button"
                    onClick={deleteIdea}
                    className="rounded-xl border border-[#e2c6c2] bg-white px-5 py-3 text-sm font-semibold text-[#9a554d]"
                  >
                    Delete
                  </button>
                ) : null}

                <div className="flex flex-1 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-[#d7e1d0] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingIdea
                        ? "Save Changes"
                        : "Save Idea"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

const inputStyle =
  "mt-2 w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm text-[#243128] outline-none placeholder:text-[#9aa59c] focus:border-[#9fb294] focus:ring-2 focus:ring-[#e8eee3]";
