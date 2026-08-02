import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { createInterview } from "./actions";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewInterviewPage({ params }: Props) {
  const { id } = await params;
  const clientId = Number(id);

  if (!Number.isInteger(clientId)) {
    notFound();
  }

  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .maybeSingle();

  if (error || !client) {
    notFound();
  }

  const inputStyle =
    "w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm text-[#243128] outline-none focus:border-[#9fb294]";

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/clients/${clientId}`}
            className="text-sm font-semibold text-[#7f9975] hover:text-[#4d6247]"
          >
            ← Back to {client.name || "Client"}
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Add Interview
          </h1>

          <p className="mt-2 text-sm text-[#708075]">
            Add as much or as little information as you have. Interviews with a date will appear on the client profile, main calendar, and dashboard.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-6 lg:p-10">
        <form
          action={createInterview}
          className="rounded-3xl border border-[#dfe6db] bg-white p-8 shadow-sm"
        >
          <input type="hidden" name="clientId" value={clientId} />

          <div className="grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-[#3d4d39]">
                Interview Title
              </span>
              <input
                name="title"
                required
                defaultValue={`Interview for ${client.name || "Client"}`}
                className={`mt-2 ${inputStyle}`}
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-[#3d4d39]">
                Interview Date
              </span>
              <input
                name="interviewDate"
                type="date"
                min={getToday()}
                className={`mt-2 ${inputStyle}`}
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-[#3d4d39]">
                Interview Time
              </span>
              <select
                name="interviewTime"
                defaultValue=""
                className={`mt-2 ${inputStyle}`}
              >
                                <option value="">No time selected</option>
                <option value="07:00">7:00 AM</option>
                <option value="07:15">7:15 AM</option>
                <option value="07:30">7:30 AM</option>
                <option value="07:45">7:45 AM</option>
                <option value="08:00">8:00 AM</option>
                <option value="08:15">8:15 AM</option>
                <option value="08:30">8:30 AM</option>
                <option value="08:45">8:45 AM</option>
                <option value="09:00">9:00 AM</option>
                <option value="09:15">9:15 AM</option>
                <option value="09:30">9:30 AM</option>
                <option value="09:45">9:45 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="10:15">10:15 AM</option>
                <option value="10:30">10:30 AM</option>
                <option value="10:45">10:45 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="11:15">11:15 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="11:45">11:45 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="12:15">12:15 PM</option>
                <option value="12:30">12:30 PM</option>
                <option value="12:45">12:45 PM</option>
                <option value="13:00">1:00 PM</option>
                <option value="13:15">1:15 PM</option>
                <option value="13:30">1:30 PM</option>
                <option value="13:45">1:45 PM</option>
                <option value="14:00">2:00 PM</option>
                <option value="14:15">2:15 PM</option>
                <option value="14:30">2:30 PM</option>
                <option value="14:45">2:45 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="15:15">3:15 PM</option>
                <option value="15:30">3:30 PM</option>
                <option value="15:45">3:45 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="16:15">4:15 PM</option>
                <option value="16:30">4:30 PM</option>
                <option value="16:45">4:45 PM</option>
                <option value="17:00">5:00 PM</option>
                <option value="17:15">5:15 PM</option>
                <option value="17:30">5:30 PM</option>
                <option value="17:45">5:45 PM</option>
                <option value="18:00">6:00 PM</option>
                <option value="18:15">6:15 PM</option>
                <option value="18:30">6:30 PM</option>
                <option value="18:45">6:45 PM</option>
                <option value="19:00">7:00 PM</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-[#3d4d39]">
                Duration
              </span>
              <select
                name="durationMinutes"
                defaultValue="60"
                className={`mt-2 ${inputStyle}`}
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1 hour 30 minutes</option>
                <option value="120">2 hours</option>
              </select>
            </label>

            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-[#3d4d39]">
                Interview Notes
              </span>
              <textarea
                name="notes"
                rows={7}
                placeholder="Add the company, interviewer, meeting link, preparation notes, reminders, or anything else..."
                className={`mt-2 resize-y ${inputStyle}`}
              />
            </label>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/clients/${clientId}`}
              className="rounded-xl border border-[#d7e1d0] bg-white px-6 py-3 text-center text-sm font-semibold text-[#4d6247]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4d6247]"
            >
              Save Interview
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
