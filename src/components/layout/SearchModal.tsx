"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSearchModal } from "@/context/SearchContext";
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Play,
  Star,
  Check,
} from "lucide-react";
import type { MediaItem } from "@/lib/api/tmdb";
import { posterUrl, wsrvUrl } from "@/lib/api/tmdb";
import { formatRating, getTitle, getYear, resolveMediaType } from "@/lib/utils";
import { MOVIE_GENRES, TV_GENRES } from "@/lib/constants";

export function SearchModal() {
  const router = useRouter();
  const { isSearchOpen, closeSearch } = useSearchModal();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "movie" | "tv">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setExpandedId(null);
      setFilterOpen(false);
    }
  }, [isSearchOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live search effect with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const url = `/api/search?q=${encodeURIComponent(query)}&type=${filterType}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const list: MediaItem[] = (data.results || []).filter(
            (i: MediaItem) => i.poster_path || i.backdrop_path
          );
          setResults(list);
          if (list.length > 0) {
            setExpandedId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filterType]);

  if (!isSearchOpen) return null;

  const getGenreNames = (item: MediaItem) => {
    const genreList = item.media_type === "tv" ? TV_GENRES : MOVIE_GENRES;
    if (!item.genre_ids || item.genre_ids.length === 0) return "";
    return item.genre_ids
      .map((id) => genreList.find((g) => g.id === id)?.name)
      .filter(Boolean)
      .slice(0, 2)
      .join(", ");
  };

  const handlePlay = (item: MediaItem) => {
    const type = resolveMediaType(item);
    closeSearch();
    router.push(`/${type}/${item.id}?play=true`);
  };

  const handleSeeMore = (item: MediaItem) => {
    const type = resolveMediaType(item);
    closeSearch();
    router.push(`/${type}/${item.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-4">
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={closeSearch}
      />

      {/* Centered Modal Container with reduced width */}
      <div className="relative z-10 w-full max-w-[450px] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Row: "Search", Filter Dropdown, Close button */}
        <div className="flex items-center justify-between pb-2.5">
          <h2 className="text-base font-bold text-white tracking-tight">Search</h2>

          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0e0e14] px-3 text-[11px] font-medium text-white/90 transition-colors hover:border-white/20 hover:bg-[#14141c]"
              >
                <span>
                  {filterType === "all"
                    ? "Movies & TV Shows"
                    : filterType === "movie"
                    ? "Movies"
                    : "TV Shows"}
                </span>
                <ChevronDown
                  className={`h-3 w-3 text-white/50 transition-transform duration-200 ${
                    filterOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>

              {filterOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-40 rounded-xl border border-white/10 bg-[#0e0e14]/98 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setFilterType("all");
                      setFilterOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 text-[11px] rounded-lg transition-colors ${
                      filterType === "all"
                        ? "bg-[#e50914] text-white font-medium shadow-md"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>Movies & TV Shows</span>
                    {filterType === "all" && <Check className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => {
                      setFilterType("movie");
                      setFilterOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 text-[11px] rounded-lg transition-colors mt-0.5 ${
                      filterType === "movie"
                        ? "bg-[#e50914] text-white font-medium shadow-md"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>Movies</span>
                    {filterType === "movie" && <Check className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => {
                      setFilterType("tv");
                      setFilterOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 text-[11px] rounded-lg transition-colors mt-0.5 ${
                      filterType === "tv"
                        ? "bg-[#e50914] text-white font-medium shadow-md"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>TV Shows</span>
                    {filterType === "tv" && <Check className="h-3 w-3" />}
                  </button>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeSearch}
              aria-label="Close search"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0e0e14] text-white/60 transition-colors hover:border-white/20 hover:bg-[#14141c] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Search Input Bar (matching screenshot 094255) */}
        <div className="relative flex h-10 w-full items-center rounded-xl border border-white/[0.08] bg-[#0b0b10] px-3.5 shadow-xl transition-colors focus-within:border-white/20 focus-within:bg-[#0e0e14]">
          <Search className="h-3.5 w-3.5 text-white/50 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-full w-full bg-transparent pl-2.5 pr-7 text-xs sm:text-sm font-normal text-white placeholder:text-white/40 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 rounded-full p-0.5 text-white/40 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Search Results List (matching screenshots 094255 and 094301) */}
        <div className="mt-2.5 max-h-[55vh] overflow-y-auto space-y-2 scrollbar-hide pr-0.5">
          {loading && (
            <div className="py-8 text-center text-[11px] text-white/40">
              Searching...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-8 text-center text-[11px] text-white/40">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading &&
            results.map((item) => {
              const type = resolveMediaType(item);
              const isExpanded = expandedId === item.id;
              const genres = getGenreNames(item);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/[0.07] bg-[#0c0c12]/95 p-3 shadow-lg transition-all hover:border-white/15 hover:bg-[#101018]"
                >
                  {/* Card Header row with poster, title, meta, expand toggle */}
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    {/* Poster Thumbnail */}
                    <div className="relative h-14 w-9.5 sm:h-15 sm:w-10 flex-shrink-0 overflow-hidden rounded-md bg-[#161622] border border-white/[0.06]">
                      <Image
                        src={wsrvUrl(posterUrl(item.poster_path, "w185"))}
                        alt={getTitle(item)}
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    {/* Meta details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-1 hover:text-[#e50914] transition-colors">
                            {getTitle(item)}
                          </h3>

                          {/* Meta Line: Type | Year | Star Rating | Genres */}
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] sm:text-[11px] text-white/45">
                            <span>{type === "tv" ? "TV Show" : "Movie"}</span>
                            <span>|</span>
                            <span>{getYear(item) || "2026"}</span>
                            <span>|</span>
                            <span className="flex items-center gap-0.5 text-[#f5c518] font-medium">
                              <Star className="h-2.5 w-2.5 fill-[#f5c518]" />
                              {formatRating(item.vote_average)}
                            </span>
                            {genres && (
                              <>
                                <span>|</span>
                                <span className="truncate">{genres}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expand / Collapse Chevron */}
                        <div className="p-0.5 text-white/40 hover:text-white transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Section (matching Screenshot 094301) */}
                      {isExpanded && (
                        <div className="mt-2 pt-1 animate-in fade-in duration-150">
                          {/* Overview Synopsis */}
                          {item.overview && (
                            <p className="text-[11px] leading-relaxed text-white/60 line-clamp-3">
                              {item.overview}
                            </p>
                          )}

                          {/* Action Buttons: Play + See more */}
                          <div className="mt-2.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlay(item);
                              }}
                              className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[11px] font-bold text-black shadow-sm transition-all hover:bg-white/90 hover:scale-105 active:scale-95"
                            >
                              <Play className="h-3 w-3 fill-black" />
                              Play
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSeeMore(item);
                              }}
                              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:border-white/20"
                            >
                              <svg className="h-3 w-3 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <circle cx="12" cy="12" r="9" strokeWidth="2" />
                                <circle cx="12" cy="12" r="2" fill="currentColor" />
                              </svg>
                              See more
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
