"use client";

import {
  type FormEvent,
  useActionState,
  useEffect,
  useState,
} from "react";
import {
  deleteCalendarEvent,
  updateCalendarEvent,
  type CalendarActionState,
} from "./actions";

type Props = {
  event: {
    id: number;
    title: string;
    eventType: string;
    startAt: string;
    endAt: string;
    guestEmail: string;
    notes: string;
    status: string;
  };
};

const initialState: CalendarActionState = {};

const eventTypes = [
  { value: "appointment", label: "Appointment" },
  { value: "interview", label: "Client Interview" },
  { value: "follow_up", label: "Follow-Up" },
  { value: "reminder", label: "General Reminder" },
  { value: "free15", label: "Free 15" },
  { value: "client_session", label: "Client Session" },
];

const statuses = [
  "Scheduled",
  "Completed",
  "Cancelled",
];

export default function CalendarEventEditor({
  event,
}: Props) {
  const [open, setOpen] = useState(false);

  const [updateState, updateAction, updating] =
    useActionState(updateCalendarEvent, initialState);

  const [deleteState, deleteAction, deleting] =
    useActionState(deleteCalendarEvent, initialState);

  useEffect(() => {
    if (updateState.error) {
      setOpen(true);
    }
  }, [updateState.error]);

  function confirmDelete(
    formEvent: FormEvent<HTMLFormElement>
  ) {
    const confirmed = window.confirm(
      `Delete "${event.title}"? This cannot be undone.`
    );

    if (!confirmed) {
      formEvent.preventDefault();
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#526b4b]"
        >
          <span aria-hidden="true">✎</span>
          Edit Event
        </button>

        <form
          action={deleteAction}
          onSubmit={confirmDelete}
        >
          <input
            type="hidden"
            name="eventId"
            value={event.id}
          />

          <button
            type="submit"
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2c6c2] bg-white px-5 py-3 text-sm font-semibold text-[#9a554d] transition hover:bg-[#fbefed] disabled:opacity-50"
          >
            <span aria-hidden="true">×</span>
            {deleting ? "Deleting..." : "Delete Event"}
          </button>
        </form>
      </div>

      {deleteState.error ? (
        <p className="mt-3 rounded-xl border border-[#ead4d0] bg-[#fbefed] p-3 text-sm font-medium text-[#8d4f48]">
          {deleteState.error}
        </p>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[#172019]/45 p-4 backdrop-blur-sm"
          onMouseDown={(mouseEvent) => {
            if (
              mouseEvent.target === mouseEvent.currentTarget &&
              !updating
            ) {
              setOpen(false);
            }
          }}
        >
          <div className="mx-auto my-8 w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/80 bg-[#fbfcf9] shadow-[0_35px_110px_rgba(39,52,39,0.30)]">
            <div className="flex items-start justify-between border-b border-[#e4e9df] bg-[linear-gradient(145deg,#edf4e9,#ffffff)] p-6 lg:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7f9975]">
                  Calendar
                </p>

                <h2 className="mt-2 text-3xl font-bold text-[#243128]">
                  Edit Event
                </h2>

                <p className="mt-2 text-sm text-[#708075]">
                  Update the details and save your changes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={updating}
                aria-label="Close edit event form"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d7e1d0] bg-white text-[#708075] transition hover:text-[#243128] disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <form action={updateAction}>
              <input
                type="hidden"
                name="eventId"
                value={event.id}
              />

              <div className="grid gap-5 p-6 md:grid-cols-2 lg:p-8">
                <label className="md:col-span-2">
                  <span className={labelStyle}>Title</span>
                  <input
                    required
                    name="title"
                    defaultValue={event.title}
                    className={inputStyle}
                  />
                </label>

                <label>
                  <span className={labelStyle}>
                    Event Type
                  </span>

                  <select
                    required
                    name="eventType"
                    defaultValue={event.eventType}
                    className={inputStyle}
                  >
                    {eventTypes.map((type) => (
                      <option
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className={labelStyle}>Status</span>

                  <select
                    name="status"
                    defaultValue={event.status}
                    className={inputStyle}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className={labelStyle}>
                    Start Date and Time
                  </span>

                  <input
                    required
                    type="datetime-local"
                    name="startAt"
                    defaultValue={event.startAt}
                    className={inputStyle}
                  />
                </label>

                <label>
                  <span className={labelStyle}>
                    End Date and Time
                  </span>

                  <input
                    type="datetime-local"
                    name="endAt"
                    defaultValue={event.endAt}
                    className={inputStyle}
                  />
                </label>

                <label className="md:col-span-2">
                  <span className={labelStyle}>
                    Guest Email
                  </span>

                  <input
                    type="email"
                    name="guestEmail"
                    defaultValue={event.guestEmail}
                    className={inputStyle}
                    placeholder="guest@email.com"
                  />
                </label>

                <label className="md:col-span-2">
                  <span className={labelStyle}>Notes</span>

                  <textarea
                    name="notes"
                    rows={5}
                    defaultValue={event.notes}
                    className={`${inputStyle} resize-y`}
                    placeholder="Add notes..."
                  />
                </label>

                {updateState.error ? (
                  <div className="md:col-span-2 rounded-xl border border-[#ead4d0] bg-[#fbefed] p-4 text-sm font-medium text-[#8d4f48]">
                    {updateState.error}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#e4e9df] p-6 sm:flex-row sm:justify-end lg:px-8">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={updating}
                  className="rounded-xl border border-[#d7e1d0] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#526b4b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating
                    ? "Saving Changes..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

const labelStyle =
  "text-sm font-semibold text-[#3d4d39]";

const inputStyle =
  "mt-2 w-full rounded-xl border border-[#d7e1d0] bg-white px-4 py-3 text-sm text-[#243128] outline-none placeholder:text-[#9aa59c] focus:border-[#9fb294] focus:ring-2 focus:ring-[#e8eee3]";
