import Link from "next/link";
import { notFound } from "next/navigation";

const clients = {
  "jonathan-taylor": {
    name: "Jonathan Taylor",
    initials: "JT",
    email: "jonathan@example.com",
    phone: "(817) 526-1500",
    linkedin: "linkedin.com/in/jonathan-taylor",
    service: "Resume + Cover Letter",
    status: "Revision",
    payment: "Paid",
    amount: "$300",
    nextStep: "Send final resume and cover letter PDFs",
    nextMeeting: "July 18 at 9:30 AM",
    targetRole:
      "Deputy CTO for Artificial Intelligence & Digital Innovation",
    goals:
      "Position Jonathan for executive-level AI, data, and digital innovation leadership opportunities.",
  },
  "ivana-eatmon": {
    name: "Ivana Eatmon",
    initials: "IE",
    email: "ivana@example.com",
    phone: "(555) 234-5678",
    linkedin: "linkedin.com/in/ivana-eatmon",
    service: "Resume Review",
    status: "In Progress",
    payment: "Paid",
    amount: "$250",
    nextStep: "Prepare for interview coaching",
    nextMeeting: "July 20 at 11:00 AM",
    targetRole: "Senior Operations Leadership",
    goals: "Strengthen positioning for senior-level opportunities.",
  },
  "marc-williams": {
    name: "Marc Williams",
    initials: "MW",
    email: "marc@example.com",
    phone: "(555) 345-6789",
    linkedin: "linkedin.com/in/marc-williams",
    service: "Resume + LinkedIn",
    status: "In Progress",
    payment: "Paid",
    amount: "$300",
    nextStep: "Complete LinkedIn optimization",
    nextMeeting: "Not scheduled",
    targetRole: "Technology Leadership",
    goals: "Create consistent positioning across resume and LinkedIn.",
  },
  "sarah-johnson": {
    name: "Sarah Johnson",
    initials: "SJ",
    email: "sarah@example.com",
    phone: "(555) 456-7890",
    linkedin: "linkedin.com/in/sarah-johnson",
    service: "Career Coaching",
    status: "On Hold",
    payment: "Pending",
    amount: "$250",
    nextStep: "Follow up regarding payment",
    nextMeeting: "Pending payment",
    targetRole: "Insurance Account Executive",
    goals: "Refine interview skills and secure a new insurance position.",
  },
};

type ClientId = keyof typeof clients;

const tabs = [
  ["Overview", "#overview"],
  ["Resume", "#resume"],
  ["Cover Letter", "#cover-letter"],
  ["LinkedIn", "#linkedin"],
  ["Interview Prep", "#interview-prep"],
  ["Invoices", "#invoices"],
  ["Notes", "#notes"],
  ["Files", "#files"],
  ["Timeline", "#timeline"],
];

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = clients[id as ClientId];

  if (!client) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f7fb] text-slate-900">
      <div className="mx-auto max-w-7xl p-6 lg:p-10">
        <Link
          href="/clients"
          className="mb-6 inline-block text-sm font-semibold text-purple-700 hover:text-purple-900"
        >
          ← Back to Clients
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-700">
                {client.initials}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold">{client.name}</h1>

                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                    {client.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-500">{client.email}</p>
                <p className="mt-1 text-sm text-slate-500">{client.phone}</p>
                <p className="mt-1 text-sm text-purple-700">
                  {client.linkedin}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-50">
                Edit Client
              </button>

              <button className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700">
                + Add Note
              </button>
            </div>
          </div>
        </section>

        <nav className="sticky top-0 z-10 mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-1">
            {tabs.map(([label, href], index) => (
              <a
                key={label}
                href={href}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  index === 0
                    ? "bg-purple-600 text-white"
                    : "text-slate-600 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <div className="mt-6 space-y-6">
          <section id="overview" className="scroll-mt-24">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="Service" value={client.service} />
              <InfoCard label="Status" value={client.status} purple />
              <InfoCard
                label="Payment"
                value={`${client.payment} · ${client.amount}`}
                green={client.payment === "Paid"}
              />
              <InfoCard label="Next Meeting" value={client.nextMeeting} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                <h2 className="text-xl font-bold">Client Overview</h2>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <DetailBlock
                    label="Target Role"
                    value={client.targetRole}
                  />

                  <DetailBlock label="Current Service" value={client.service} />

                  <div className="sm:col-span-2">
                    <DetailBlock label="Client Goals" value={client.goals} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Next Step</h2>

                <p className="mt-4 rounded-xl bg-purple-50 p-4 text-sm font-semibold leading-6 text-purple-800">
                  {client.nextStep}
                </p>

                <button className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                  Mark Complete
                </button>
              </div>
            </div>
          </section>

          <WorkspaceSection
            id="resume"
            title="Resume"
            description="Track resume versions, revisions, and final deliverables."
            action="+ Upload Resume"
          >
            <FileCard
              name="Jonathan Taylor Resume Draft 1.docx"
              detail="Initial draft · July 14, 2026"
              status="Previous Version"
            />

            <FileCard
              name="Jonathan Taylor Resume Draft 2.docx"
              detail="Revised draft · July 15, 2026"
              status="Current Version"
            />

            <FileCard
              name="JGO Resume Ready Report.pdf"
              detail="Resume analysis and future recommendations"
              status="Ready"
            />
          </WorkspaceSection>

          <WorkspaceSection
            id="cover-letter"
            title="Cover Letter"
            description="Store targeted and general cover-letter versions."
            action="+ Upload Cover Letter"
          >
            <FileCard
              name="Deputy CTO Targeted Cover Letter.docx"
              detail="Aligned with target opportunity"
              status="Current Version"
            />

            <FileCard
              name="Executive Cover Letter Template.docx"
              detail="General director and executive-level template"
              status="Ready"
            />
          </WorkspaceSection>

          <WorkspaceSection
            id="linkedin"
            title="LinkedIn"
            description="Track LinkedIn recommendations, updates, and positioning."
            action="+ Add LinkedIn Task"
          >
            <ChecklistItem
              task="Update headline to reflect AI, data, and innovation leadership"
              complete
            />

            <ChecklistItem
              task="Rewrite About section for executive-level positioning"
              complete
            />

            <ChecklistItem
              task="Update current City of Chattanooga experience"
              complete={false}
            />

            <ChecklistItem
              task="Review Featured section and recommendations"
              complete={false}
            />
          </WorkspaceSection>

          <WorkspaceSection
            id="interview-prep"
            title="Interview Prep"
            description="Keep interview preparation, coaching notes, and resources together."
            action="+ Schedule Session"
          >
            <ResourceCard
              title="JGO CORE Framework"
              detail="Interview response structure and quick-reference guide"
            />

            <ResourceCard
              title="JGO Interview Countdown"
              detail="Preparation schedule for the days leading up to an interview"
            />

            <ResourceCard
              title="Executive Interview Questions"
              detail="Questions focused on AI leadership, public trust, and innovation"
            />
          </WorkspaceSection>

          <WorkspaceSection
            id="invoices"
            title="Invoices and Payments"
            description="Track the service amount, payment status, and invoice history."
            action="+ Create Invoice"
          >
            <div className="rounded-xl border border-slate-200 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">
                    Resume and Cover Letter Package
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Invoice JGO-2026-0715
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-lg font-bold">{client.amount}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      client.payment === "Paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {client.payment}
                  </span>
                </div>
              </div>
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            id="notes"
            title="Notes"
            description="Private coaching and project notes for this client."
            action="+ Add Note"
          >
            <NoteCard
              date="July 15, 2026"
              note="Client wants the resume to place greater emphasis on executive-level AI leadership, enterprise scale, and experience working directly with the Mayor and Cabinet."
            />

            <NoteCard
              date="July 12, 2026"
              note="Discussed target Deputy CTO opportunity, resume strategy, cover-letter positioning, and the importance of showing both technical depth and executive influence."
            />
          </WorkspaceSection>

          <WorkspaceSection
            id="files"
            title="All Files"
            description="A central record of every document associated with this client."
            action="+ Upload File"
          >
            <FileCard
              name="Original Resume.docx"
              detail="Provided by client · July 12, 2026"
              status="Original"
            />

            <FileCard
              name="Resume Draft 2.docx"
              detail="Updated by JGO Hire · July 15, 2026"
              status="Current"
            />

            <FileCard
              name="Targeted Cover Letter.docx"
              detail="Updated by JGO Hire · July 15, 2026"
              status="Current"
            />

            <FileCard
              name="Resume Ready Report.pdf"
              detail="Created by JGO Hire · July 15, 2026"
              status="Ready"
            />
          </WorkspaceSection>

          <section
            id="timeline"
            className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Timeline</h2>
                <p className="mt-1 text-sm text-slate-500">
                  A complete history of the client relationship.
                </p>
              </div>

              <button className="text-sm font-semibold text-purple-700">
                + Add Activity
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <TimelineItem
                title="Revision requested"
                description="Client requested stronger emphasis on enterprise leadership and executive influence."
                date="July 15, 2026"
                color="bg-amber-500"
              />

              <TimelineItem
                title="Resume and cover letter drafts sent"
                description="Updated documents were provided for review."
                date="July 15, 2026"
                color="bg-blue-500"
              />

              <TimelineItem
                title="First resume draft completed"
                description="Initial executive-level resume draft prepared."
                date="July 14, 2026"
                color="bg-purple-600"
              />

              <TimelineItem
                title="Initial consultation completed"
                description="Discussed goals, target opportunity, experience, and project scope."
                date="July 12, 2026"
                color="bg-green-500"
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
  purple = false,
  green = false,
}: {
  label: string;
  value: string;
  purple?: boolean;
  green?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p
        className={`mt-2 font-bold ${
          purple
            ? "text-purple-700"
            : green
            ? "text-green-700"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function WorkspaceSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  description: string;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <button className="text-left text-sm font-semibold text-purple-700">
          {action}
        </button>
      </div>

      <div className="mt-6 grid gap-4">{children}</div>
    </section>
  );
}

function FileCard({
  name,
  detail,
  status,
}: {
  name: string;
  detail: string;
  status: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">{name}</p>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </div>

      <span className="w-fit rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
        {status}
      </span>
    </div>
  );
}

function ChecklistItem({
  task,
  complete,
}: {
  task: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          complete
            ? "bg-green-100 text-green-700"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {complete ? "✓" : ""}
      </div>

      <p
        className={`text-sm ${
          complete ? "text-slate-500 line-through" : "text-slate-700"
        }`}
      >
        {task}
      </p>
    </div>
  );
}

function ResourceCard({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>

      <button className="mt-4 text-sm font-semibold text-purple-700">
        Open Resource
      </button>
    </div>
  );
}

function NoteCard({
  date,
  note,
}: {
  date: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {date}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-700">{note}</p>
    </div>
  );
}

function TimelineItem({
  title,
  description,
  date,
  color,
}: {
  title: string;
  description: string;
  date: string;
  color: string;
}) {
  return (
    <div className="flex gap-4">
      <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${color}`} />

      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        <p className="mt-2 text-xs text-slate-400">{date}</p>
      </div>
    </div>
  );
}