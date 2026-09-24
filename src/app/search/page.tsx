import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Search, ChevronLeft } from "lucide-react";
import { MediaCard } from "@/components/media/MediaCard";
import { searchMulti } from "@/lib/api/tmdb";

export const metadata: Metadata = { title: "Search" };

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchMulti(query).catch(() => []) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 space-y-6">
      {/* Header with Red Bar */}
      <div className="flex items-center gap-2.5">
        <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          {query ? (
            <>
              Search Results for <span className="text-[#e50914]">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Search Movies & TV Shows"
          )}
        </h1>
      </div>

      {!query && (
        <p className="text-sm text-white/50">
          Search for movies, TV series, actors, and anime using the search bar above.
        </p>
      )}

      {/* Empty / Not Found Screen (matching screenshot 094706.png) */}
      {query && results.length === 0 && (
        <div className="my-16 max-w-lg mx-auto text-center space-y-5 rounded-2xl border border-white/5 bg-[#12121a] p-8">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white">
            <span>We couldnt find that</span>
            <SearchX className="h-6 w-6 text-white/70" />
          </div>

          <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
            We have searched through our providers and cannot find the media you
            are looking for! We do not host the media and have no control over
            what is available
          </p>

          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-xs font-bold text-black hover:bg-white/90 transition-all shadow-lg"
            >
              Go Back
            </Link>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <>
          <p className="text-xs text-white/40">
            Found {results.length} result{results.length > 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((item) => (
              <MediaCard
                key={`${item.media_type}-${item.id}`}
                item={item}
                variant="poster"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
