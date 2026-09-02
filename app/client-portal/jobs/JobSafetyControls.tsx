"use client";

import { deleteJob, resetJobs, restoreJob } from "../actions";

export function ArchiveJobButton({ id, company }: { id: number; company: string }) {
  return <form action={deleteJob} onSubmit={(event)=>{if(!window.confirm(`Are you sure you want to remove ${company || "this job"}? It will be archived and can be restored later.`))event.preventDefault();}}><input type="hidden" name="id" value={id}/><button className="rounded-lg px-2 py-2 text-xs font-bold text-[#9a554d]">Delete</button></form>;
}

export function ResetTrackerButton({ count }: { count: number }) {
  if(!count)return null;
  return <form action={resetJobs} onSubmit={(event)=>{if(!window.confirm(`Are you sure you want to reset the tracker? All ${count} active job${count===1?"":"s"} will be moved to Archived. Nothing will be permanently deleted.`))event.preventDefault();}}><button className="rounded-xl border border-[#d9b9b3] bg-white px-4 py-2 text-sm font-bold text-[#8b4f48]">Reset tracker</button></form>;
}

export function RestoreJobButton({ id }: { id: number }) {
  return <form action={restoreJob}><input type="hidden" name="id" value={id}/><button className="rounded-lg border border-[#cbd8c4] bg-white px-3 py-2 text-xs font-bold text-[#52684d]">Restore</button></form>;
}
