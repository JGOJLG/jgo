export default function ZellePayPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f1] px-5 py-10 text-[#243128]">
      <section className="w-full max-w-md rounded-[28px] border border-[#dfe6db] bg-white p-7 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e6eee1] text-lg font-black text-[#53684c]">J</div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#6f8966]">JGO Hire</p>
          <h1 className="mt-2 text-2xl font-bold">Pay with Zelle</h1>
          <p className="mt-3 text-sm leading-6 text-[#708075]">Zelle payments are sent from your bank or credit union app.</p>
        </div>

        <div className="mt-6 rounded-2xl bg-[#eef3ea] p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#708075]">Send payment to</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-[#243128]">908-477-5032</p>
        </div>

        <div className="mt-6 space-y-4 text-sm leading-6 text-[#59685d]">
          <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e6eee1] font-bold text-[#53684c]">1</span><p>Open your bank or credit union app and choose <strong className="text-[#243128]">Zelle</strong>.</p></div>
          <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e6eee1] font-bold text-[#53684c]">2</span><p>Add <strong className="text-[#243128]">908-477-5032</strong> as the recipient.</p></div>
          <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e6eee1] font-bold text-[#53684c]">3</span><p>Send the invoice amount and include your <strong className="text-[#243128]">name in the memo</strong>.</p></div>
        </div>

        <p className="mt-7 rounded-2xl border border-[#dfe6db] bg-[#fbfcf9] p-4 text-center text-xs leading-5 text-[#7b887d]">Zelle has no processing fee. If your bank does not offer Zelle, choose another payment method from your invoice.</p>
      </section>
    </main>
  );
}
