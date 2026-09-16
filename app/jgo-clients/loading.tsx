export default function Loading() {
  return (
    <section className="min-w-0 flex-1 animate-pulse bg-[#f7f8f3] p-4 sm:p-5 lg:p-8 xl:p-10">
      <div className="h-8 w-44 rounded-lg bg-[#e5e9e1]" />
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <div className="h-40 rounded-2xl border border-[#dfe6db] bg-white" />
        <div className="h-40 rounded-2xl border border-[#dfe6db] bg-white" />
      </div>
      <div className="mt-6 space-y-3 md:hidden">
        {[1, 2, 3].map((item) => <div key={item} className="h-72 rounded-2xl border border-[#dfe6db] bg-white" />)}
      </div>
      <div className="mt-6 hidden h-80 rounded-2xl border border-[#dfe6db] bg-white md:block" />
    </section>
  );
}
