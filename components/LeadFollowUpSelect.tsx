"use client";

import { updateFollowUpStatus } from "@/app/clients/actions";

const OPTIONS = ["Needs Follow-Up", "No Follow-Up Necessary"];

type Props = {
  clientId: number;
  value: string | null;
};

export default function LeadFollowUpSelect({ clientId, value }: Props) {
  const currentValue = value || "Needs Follow-Up";

  return (
    <form action={updateFollowUpStatus}>
      <input type="hidden" name="clientId" value={clientId} />
      <select
        key={currentValue}
        name="followUpStatus"
        defaultValue={currentValue}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-[#d7e1d0] bg-white px-2 py-1.5 text-xs font-semibold text-[#4d6247] outline-none focus:border-[#9fb294]"
      >
        {OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </form>
  );
}
