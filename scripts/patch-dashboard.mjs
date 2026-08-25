import fs from "node:fs";

const path = "app/page.tsx";
let s = fs.readFileSync(path, "utf8");

if (s.includes("const upcomingMeetings = activeCalendarEvents")) {
  console.log("Dashboard upcoming meetings patch already applied.");
  process.exit(0);
}

const oldLogic = `  const peopleToReachOutTo = leadClients
    .filter(
      (client) =>
        normalize(client.follow_up_status) === "needs follow-up"
    )
    .map((client) => ({
      key: \`lead-client-\${client.id}\`,
      name: client.name || "Unnamed Lead",
      label: client.next_step || "Follow-up needed",
      date: client.due_date,
      priority: "Normal",
      href: \`/clients/\${client.id}\`,
      overdue: Boolean(client.due_date && client.due_date < today),
    }))
    .sort((a, b) => {
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;

      return (a.date || "9999-12-31").localeCompare(
        b.date || "9999-12-31"
      );
    })
    .slice(0, 7);
`;

const newLogic = `  const upcomingMeetings = activeCalendarEvents
    .filter((event) => {
      if (!event.client_id || !event.start_at) return false;

      const type = normalize(event.event_type);
      const title = normalize(event.title);
      const isClientMeeting =
        type === "free 15" ||
        type === "free15" ||
        type === "coaching session" ||
        type === "coaching" ||
        title.includes("free 15") ||
        title.includes("coaching");

      if (!isClientMeeting) return false;

      const easternDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(event.start_at));

      return easternDate >= today;
    })
    .sort((a, b) => (a.start_at || "").localeCompare(b.start_at || ""))
    .slice(0, 7)
    .map((event) => ({
      key: \`meeting-\${event.id}\`,
      name: event.client_id
        ? clientNameById.get(event.client_id) || "Client"
        : "Client",
      label: event.title || event.event_type || "Meeting",
      date: event.start_at,
      href: event.client_id ? \`/clients/\${event.client_id}\` : "/clients",
    }));
`;

if (!s.includes(oldLogic)) {
  throw new Error("Could not find old People to Reach Out To dashboard logic.");
}

s = s.replace(oldLogic, newLogic);

const startMarker = '          <div className="rounded-[28px] border border-white/70 bg-[#eaf0e5]/72';
const endMarker = '        </section>\n\n        <Link\n          href="/revenue/unlock"';
const start = s.indexOf(startMarker);
const end = s.indexOf(endMarker, start);

if (start === -1 || end === -1) {
  throw new Error("Could not find old outreach dashboard card.");
}

const newCard = `          <div className="rounded-[28px] border border-white/70 bg-[#eaf0e5]/72 p-6 shadow-[0_22px_60px_rgba(71,91,66,0.12)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-[#eaf0e5]/88 lg:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8966]">Schedule</p>
                <h3 className="mt-2 text-2xl font-bold text-[#243128]">Upcoming Meetings</h3>
                <p className="mt-1 text-sm text-[#637166]">Free 15s and coaching sessions coming up.</p>
              </div>
              <Link href="/calendar" className="shrink-0 text-sm font-semibold text-[#4d6247]">View calendar</Link>
            </div>

            {upcomingMeetings.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-[#d2ddcd] bg-white/70 p-6 text-center">
                <p className="text-sm font-semibold text-[#3d4d39]">No upcoming meetings</p>
                <p className="mt-2 text-sm text-[#708075]">Scheduled Free 15s and coaching sessions will appear here.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <Link
                    key={meeting.key}
                    href={meeting.href}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#d8e1d3] bg-white px-4 py-4 transition hover:border-[#bdcdb7]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#243128]">{meeting.name}</p>
                      <p className="mt-1 truncate text-xs text-[#708075]">{meeting.label}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="rounded-full bg-[#eef2e9] px-2.5 py-1 text-[11px] font-semibold text-[#5c7454]">
                        {formatTime(meeting.date) || "Scheduled"}
                      </span>
                      <span className="text-[11px] text-[#7d897f]">{formatDate(meeting.date)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
`;

s = s.slice(0, start) + newCard + s.slice(end);
fs.writeFileSync(path, s);
console.log("Patched dashboard with Upcoming Meetings.");
