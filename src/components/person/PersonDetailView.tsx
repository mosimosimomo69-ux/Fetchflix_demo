"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Calendar,
  MapPin,
  Film,
  Tv,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  ExternalLink,
  Search,
  User,
} from "lucide-react";
import type { PersonDetails, PersonCreditItem } from "@/lib/api/tmdb";
import { profileUrl, posterUrl, wsrvUrl } from "@/lib/api/tmdb";
import { formatRating, getTitle, getYear, isCameoCredit, calculateAge } from "@/lib/utils";

interface PersonDetailViewProps {
  person: PersonDetails;
}

type TabType = "all" | "movie" | "tv" | "cameos";
type SortType = "popularity" | "newest" | "oldest" | "rating";

export function PersonDetailView({ person }: PersonDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [sortBy, setSortBy] = useState<SortType>("popularity");
  const [searchQuery, setSearchQuery] = useState("");
  const [bioExpanded, setBioExpanded] = useState(false);

  const rawCredits = person.combined_credits?.cast || [];

  // Categorize credits
  const movies = useMemo(
    () => rawCredits.filter((c) => (c.media_type || "movie") === "movie"),
    [rawCredits]
  );

  const tvShows = useMemo(
    () => rawCredits.filter((c) => c.media_type === "tv"),
    [rawCredits]
  );

  const cameos = useMemo(
    () => rawCredits.filter((c) => isCameoCredit(c)),
    [rawCredits]
  );

  // Filtered list based on active tab
  const tabCredits = useMemo(() => {
    switch (activeTab) {
      case "movie":
        return movies;
      case "tv":
        return tvShows;
      case "cameos":
        return cameos;
      case "all":
      default:
        return rawCredits;
    }
  }, [activeTab, movies, tvShows, cameos, rawCredits]);

  // Search & Sort filtered list
  const filteredAndSortedCredits = useMemo(() => {
    let list = [...tabCredits];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          getTitle(c).toLowerCase().includes(q) ||
          (c.character && c.character.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortBy === "newest") {
        const yearA = parseInt(getYear(a) || "0", 10);
        const yearB = parseInt(getYear(b) || "0", 10);
        return yearB - yearA;
      }
      if (sortBy === "oldest") {
        const yearA = parseInt(getYear(a) || "9999", 10);
        const yearB = parseInt(getYear(b) || "9999", 10);
        return yearA - yearB;
      }
      if (sortBy === "rating") {
        return (b.vote_average || 0) - (a.vote_average || 0);
      }
      // default: popularity
      return (b.popularity || 0) - (a.popularity || 0);
    });

    return list;
  }, [tabCredits, searchQuery, sortBy]);

  const age = person.birthday ? calculateAge(person.birthday, person.deathday) : null;
  const isDeceased = Boolean(person.deathday);

  return (
    <div className="min-h-screen bg-[#060608] text-white pb-20">
      {/* Background ambient glow based on actor profile */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#e50914]/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Hero Actor Profile Section */}
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 md:px-10 pt-8 sm:pt-10 md:pt-12 pb-10">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
            {/* Profile Avatar Card */}
            <div className="flex-shrink-0 w-full sm:w-64 md:w-72 lg:w-80 mx-auto md:mx-0">
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#14141c] border border-white/10 shadow-2xl shadow-black/80 group">
                {person.profile_path ? (
                  <Image
                    src={wsrvUrl(profileUrl(person.profile_path, "h632"))}
                    alt={person.name}
                    fill
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 288px, 320px"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#14141c] text-white/20">
                    <User className="h-24 w-24 mb-2" />
                    <span className="text-xs uppercase tracking-wider">No Photo</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 pointer-events-none" />
              </div>

              {/* External Social / IMDb Links */}
              <div className="mt-4 flex items-center justify-center gap-2.5 flex-wrap">
                {person.imdb_id && (
                  <a
                    href={`https://www.imdb.com/name/${person.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-[#f5c518] px-3 py-1.5 text-xs font-bold text-black shadow hover:bg-[#e2b616] transition-colors"
                  >
                    <span>IMDb</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {person.external_ids?.instagram_id && (
                  <a
                    href={`https://instagram.com/${person.external_ids.instagram_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    <span>Instagram</span>
                    <ExternalLink className="h-3 w-3 text-white/50" />
                  </a>
                )}

                {person.external_ids?.twitter_id && (
                  <a
                    href={`https://twitter.com/${person.external_ids.twitter_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    <span>X (Twitter)</span>
                    <ExternalLink className="h-3 w-3 text-white/50" />
                  </a>
                )}

                {person.homepage && (
                  <a
                    href={person.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    <span>Website</span>
                    <ExternalLink className="h-3 w-3 text-white/50" />
                  </a>
                )}
              </div>
            </div>

            {/* Profile Info Details */}
            <div className="flex-1 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-4 w-1 rounded-full bg-[#e50914]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e50914]">
                    {person.known_for_department === "Acting"
                      ? person.gender === 1
                        ? "Actress"
                        : "Actor"
                      : person.known_for_department ||
                        (person.gender === 1 ? "Actress" : "Actor")}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  {person.name}
                </h1>
              </div>

              {/* Quick Info Badges Grid */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                {person.birthday && (
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#12121a] px-3.5 py-1.5 text-white/80">
                    <Calendar className="h-3.5 w-3.5 text-[#e50914]" />
                    <span>
                      {isDeceased ? `Born ${person.birthday}` : person.birthday}
                      {age !== null && (
                        <span className="text-white/50 ml-1">
                          ({isDeceased ? `Died at ${age}` : `${age} yrs`})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {person.place_of_birth && (
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#12121a] px-3.5 py-1.5 text-white/80">
                    <MapPin className="h-3.5 w-3.5 text-white/50" />
                    <span className="truncate max-w-[220px] sm:max-w-none">
                      {person.place_of_birth}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#12121a] px-3.5 py-1.5 text-white/80">
                  <Clapperboard className="h-3.5 w-3.5 text-white/50" />
                  <span>{rawCredits.length} Total Credits</span>
                </div>

                {cameos.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-amber-400 font-semibold shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>{cameos.length} Cameos / Special Appearances</span>
                  </div>
                )}
              </div>

              {/* Biography Section with read more toggle */}
              {person.biography && (
                <div className="space-y-2 pt-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">
                    Biography
                  </h3>
                  <div className="relative text-sm text-white/70 leading-relaxed font-normal">
                    <p className={!bioExpanded && person.biography.length > 380 ? "line-clamp-4" : ""}>
                      {person.biography}
                    </p>

                    {person.biography.length > 380 && (
                      <button
                        onClick={() => setBioExpanded(!bioExpanded)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#e50914] hover:text-[#ff2b36] transition-colors"
                      >
                        {bioExpanded ? (
                          <>
                            Show less <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            Read full biography <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filmography & Credits Section */}
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 md:px-10 mt-6 space-y-6">
        {/* Section Header & Toolbar Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="h-6 w-1 rounded-sm bg-[#e50914]" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Filmography & Credits
            </h2>
          </div>

          {/* Navigation Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-[#e50914] text-white shadow-lg shadow-[#e50914]/30"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>All Works ({rawCredits.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("movie")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "movie"
                  ? "bg-[#e50914] text-white shadow-lg shadow-[#e50914]/30"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Movies ({movies.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("tv")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "tv"
                  ? "bg-[#e50914] text-white shadow-lg shadow-[#e50914]/30"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Tv className="h-3.5 w-3.5" />
              <span>TV Shows ({tvShows.length})</span>
            </button>

            {cameos.length > 0 && (
              <button
                onClick={() => setActiveTab("cameos")}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === "cameos"
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-bold"
                    : "bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Cameos ({cameos.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Toolbar: Search filter & Sorting Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search title or character..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-[#12121a] border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#e50914]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-white/40 hidden sm:inline">Sort:</span>
            <div className="flex items-center gap-1 rounded-xl bg-[#12121a] border border-white/10 p-1 text-xs">
              <button
                onClick={() => setSortBy("popularity")}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  sortBy === "popularity"
                    ? "bg-[#e50914] text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => setSortBy("newest")}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  sortBy === "newest"
                    ? "bg-[#e50914] text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy("rating")}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  sortBy === "rating"
                    ? "bg-[#e50914] text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Rating
              </button>
            </div>
          </div>
        </div>

        {/* Credits Cards Grid */}
        {filteredAndSortedCredits.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
            {filteredAndSortedCredits.map((item) => {
              const type = item.media_type || "movie";
              const title = getTitle(item);
              const year = getYear(item);
              const rating = formatRating(item.vote_average);
              const isCameo = isCameoCredit(item);

              return (
                <Link
                  key={`${item.id}-${type}-${item.credit_id || ""}`}
                  href={`/${type}/${item.id}`}
                  className="group block select-none"
                >
                  {/* Thumbnail Poster */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#14141c] border border-white/[0.06] transition-all duration-300 group-hover:border-white/20 group-hover:scale-[1.03] group-hover:shadow-2xl">
                    <Image
                      src={
                        item.poster_path
                          ? wsrvUrl(posterUrl(item.poster_path, "w500"))
                          : "/placeholder.png"
                      }
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

                    {/* Cameo Ribbon Badge */}
                    {isCameo && (
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md bg-amber-500/95 px-2 py-0.5 text-[10px] font-black uppercase text-black shadow-lg backdrop-blur">
                        <Sparkles className="h-2.5 w-2.5 fill-black" />
                        Cameo
                      </div>
                    )}

                    {/* Media Type Badge */}
                    <div className="absolute top-2 right-2 z-10 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/90 backdrop-blur">
                      {type === "tv" ? "TV" : "Movie"}
                    </div>
                  </div>

                  {/* Info Text below card */}
                  <div className="mt-2.5 px-0.5">
                    <h3 className="truncate text-xs sm:text-sm font-bold text-white group-hover:text-[#e50914] transition-colors">
                      {title}
                    </h3>

                    {/* Character name & Cameo indicator */}
                    {item.character && (
                      <p className="truncate text-[11px] text-white/60 font-medium">
                        as <span className={isCameo ? "text-amber-400 font-semibold" : "text-white/80"}>{item.character}</span>
                      </p>
                    )}

                    {/* Meta line */}
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/40">
                      <span className="flex items-center gap-0.5 text-[#e50914] font-semibold">
                        <Star className="h-3 w-3 fill-[#e50914] text-[#e50914]" />
                        {rating}
                      </span>
                      <span>·</span>
                      <span>{year || "—"}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Film className="h-12 w-12 text-white/20 mb-3" />
            <p className="text-sm font-semibold text-white/60">
              No credits found for this filter
            </p>
            <p className="text-xs text-white/30 mt-1">
              Try selecting another category tab or clearing your search term
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
