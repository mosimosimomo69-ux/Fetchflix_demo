"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Film, Tv, Radio, Search } from "lucide-react";
import { useSearchModal } from "@/context/SearchContext";

export function MobileDock() {
  const pathname = usePathname();
  const { openSearch } = useSearchModal();

  if (pathname.startsWith("/watch")) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0c0c14]/95 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around py-2">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
            pathname === "/" ? "text-[#e50914]" : "text-white/50"
          }`}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link
          href="/movie"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
            pathname.startsWith("/movie") ? "text-[#e50914]" : "text-white/50"
          }`}
        >
          <Film className="h-5 w-5" />
          <span>Movies</span>
        </Link>

        <Link
          href="/tv"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
            pathname.startsWith("/tv") ? "text-[#e50914]" : "text-white/50"
          }`}
        >
          <Tv className="h-5 w-5" />
          <span>TV Shows</span>
        </Link>

        <Link
          href="/channels"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
            pathname.startsWith("/channels") ? "text-[#e50914]" : "text-white/50"
          }`}
        >
          <Radio className="h-5 w-5" />
          <span>Live</span>
        </Link>

        <button
          onClick={openSearch}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium text-white/50 hover:text-white transition-colors"
        >
          <Search className="h-5 w-5" />
          <span>Search</span>
        </button>
      </div>
    </nav>
  );
}
