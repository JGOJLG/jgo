import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3] p-8">
      <div className="w-full max-w-md rounded-3xl border border-[#dfe6db] bg-white p-10 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7f9975]">
          JGO Hire
        </p>

        <h1 className="mt-3 text-4xl font-bold text-[#2d3c30]">
          JGO OS
        </h1>

        <p className="mt-3 text-[#708075]">
          Sign in to your business command center.
        </p>

        <form action={login} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-semibold text-[#3d4d39]"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-[#d7e1d0] px-4 py-3 outline-none focus:border-[#7f9975]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-semibold text-[#3d4d39]"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-[#d7e1d0] px-4 py-3 outline-none focus:border-[#7f9975]"
            />
          </div>

          {error ? (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-[#647d5b] py-3 font-semibold text-white hover:bg-[#4d6247]"
          >
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}
