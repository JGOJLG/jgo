"use client";

import { useFormStatus } from "react-dom";

export default function LoginSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#647d5b] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#4d6247] disabled:cursor-wait disabled:opacity-80"
    >
      {pending && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {pending ? "Signing in…" : "Sign In"}
    </button>
  );
}
