export default function Loading() {
  return (
    <section className="min-w-0 flex-1 animate-pulse bg-[#f7f8f3] p-3 sm:p-6 lg:p-10">
      <div className="h-7 w-28 rounded-lg bg-[#e5e9e1]" />
      <div className="mt-5 h-40 rounded-2xl border border-[#dfe6db] bg-white" />
      <div className="mt-5 space-y-4">
        {[1, 2, 3].map((item) => <div key={item} className="h-48 rounded-2xl border border-[#dfe6db] bg-white sm:h-56" />)}
      </div>
    </section>
  );
}
