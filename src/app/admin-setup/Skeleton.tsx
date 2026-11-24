/** Cartões esqueleto no formato do cartão, enquanto carrega. */
export function ListSkeleton() {
  return (
    <div aria-label="Carregando" role="status" className="flex animate-pulse flex-col gap-3 motion-reduce:animate-none">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-[18px] border border-admin-line bg-white p-3.5">
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-admin-line" />
            <div className="h-6 w-24 rounded-full bg-[#f2edee]" />
          </div>
          <div className="mt-3 h-[70px] rounded-[14px] bg-admin-line" />
          <div className="mt-3 h-3 w-2/3 rounded bg-[#f2edee]" />
        </div>
      ))}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
