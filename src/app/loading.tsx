export default function Loading() {
  return (
    <div>
      <div className="h-[70vh] min-h-[420px] w-full animate-pulse bg-gradient-to-b from-white/5 to-transparent" />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <section key={i}>
            <div className="mb-3 h-5 w-40 animate-pulse rounded bg-white/10" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 7 }).map((_, j) => (
                <div
                  key={j}
                  className="aspect-[2/3] w-[140px] flex-shrink-0 animate-pulse rounded-xl bg-white/5 md:w-[170px]"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
