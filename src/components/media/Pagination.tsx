import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  const max = Math.min(totalPages, 500);
  if (max <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-full border border-white/5 px-5 py-2 text-sm text-white/25">
          Previous
        </span>
      )}
      <span className="text-sm text-white/60">
        Page {page} of {max}
      </span>
      {page < max ? (
        <Link
          href={buildHref(page + 1)}
          className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-full border border-white/5 px-5 py-2 text-sm text-white/25">
          Next
        </span>
      )}
    </nav>
  );
}
