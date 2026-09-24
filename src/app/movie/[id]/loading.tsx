export default function MovieLoading() {
  return (
    <div className="min-h-screen bg-[#060608] animate-pulse">
      {/* Hero skeleton */}
      <div className="relative h-[55vh] sm:h-[65vh] min-h-[400px] w-full bg-white/5" />

      {/* Content skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-8 space-y-6">
        {/* Logo / title */}
        <div className="h-12 w-64 rounded-xl bg-white/10" />
        {/* Meta row */}
        <div className="flex gap-3">
          <div className="h-5 w-12 rounded bg-white/10" />
          <div className="h-5 w-16 rounded bg-white/10" />
          <div className="h-5 w-20 rounded bg-white/10" />
        </div>
        {/* Description */}
        <div className="space-y-2 max-w-2xl">
          <div className="h-4 w-full rounded bg-white/8" />
          <div className="h-4 w-5/6 rounded bg-white/8" />
          <div className="h-4 w-4/6 rounded bg-white/8" />
        </div>
        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <div className="h-11 w-32 rounded-full bg-white/10" />
          <div className="h-11 w-32 rounded-full bg-white/5" />
        </div>
        {/* Cast row label */}
        <div className="h-5 w-24 rounded bg-white/10 mt-8" />
        {/* Cast row */}
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[90px] space-y-2">
              <div className="aspect-square w-full rounded-full bg-white/8" />
              <div className="h-3 w-14 mx-auto rounded bg-white/8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
