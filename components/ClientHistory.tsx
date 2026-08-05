type HistoryItem = {
  date: string;
  label: string;
};

type Props = {
  items: HistoryItem[];
};

export default function ClientHistory({ items }: Props) {
  return (
    <section className="rounded-2xl border border-[#dfe6db] bg-white p-6">
      <h2 className="text-xl font-bold text-[#243128]">Dates</h2>

      <div className="mt-4 space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-[#f0f3ee] pb-2 text-sm last:border-b-0"
          >
            <span className="font-semibold text-[#243128]">
              {new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              :
            </span>
            <span className="text-[#708075]">{item.label}</span>
          </div>
        ))}

        {items.length === 0 ? (
          <p className="text-sm text-[#708075]">No history yet.</p>
        ) : null}
      </div>
    </section>
  );
}
