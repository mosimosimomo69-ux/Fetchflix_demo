export default function TVLoading() {
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
        {/* Season tabs skeleton */}
        <div className="flex gap-2 mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-white/8" />
          ))}
        </div>
        {/* Episode list skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center p-3 rounded-xl bg-white/4">
              <div className="aspect-video w-32 flex-shrink-0 rounded-lg bg-white/8" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-white/8" />
                <div className="h-3 w-full rounded bg-white/5" />
                <div className="h-3 w-2/3 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
