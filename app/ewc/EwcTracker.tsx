"use client";

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import {
  createEwcEntry,
  deleteEwcEntry,
  reorderEwcEntries,
  updateEwcEntry,
  type EwcEntryType,
} from "./actions";

export type EwcEntry = {
  id: number;
  section: EwcEntryType;
  client_name: string;
  service_date: string | null;
  service_type: string;
  amount_owed: number;
  amount_paid: number;
  date_paid: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type EditableKey =
  | "client_name"
  | "service_date"
  | "service_type"
  | "amount_owed"
  | "amount_paid"
  | "date_paid"
  | "notes";

const editableColumns: EditableKey[] = [
  "client_name",
  "service_date",
  "service_type",
  "amount_owed",
  "amount_paid",
  "date_paid",
  "notes",
];

const fieldLabels: Record<EditableKey, string> = {
  client_name: "Client",
  service_date: "Date",
  service_type: "Service",
  amount_owed: "Owed",
  amount_paid: "Paid",
  date_paid: "Date Paid",
  notes: "Notes",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(value) ? value : 0);
}

function numberValue(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getOutstanding(row: EwcEntry) {
  return Math.max(Number(row.amount_owed || 0) - Number(row.amount_paid || 0), 0);
}

function getPaymentStatus(row: EwcEntry) {
  const owed = Number(row.amount_owed || 0);
  const paid = Number(row.amount_paid || 0);

  if (owed <= 0 && paid <= 0) return "Not Set";
  if (paid >= owed && owed > 0) return "Paid";
  if (paid > 0) return "Partial";
  return "Outstanding";
}

function statusStyle(status: string) {
  if (status === "Paid") return "bg-[#e7f0e4] text-[#4d6f46]";
  if (status === "Partial") return "bg-[#f6ecd9] text-[#8f6d37]";
  if (status === "Outstanding") return "bg-[#f7e7e4] text-[#9a554d]";
  return "bg-[#eef2e9] text-[#708075]";
}

export default function EwcTracker({
  initialEntries,
}: {
  initialEntries: EwcEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [dragged, setDragged] = useState<{
    section: EwcEntryType;
    id: number;
  } | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sessions = useMemo(
    () =>
      entries
        .filter((entry) => entry.section === "Session")
        .sort((a, b) => a.sort_order - b.sort_order),
    [entries],
  );

  const linkedin = useMemo(
    () =>
      entries
        .filter((entry) => entry.section === "LinkedIn")
        .sort((a, b) => a.sort_order - b.sort_order),
    [entries],
  );

  const totals = useMemo(() => {
    const all = entries.reduce(
      (acc, row) => {
        acc.owed += Number(row.amount_owed || 0);
        acc.paid += Number(row.amount_paid || 0);
        return acc;
      },
      { owed: 0, paid: 0 },
    );

    return {
      owed: all.owed,
      paid: all.paid,
      outstanding: Math.max(all.owed - all.paid, 0),
      clients: entries.length,
    };
  }, [entries]);

  function flashSaved(message = "Saved") {
    setSavedMessage(message);

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      setSavedMessage("");
    }, 1800);
  }

  function updateLocal(
    id: number,
    field: EditableKey,
    value: string | number,
  ) {
    setEntries((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  }

  function persistRow(row: EwcEntry) {
    const formData = new FormData();
    formData.set("id", String(row.id));
    formData.set("client_name", row.client_name);
    formData.set("service_date", row.service_date ?? "");
    formData.set("service_type", row.service_type);
    formData.set("amount_owed", String(row.amount_owed ?? 0));
    formData.set("amount_paid", String(row.amount_paid ?? 0));
    formData.set("date_paid", row.date_paid ?? "");
    formData.set("notes", row.notes ?? "");

    startTransition(async () => {
      try {
        await updateEwcEntry(formData);
        flashSaved();
      } catch (error) {
        console.error(error);
        flashSaved("Could not save");
      }
    });
  }

  function addRow(section: EwcEntryType) {
    startTransition(async () => {
      try {
        const row = (await createEwcEntry(section)) as EwcEntry;
        setEntries((current) => [...current, row]);
        flashSaved(`${section} row added`);
      } catch (error) {
        console.error(error);
        flashSaved("Could not add row");
      }
    });
  }

  function removeRow(id: number) {
    startTransition(async () => {
      try {
        await deleteEwcEntry(id);
        setEntries((current) => current.filter((row) => row.id !== id));
        flashSaved("Row deleted");
      } catch (error) {
        console.error(error);
        flashSaved("Could not delete");
      }
    });
  }

  function getCellId(id: number, field: EditableKey) {
    return `ewc-cell-${id}-${field}`;
  }

  function moveFocus(
    event: KeyboardEvent<HTMLInputElement>,
    rows: EwcEntry[],
    rowIndex: number,
    field: EditableKey,
  ) {
    const columnIndex = editableColumns.indexOf(field);
    let targetRowIndex = rowIndex;
    let targetColumnIndex = columnIndex;

    if (event.key === "ArrowRight") targetColumnIndex += 1;
    else if (event.key === "ArrowLeft") targetColumnIndex -= 1;
    else if (event.key === "ArrowDown" || event.key === "Enter")
      targetRowIndex += 1;
    else if (event.key === "ArrowUp") targetRowIndex -= 1;
    else return;

    const targetRow = rows[targetRowIndex];
    const targetField = editableColumns[targetColumnIndex];

    if (!targetRow || !targetField) return;

    event.preventDefault();
    const target = document.getElementById(
      getCellId(targetRow.id, targetField),
    ) as HTMLInputElement | null;

    target?.focus();
    target?.select();
  }

  function reorderWithinSection(
    section: EwcEntryType,
    targetId: number,
  ) {
    if (!dragged || dragged.section !== section || dragged.id === targetId) {
      return;
    }

    const sectionRows = entries
      .filter((row) => row.section === section)
      .sort((a, b) => a.sort_order - b.sort_order);

    const fromIndex = sectionRows.findIndex((row) => row.id === dragged.id);
    const toIndex = sectionRows.findIndex((row) => row.id === targetId);

    if (fromIndex < 0 || toIndex < 0) return;

    const reordered = [...sectionRows];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const orderMap = new Map(
      reordered.map((row, index) => [row.id, index + 1]),
    );

    setEntries((current) =>
      current.map((row) =>
        row.section === section
          ? { ...row, sort_order: orderMap.get(row.id) ?? row.sort_order }
          : row,
      ),
    );

    setDragged(null);

    startTransition(async () => {
      try {
        await reorderEwcEntries(
          section,
          reordered.map((row) => row.id),
        );
        flashSaved("Order saved");
      } catch (error) {
        console.error(error);
        flashSaved("Could not reorder");
      }
    });
  }

  function renderTable(section: EwcEntryType, rows: EwcEntry[]) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[#dfe6db] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#dfe6db] bg-[#fbfaf6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#243128]">{section}s</h2>
            <p className="mt-1 text-sm text-[#708075]">
              {section === "Session"
                ? "Track every EWC coaching session and payment."
                : "Track EWC LinkedIn work and payment."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => addRow(section)}
            disabled={isPending}
            className="rounded-xl bg-[#647d5b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4d6247] disabled:opacity-60"
          >
            + Add {section === "Session" ? "Session" : "LinkedIn Client"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <div className="grid grid-cols-[44px_210px_125px_165px_110px_110px_110px_125px_120px_1fr_44px] border-b border-[#dfe6db] bg-[#eef2ea] text-[10px] font-bold uppercase tracking-[0.1em] text-[#647066]">
              <div className="border-r border-[#dfe6db] px-2 py-3 text-center">#</div>
              <div className="border-r border-[#dfe6db] px-3 py-3">Client</div>
              <div className="border-r border-[#dfe6db] px-3 py-3 text-center">Date</div>
              <div className="border-r border-[#dfe6db] px-3 py-3">Service</div>
              <div className="border-r border-[#dfe6db] px-3 py-3 text-center">Owed</div>
              <div className="border-r border-[#dfe6db] px-3 py-3 text-center">Paid</div>
              <div className="border-r border-[#dfe6db] px-3 py-3 text-center">Outstanding</div>
              <div className="border-r border-[#dfe6db] px-3 py-3 text-center">Date Paid</div>
              <div className="border-r border-[#dfe6db] px-3 py-3 text-center">Status</div>
              <div className="border-r border-[#dfe6db] px-3 py-3">Notes</div>
              <div />
            </div>

            {rows.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[#708075]">
                No {section.toLowerCase()} entries yet. Add your first one above.
              </div>
            ) : null}

            {rows.map((row, rowIndex) => {
              const outstanding = getOutstanding(row);
              const status = getPaymentStatus(row);

              const inputClass =
                "h-full w-full border-0 bg-transparent px-3 py-2.5 text-sm text-[#243128] outline-none focus:bg-white focus:shadow-[inset_0_0_0_2px_rgba(100,125,91,0.24)]";

              return (
                <div
                  key={row.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => reorderWithinSection(section, row.id)}
                  className={`group grid grid-cols-[44px_210px_125px_165px_110px_110px_110px_125px_120px_1fr_44px] border-b border-[#edf0ea] ${
                    rowIndex % 2 === 0 ? "bg-white" : "bg-[#fcfdfb]"
                  } hover:bg-[#f8faf6]`}
                >
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDragged({ section, id: row.id })}
                    className="cursor-grab border-r border-[#edf0ea] text-[#a5aea6] opacity-50 transition group-hover:opacity-100"
                    title="Drag to reorder"
                    aria-label="Drag to reorder"
                  >
                    ⋮⋮
                  </button>

                  <div className="border-r border-[#edf0ea]">
                    <input
                      id={getCellId(row.id, "client_name")}
                      value={row.client_name}
                      onChange={(event) =>
                        updateLocal(row.id, "client_name", event.target.value)
                      }
                      onBlur={() => persistRow(row)}
                      onKeyDown={(event) =>
                        moveFocus(event, rows, rowIndex, "client_name")
                      }
                      placeholder="Client name"
                      className={inputClass}
                    />
                  </div>

                  <div className="border-r border-[#edf0ea]">
                    <input
                      id={getCellId(row.id, "service_date")}
                      type="date"
                      value={row.service_date ?? ""}
                      onChange={(event) =>
                        updateLocal(row.id, "service_date", event.target.value)
                      }
                      onBlur={() => persistRow(row)}
                      onKeyDown={(event) =>
                        moveFocus(event, rows, rowIndex, "service_date")
                      }
                      className={inputClass}
                    />
                  </div>

                  <div className="border-r border-[#edf0ea]">
                    <input
                      id={getCellId(row.id, "service_type")}
                      value={row.service_type}
                      onChange={(event) =>
                        updateLocal(row.id, "service_type", event.target.value)
                      }
                      onBlur={() => persistRow(row)}
                      onKeyDown={(event) =>
                        moveFocus(event, rows, rowIndex, "service_type")
                      }
                      placeholder={
                        section === "Session" ? "1 hour" : "LinkedIn Review"
                      }
                      className={inputClass}
                    />
                  </div>

                  <div className="flex items-center border-r border-[#edf0ea]">
                    <span className="pl-2 text-xs text-[#8a968d]">$</span>
                    <input
                      id={getCellId(row.id, "amount_owed")}
                      inputMode="decimal"
                      value={row.amount_owed || ""}
                      onChange={(event) =>
                        updateLocal(
                          row.id,
                          "amount_owed",
                          numberValue(event.target.value),
                        )
                      }
                      onBlur={() => persistRow(row)}
                      onKeyDown={(event) =>
                        moveFocus(event, rows, rowIndex, "amount_owed")
                      }
                      placeholder="0"
                      className={`${inputClass} text-right`}
                    />
                  </div>

                  <div className="flex items-center border-r border-[#edf0ea]">
                    <span className="pl-2 text-xs text-[#8a968d]">$</span>
                    <input
                      id={getCellId(row.id, "amount_paid")}
                      inputMode="decimal"
                      value={row.amount_paid || ""}
                      onChange={(event) =>
                        updateLocal(
                          row.id,
                          "amount_paid",
                          numberValue(event.target.value),
                        )
                      }
                      onBlur={() => persistRow(row)}
                      onKeyDown={(event) =>
                        moveFocus(event, rows, rowIndex, "amount_paid")
                      }
                      placeholder="0"
                      className={`${inputClass} text-right`}
                    />
                  </div>

                  <div className="flex items-center justify-center border-r border-[#edf0ea] bg-[#fbf6f3] px-2 text-sm font-semibold text-[#9a554d]">
                    {money(outstanding)}
                  </div>

                  <div className="border-r border-[#edf0ea]">
                    <input
                      id={getCellId(row.id, "date_paid")}
                      type="date"
                      value={row.date_paid ?? ""}
                      onChange={(event) =>
                        updateLocal(row.id, "date_paid", event.target.value)
                      }
                      onBlur={() => persistRow(row)}
                      onKeyDown={(event) =>
                        moveFocus(event, rows, rowIndex, "date_paid")
                      }
                      className={inputClass}
                    />
                  </div>

                  <div className="flex items-center justify-center border-r border-[#edf0ea] px-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(
                        status,
                      )}`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="border-r border-[#edf0ea]">
                    <input
                      id={getCellId(row.id, "notes")}
                      value={row.notes ?? ""}
                      onChange={(event) =>
                        updateLocal(row.id, "notes", event.target.value)
                      }
                      onBlur={() => persistRow(row)}
                      onKeyDown={(event) =>
                        moveFocus(event, rows, rowIndex, "notes")
                      }
                      placeholder="Notes"
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-[#a45f58] opacity-0 transition hover:bg-[#fbefed] group-hover:opacity-100"
                    aria-label={`Delete ${row.client_name || "row"}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}

            <div className="grid grid-cols-[44px_210px_125px_165px_110px_110px_110px_125px_120px_1fr_44px] bg-[#f8faf6] text-sm font-semibold text-[#4d6247]">
              <div />
              <div className="px-3 py-3">{section} Total</div>
              <div />
              <div />
              <div className="px-3 py-3 text-right">
                {money(
                  rows.reduce(
                    (sum, row) => sum + Number(row.amount_owed || 0),
                    0,
                  ),
                )}
              </div>
              <div className="px-3 py-3 text-right">
                {money(
                  rows.reduce(
                    (sum, row) => sum + Number(row.amount_paid || 0),
                    0,
                  ),
                )}
              </div>
              <div className="px-3 py-3 text-right text-[#9a554d]">
                {money(
                  rows.reduce((sum, row) => sum + getOutstanding(row), 0),
                )}
              </div>
              <div />
              <div />
              <div />
              <div />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 flex-1 bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7f9975]">
            Emily Weiss Consulting
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">EWC</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#708075]">
            Track every client sent through EWC, the work completed, and the money owed and paid in one place.
          </p>
        </div>
      </header>

      <div className="space-y-7 p-6 lg:p-10">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#708075]">Total Owed</p>
            <p className="mt-3 text-3xl font-bold">{money(totals.owed)}</p>
          </div>

          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#708075]">Total Paid</p>
            <p className="mt-3 text-3xl font-bold text-[#56754f]">
              {money(totals.paid)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#ead4d0] bg-[#fffdfc] p-5 shadow-sm">
            <p className="text-sm font-medium text-[#8b6a65]">Outstanding</p>
            <p className="mt-3 text-3xl font-bold text-[#9a554d]">
              {money(totals.outstanding)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfe6db] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#708075]">Entries</p>
            <p className="mt-3 text-3xl font-bold">{totals.clients}</p>
          </div>
        </section>

        <div className="flex items-center justify-between rounded-xl border border-[#dfe6db] bg-white px-4 py-3 text-xs text-[#708075]">
          <span>
            Spreadsheet mode: use arrow keys to move across cells and Enter to move down.
          </span>
          <span className="font-semibold text-[#647d5b]">
            {isPending ? "Saving..." : savedMessage || "Auto-saves"}
          </span>
        </div>

        {renderTable("Session", sessions)}
        {renderTable("LinkedIn", linkedin)}
      </div>

      {savedMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 rounded-2xl border border-[#cbd8c4] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] shadow-lg"
        >
          ✓ {savedMessage}
        </div>
      ) : null}
    </section>
  );
}
