"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ArrowUpDown,
  Download,
  Check,
  Clock,
  Calendar,
  Film,
  Play,
  SkipForward,
  X,
} from "lucide-react";
import type { Episode, SeasonSummary } from "@/lib/api/tmdb";
import { stillUrl, wsrvUrl } from "@/lib/api/tmdb";

interface SeasonBrowserProps {
  tvId: number;
  seasons: SeasonSummary[];
  onPlayEpisode?: (season: number, episode: number) => void;
}

function getReleaseStatus(airDate?: string | null) {
  if (!airDate) {
    return {
      isReleased: false,
      releaseText: "Release date TBA",
    };
  }

  const releaseDate = new Date(airDate + "T00:00:00");
  const now = new Date();

  // If the release date is in the future
  if (releaseDate.getTime() > now.getTime()) {
    const diffTime = releaseDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: releaseDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    };
    const formattedDate = releaseDate.toLocaleDateString("en-US", options);

    const relativeText =
      diffDays === 1
        ? "Releases tomorrow"
        : diffDays <= 7
        ? `Releases in ${diffDays} days (${formattedDate})`
        : `Releasing ${formattedDate}`;

    return {
      isReleased: false,
      releaseText: relativeText,
      formattedDate,
    };
  }

  return {
    isReleased: true,
    releaseText: airDate,
  };
}

export function SeasonBrowser({ tvId, seasons, onPlayEpisode }: SeasonBrowserProps) {
  const valid = seasons.filter((s) => s.season_number > 0 && s.episode_count > 0);
  const [selected, setSelected] = useState(valid[0]?.season_number ?? 1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [autoplayNext, setAutoplayNext] = useState<boolean>(true);

  // Restore preferred autoplay next setting from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fetchflix_autoplay_next");
      if (saved !== null) {
        setAutoplayNext(saved === "true");
      }
    } catch {}
  }, []);

  const toggleAutoplayNext = () => {
    setAutoplayNext((prev) => {
      const nextVal = !prev;
      try {
        localStorage.setItem("fetchflix_autoplay_next", String(nextVal));
      } catch {}
      return nextVal;
    });
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSeasonDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/season?tvId=${tvId}&season=${selected}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ episodes: Episode[] }>;
      })
      .then((data) => {
        if (!cancelled) {
          setEpisodes(data.episodes ?? []);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEpisodes([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tvId, selected]);

  if (valid.length === 0) return null;

  const currentSeasonObj = valid.find((s) => s.season_number === selected) || valid[0];

  const onSelect = (seasonNumber: number) => {
    setSelected(seasonNumber);
    setSeasonDropdownOpen(false);
    setLoading(true);
  };

  // Filter & Sort Episodes
  const filteredEpisodes = episodes
    .filter((ep) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        ep.name.toLowerCase().includes(q) ||
        (ep.overview && ep.overview.toLowerCase().includes(q)) ||
        String(ep.episode_number).includes(q)
      );
    })
    .sort((a, b) =>
      sortAsc
        ? a.episode_number - b.episode_number
        : b.episode_number - a.episode_number
    );

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      {/* 1. Header with Red Bar matching Screenshot 2026-08-21 154244.png */}
      <div className="flex items-center gap-2.5">
        <span className="h-6 w-1 rounded-sm bg-[#e50914]" />
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Episodes
        </h2>
      </div>

      {/* 2. Controls Toolbar: Season Dropdown + Unified Search & Next + Sort Button */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Season Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
            className="flex h-10 items-center justify-between gap-2.5 rounded-xl border border-[#e50914]/40 bg-[#2d0e12] hover:bg-[#3d1217] px-3.5 text-xs sm:text-sm font-semibold text-[#ff4c53] shadow-md transition-all active:scale-95 select-none cursor-pointer"
          >
            <span>{currentSeasonObj?.name || `Season ${selected}`}</span>
            <ChevronDown
              className={`h-4 w-4 text-[#ff4c53] transition-transform duration-200 ${
                seasonDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {seasonDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 z-50 w-52 rounded-2xl border border-white/10 bg-[#14141c]/98 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              {valid.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelect(s.season_number)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                    s.season_number === selected
                      ? "bg-[#e50914]/20 text-white font-semibold"
                      : "text-zinc-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>
                    {s.name} ({s.episode_count} eps)
                  </span>
                  {s.season_number === selected && (
                    <Check className="h-3.5 w-3.5 text-[#e50914]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Unified Search & Next (Autoplay) Button Container matching Screenshot */}
        <div className="flex items-center bg-[#14141c] border border-white/10 hover:border-white/20 focus-within:border-white/30 rounded-xl h-10 px-3 gap-2.5 transition-all shadow-sm flex-1 max-w-sm sm:max-w-md">
          {/* Search icon + input */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="h-4 w-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white placeholder-zinc-500 text-xs sm:text-sm outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-zinc-500 hover:text-white cursor-pointer mr-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Next button + Autoplay Toggle Switch */}
          <button
            type="button"
            onClick={toggleAutoplayNext}
            role="switch"
            aria-checked={autoplayNext}
            title={autoplayNext ? "Autoplay Next: Enabled" : "Autoplay Next: Disabled"}
            aria-label="Toggle autoplay next episode"
            className="flex items-center gap-1.5 shrink-0 pl-2.5 border-l border-white/10 cursor-pointer select-none group"
          >
            <SkipForward className="h-3.5 w-3.5 text-zinc-300 group-hover:text-white transition-colors" />
            <div className="w-8 h-4.5 rounded-full p-0.5 bg-[#383844] group-hover:bg-[#444452] transition-colors relative flex items-center">
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  autoplayNext ? "translate-x-3.5" : "translate-x-0"
                }`}
              />
            </div>
          </button>
        </div>

        {/* Sort Order Button */}
        <button
          type="button"
          onClick={() => setSortAsc(!sortAsc)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#14141c] text-white/70 shadow-sm transition-all hover:border-white/20 hover:bg-[#1a1a24] hover:text-white cursor-pointer"
          title={sortAsc ? "Sort Ascending (1-N)" : "Sort Descending (N-1)"}
          aria-label="Sort Episodes"
        >
          <ArrowUpDown className="h-4 w-4" />
        </button>
      </div>

      {/* 3. Episodes List with increased card size & reduced vertical gap */}
      {loading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 sm:h-28 animate-pulse rounded-xl bg-white/[0.04] border border-white/[0.05]"
            />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          Failed to load episodes. Try another season.
        </p>
      ) : filteredEpisodes.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/50">
          No episodes found matching &quot;{searchQuery}&quot;.
        </p>
      ) : (
        <div className="space-y-1.5 w-full">
          {filteredEpisodes.map((ep) => {
            const release = getReleaseStatus(ep.air_date);

            const cardContent = (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-5 min-w-0 flex-1">
                {/* Thumbnail Container with Episode Badge */}
                <div className="relative aspect-[16/9] w-full sm:w-48 md:w-52 sm:min-w-[192px] md:min-w-[208px] shrink-0 overflow-hidden rounded-lg bg-[#161622] border border-white/[0.06]">
                  {ep.still_path ? (
                    <Image
                      src={wsrvUrl(stillUrl(ep.still_path))}
                      alt={ep.name || `Episode ${ep.episode_number}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 208px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#101018] p-4">
                      <div className="relative h-6 w-20 opacity-25 transition-opacity group-hover:opacity-35">
                        <Image
                          src="/logo.png"
                          alt="Cineby"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  {/* Episode Number Badge (bottom left corner) */}
                  <div className="absolute bottom-1.5 left-1.5 flex h-5 min-w-5 items-center justify-center rounded bg-black/85 px-1.5 text-xs font-bold text-white backdrop-blur-md border border-white/10 shadow">
                    {ep.episode_number}
                  </div>

                  {/* Outlined Unreleased Tag Overlay on Thumbnail */}
                  {!release.isReleased && (
                    <div className="absolute top-1.5 right-1.5 rounded border border-white/30 bg-black/60 text-white/90 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider backdrop-blur-md">
                      Upcoming
                    </div>
                  )}
                </div>

                {/* Episode Details */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-normal text-white group-hover:text-[#e50914] transition-colors line-clamp-1">
                    {ep.name || `Episode ${ep.episode_number}`}
                  </h3>

                  {/* Runtime or Not Released Yet Banner in light gray */}
                  {release.isReleased ? (
                    <p className="mt-0.5 text-xs font-medium text-white/50">
                      {ep.runtime ? `${ep.runtime} min` : "48 min"}
                    </p>
                  ) : (
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400 font-normal">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span>Not released yet · {release.releaseText}</span>
                    </div>
                  )}

                  {ep.overview && (
                    <p className="mt-1 text-xs sm:text-sm text-white/70 leading-relaxed line-clamp-2">
                      {ep.overview}
                    </p>
                  )}
                </div>
              </div>
            );

            if (release.isReleased) {
              return (
                <Link
                  key={ep.id}
                  href={`/tv/${tvId}?play=true&season=${ep.season_number}&episode=${ep.episode_number}`}
                  onClick={(e) => {
                    if (onPlayEpisode) {
                      e.preventDefault();
                      onPlayEpisode(ep.season_number, ep.episode_number);
                    }
                  }}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4.5 rounded-xl border border-white/[0.06] bg-[#0c0c14]/90 p-3 sm:p-3.5 md:p-4 transition-all hover:border-[#e50914]/40 hover:bg-[#12121c] shadow-md cursor-pointer"
                  title={`Play Season ${ep.season_number} Episode ${ep.episode_number}: ${ep.name || ""}`}
                >
                  {cardContent}
                  {/* Right Side: Play Action Button */}
                  <div className="hidden sm:flex shrink-0 items-center justify-center h-10 w-10 rounded-full bg-white/10 group-hover:bg-[#e50914] text-white transition-all transform group-hover:scale-105 shadow-md">
                    <Play className="h-4 w-4 fill-white ml-0.5" />
                  </div>
                </Link>
              );
            }

            return (
              <div
                key={ep.id}
                onClick={() =>
                  alert(
                    `Episode ${ep.episode_number} ("${ep.name}") has not aired yet. It is scheduled to release on ${
                      release.formattedDate || release.releaseText
                    }.`
                  )
                }
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4.5 rounded-xl border border-white/[0.04] bg-[#09090e]/80 p-3 sm:p-3.5 md:p-4 opacity-80 cursor-pointer hover:border-white/10 hover:bg-[#0e0e16] shadow-sm transition-all"
                title={`Not released yet. ${release.releaseText}`}
              >
                {cardContent}
                {/* Right Side: Schedule / Calendar indicator in light gray */}
                <div className="hidden sm:flex shrink-0 pr-2 text-gray-400/60 group-hover:text-gray-300 transition-colors">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
