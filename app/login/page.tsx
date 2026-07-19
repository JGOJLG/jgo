"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] flex items-center justify-center p-8">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#dfe6db] shadow-xl p-10">
        <p className="text-xs uppercase tracking-[0.3em] text-[#7f9975] font-semibold">
          JGO Hire
        </p>

        <h1 className="mt-3 text-4xl font-bold text-[#2d3c30]">
          JGO OS
        </h1>

        <p className="mt-3 text-[#708075]">
          Sign in to your business command center.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-semibold text-[#3d4d39]">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d7e1d0] px-4 py-3 outline-none focus:border-[#7f9975]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#3d4d39]">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d7e1d0] px-4 py-3 outline-none focus:border-[#7f9975]"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-[#647d5b] py-3 font-semibold text-white hover:bg-[#4d6247]"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}