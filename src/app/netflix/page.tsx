"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Film,
  Tv,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Clapperboard,
} from "lucide-react";
import { MediaSlider } from "@/components/media/MediaSlider";
import { MediaCard } from "@/components/media/MediaCard";
import { NetflixTop10Row } from "@/components/media/NetflixTop10Row";
import type { MediaItem } from "@/lib/api/tmdb";
import { backdropUrl, logoUrl, wsrvUrl } from "@/lib/api/tmdb";
import { getTitle, resolveMediaType } from "@/lib/utils";
import { COUNTRIES, NETFLIX_GENRES, getStreamingService } from "@/lib/constants";
import { useSearchModal } from "@/context/SearchContext";

const NETFLIX_SERVICE = getStreamingService("netflix")!;

type TypeFilter = "tv" | "movie" | "all";

interface Top10Item {
  rank: number;
  weeks: number;
  title: string;
  item: MediaItem | null;
}

interface CategoryRow {
  id: string;
  label: string;
  items: MediaItem[];
}

const TYPE_TABS: { key: TypeFilter; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { key: "tv", label: "TV Shows", icon: <Tv className="h-3.5 w-3.5" /> },
  { key: "movie", label: "Movies", icon: <Film className="h-3.5 w-3.5" /> },
];

export default function NetflixPage() {
  const { openSearch } = useSearchModal();
  const [tvTop10, setTvTop10] = useState<Top10Item[]>([]);
  const [movieTop10, setMovieTop10] = useState<Top10Item[]>([]);
  const [tvDateRange, setTvDateRange] = useState<string | null>(null);
  const [movieDateRange, setMovieDateRange] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [country, setCountry] = useState("IN");
  const [genre, setGenre] = useState("all");
  const [isScrolled, setIsScrolled] = useState(false);

  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [genreOpen, setGenreOpen] = useState(false);
  const [genreSearch, setGenreSearch] = useState("");

  const bannerCountryDropdownRef = useRef<HTMLDivElement>(null);
  const stickyCountryDropdownRef = useRef<HTMLDivElement>(null);
  const bannerGenreDropdownRef = useRef<HTMLDivElement>(null);
  const stickyGenreDropdownRef = useRef<HTMLDivElement>(null);

  const bannerCountrySearchInputRef = useRef<HTMLInputElement>(null);
  const stickyCountrySearchInputRef = useRef<HTMLInputElement>(null);
  const bannerGenreSearchInputRef = useRef<HTMLInputElement>(null);
  const stickyGenreSearchInputRef = useRef<HTMLInputElement>(null);

  const bannerToolbarRef = useRef<HTMLDivElement>(null);

  const selectedCountry =
    COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];
  const selectedGenre =
    NETFLIX_GENRES.find((g) => g.id === genre) || NETFLIX_GENRES[0];

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredGenres = NETFLIX_GENRES.filter((g) =>
    g.name.toLowerCase().includes(genreSearch.toLowerCase())
  );

  const [bannerIndex, setBannerIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  const featured =
    typeFilter === "movie"
      ? movieTop10[0] ||
        tvTop10[0] ||
        (categories[0]?.items[0]
          ? {
              rank: 1,
              weeks: 1,
              title: getTitle(categories[0].items[0]),
              item: categories[0].items[0],
            }
          : null)
      : tvTop10[0] ||
        movieTop10[0] ||
        (categories[0]?.items[0]
          ? {
              rank: 1,
              weeks: 1,
              title: getTitle(categories[0].items[0]),
              item: categories[0].items[0],
            }
          : null);

  const bannerItems = useMemo(() => {
    const items: { item: MediaItem; rank?: number; label?: string }[] = [];
    const sourceTop10 =
      typeFilter === "movie"
        ? movieTop10
        : typeFilter === "tv"
        ? tvTop10
        : [...tvTop10.slice(0, 5), ...movieTop10.slice(0, 5)];

    for (const t of sourceTop10) {
      if (t.item) items.push({ item: t.item, rank: t.rank, label: t.title });
    }

    if (items.length < 5) {
      for (const cat of categories.slice(0, 3)) {
        for (const it of cat.items.slice(0, 3)) {
          if (items.length >= 10) break;
          if (!items.some((x) => x.item.id === it.id)) {
            items.push({ item: it, label: cat.label });
          }
        }
      }
    }
    return items;
  }, [typeFilter, tvTop10, movieTop10, categories]);

  const [bannerMedia, setBannerMedia] = useState<
    Record<number, { logo: string | null; backdrop: string | null }>
  >({});

  useEffect(() => {
    if (!bannerItems.length) return;
    bannerItems.forEach(({ item }) => {
      if (!item?.id || bannerMedia[item.id]) return;
      const type = resolveMediaType(item);
      fetch(`/api/images?type=${type}&id=${item.id}`)
        .then((r) =>
          r.ok
            ? (r.json() as Promise<{
                logo_path?: string | null;
                backdrop_path?: string | null;
              }>)
            : Promise.resolve({ logo_path: null, backdrop_path: null })
        )
        .then((d) => {
          setBannerMedia((prev) => {
            if (prev[item.id]) return prev;
            return {
              ...prev,
              [item.id]: {
                logo: d.logo_path || (item as MediaItem & { logo_path?: string }).logo_path || null,
                backdrop: d.backdrop_path || null,
              },
            };
          });
        })
        .catch(() => {
          setBannerMedia((prev) => ({
            ...prev,
            [item.id]: { logo: null, backdrop: null },
          }));
        });
    });
  }, [bannerItems, bannerMedia]);

  const nextSlide = useCallback(() => {
    if (bannerItems.length < 2) return;
    setBannerIndex((prev) => (prev + 1) % bannerItems.length);
  }, [bannerItems.length]);

  const prevSlide = useCallback(() => {
    if (bannerItems.length < 2) return;
    setBannerIndex((prev) => (prev - 1 + bannerItems.length) % bannerItems.length);
  }, [bannerItems.length]);

  useEffect(() => {
    setBannerIndex(0);
  }, [typeFilter, country, genre]);

  useEffect(() => {
    if (bannerItems.length < 2 || isHeroPaused) return;
    const interval = setInterval(nextSlide, 8000);
    return () => clearInterval(interval);
  }, [bannerItems.length, isHeroPaused, nextSlide]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideCountry =
        (bannerCountryDropdownRef.current && bannerCountryDropdownRef.current.contains(target)) ||
        (stickyCountryDropdownRef.current && stickyCountryDropdownRef.current.contains(target));
      if (!insideCountry) {
        setCountryOpen(false);
        setCountrySearch("");
      }

      const insideGenre =
        (bannerGenreDropdownRef.current && bannerGenreDropdownRef.current.contains(target)) ||
        (stickyGenreDropdownRef.current && stickyGenreDropdownRef.current.contains(target));
      if (!insideGenre) {
        setGenreOpen(false);
        setGenreSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (countryOpen) {
      const timer = setTimeout(() => {
        const input = isScrolled
          ? stickyCountrySearchInputRef.current
          : bannerCountrySearchInputRef.current;
        input?.focus({ preventScroll: true });
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [countryOpen, isScrolled]);

  useEffect(() => {
    if (genreOpen) {
      const timer = setTimeout(() => {
        const input = isScrolled
          ? stickyGenreSearchInputRef.current
          : bannerGenreSearchInputRef.current;
        input?.focus({ preventScroll: true });
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [genreOpen, isScrolled]);

  useEffect(() => {
    setCountryOpen(false);
    setCountrySearch("");
    setGenreOpen(false);
    setGenreSearch("");
  }, [isScrolled]);

  const fetchAll = useCallback(
    async (type: TypeFilter, countryCode: string, genreCode: string) => {
      setLoading(true);
      try {
        const [top10Res, catRes] = await Promise.all([
          fetch(
            `/api/netflix/top10?country=${countryCode}&type=${type}&genre=${genreCode}`
          ),
          fetch(
            `/api/netflix/categories?country=${countryCode}&type=${type}&genre=${genreCode}`
          ),
        ]);
        const top10Data = await top10Res.json();
        const catData = await catRes.json();

        setTvTop10(top10Data.tv?.results || []);
        setTvDateRange(top10Data.tv?.dateRange || null);
        setMovieTop10(top10Data.movies?.results || []);
        setMovieDateRange(top10Data.movies?.dateRange || null);
        setCategories(catData.categories || []);
      } catch {
        setTvTop10([]);
        setMovieTop10([]);
        setTvDateRange(null);
        setMovieDateRange(null);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchAll(typeFilter, country, genre);
  }, [typeFilter, country, genre, fetchAll]);

  const handleCountrySelect = (code: string) => {
    setCountry(code);
    setCountryOpen(false);
    setCountrySearch("");
  };

  const handleGenreSelect = (id: string) => {
    setGenre(id);
    setGenreOpen(false);
    setGenreSearch("");
  };

  useEffect(() => {
    const el = bannerToolbarRef.current;
    if (!el) {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 600);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only show sticky topbar when the banner toolbar (All / TV Shows / Movies) is no longer visible on screen
        setIsScrolled(!entry.isIntersecting && entry.boundingClientRect.top <= 0);
      },
      {
        threshold: 0,
        rootMargin: "0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, bannerItems.length]);

  const pillBase =
    "flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold transition-all border border-white/10 text-white/60 hover:bg-white/10 hover:text-white";
  const pillBg = NETFLIX_SERVICE.bgSecondary;

  const showTvTop10 = typeFilter === "all" || typeFilter === "tv";
  const showMovieTop10 = typeFilter === "all" || typeFilter === "movie";

  const firstHalf = categories.slice(0, 3);
  const secondHalf = categories.slice(3);

  return (
    <div className="min-h-screen bg-[#0a0a0f]" style={{ backgroundColor: NETFLIX_SERVICE.bgPrimary }}>
      {/* Hero Banner - Full image with bottom gradient */}
      <div
        className="group/hero relative h-[80vh] sm:h-[86vh] md:h-[90vh] lg:h-[94vh] min-h-[640px] max-h-[960px] w-full z-30 select-none overflow-hidden"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        {loading && bannerItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-10 w-10 text-[#e50914] animate-spin" />
          </div>
        ) : bannerItems.length > 0 ? (
          <>
            {/* Background Slides (Layered smooth cross-fade with Ken Burns zoom) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {bannerItems.map(({ item }, idx) => {
                const isActive = idx === bannerIndex;
                const media = bannerMedia[item.id];
                const imgPath =
                  media?.backdrop ||
                  (item as MediaItem & { still_path?: string | null }).still_path ||
                  item.backdrop_path ||
                  item.poster_path;

                if (!imgPath) return null;

                return (
                  <div
                    key={`netflix-bg-${item.id}`}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-[opacity] ${
                      isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    <Image
                      src={wsrvUrl(backdropUrl(imgPath, "original"), 90)}
                      alt={getTitle(item)}
                      fill
                      priority={idx === 0}
                      className={`object-cover object-center ${
                        isActive ? "hero-kenburns" : ""
                      }`}
                      unoptimized
                    />
                  </div>
                );
              })}

              {/* Single bottom fade keeps the image clean while UI stays readable */}
              <div className="absolute inset-0 z-15 pointer-events-none bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 via-20% to-transparent to-45%" />
            </div>

            {/* Previous / Next Arrow Chevrons (visible on hover on desktop) */}
            {bannerItems.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  className="hidden md:flex absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-40 h-11 w-11 rounded-full bg-black/50 hover:bg-black/85 text-white items-center justify-center border border-white/15 backdrop-blur-md opacity-0 group-hover/hero:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-xl"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  className="hidden md:flex absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 h-11 w-11 rounded-full bg-black/50 hover:bg-black/85 text-white items-center justify-center border border-white/15 backdrop-blur-md opacity-0 group-hover/hero:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-xl"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Content positioned close to the bottom of the image */}
            <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-6 md:pb-7 w-full z-30 pointer-events-none">
              {/* Stacked animated slides text content with smooth cross-fade and subtle lift */}
              <div className="relative min-h-[140px] sm:min-h-[160px] md:min-h-[180px] max-w-xl">
                {bannerItems.map(({ item, rank }, idx) => {
                  const isActive = idx === bannerIndex;
                  const media = bannerMedia[item.id];
                  const logo = media?.logo;

                  return (
                    <div
                      key={`netflix-text-${item.id}`}
                      className={`transition-all duration-700 ease-out will-change-[opacity,transform] ${
                        isActive
                          ? "opacity-100 translate-y-0 relative z-20 pointer-events-auto"
                          : "opacity-0 translate-y-2 absolute inset-0 z-10 pointer-events-none"
                      }`}
                    >
                      <Link
                        href={`/${resolveMediaType(item)}/${item.id}?play=true`}
                        className="block group/banner cursor-pointer max-w-xl"
                        aria-label={`Play ${getTitle(item)}`}
                      >
                        <div className="flex items-center gap-2 mb-2 sm:mb-2.5 flex-wrap">
                          {genre !== "all" ? (
                            <span className="bg-[#e50914] text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded tracking-wide uppercase">
                              {selectedGenre.name}
                            </span>
                          ) : rank ? (
                            <span className="bg-[#e50914] text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded tracking-wide">
                              #{rank}
                            </span>
                          ) : (
                            <span className="bg-[#e50914] text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded tracking-wide uppercase">
                              Netflix
                            </span>
                          )}
                          <span className="text-white/90 text-xs sm:text-sm font-semibold tracking-wider uppercase">
                            NETFLIX {genre !== "all" ? selectedGenre.name : "TOP 10"}
                          </span>
                          <span className="text-white/40 text-xs">|</span>
                          <span className="text-white/50 text-[10px] sm:text-xs">
                            {selectedCountry.flag} {selectedCountry.name}
                          </span>
                          {genre === "all" && (tvDateRange || movieDateRange) && (
                            <>
                              <span className="text-white/40 text-xs">|</span>
                              <span className="text-white/40 text-[10px] sm:text-xs">
                                {tvDateRange || movieDateRange}
                              </span>
                            </>
                          )}
                        </div>

                        {logo ? (
                          <div className="relative h-12 sm:h-16 md:h-20 w-auto max-w-[240px] sm:max-w-[320px] md:max-w-[400px] mb-1.5 sm:mb-2 transition-transform duration-300 group-hover/banner:scale-105">
                            <Image
                              src={wsrvUrl(logoUrl(logo, "w500"), 95)}
                              alt={getTitle(item)}
                              fill
                              className="object-contain object-left drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-1.5 sm:mb-2 tracking-tight leading-tight group-hover/banner:text-white/90 transition-colors">
                            {getTitle(item)}
                          </h1>
                        )}

                        <p className="text-xs sm:text-sm md:text-base text-white/70 line-clamp-2 sm:line-clamp-3 max-w-xl">
                          {item.overview}
                        </p>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Toolbar Controls on Banner Image below description (Search icon hidden here) */}
              <div ref={bannerToolbarRef} className="mt-3.5 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full pointer-events-auto">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Country Dropdown */}
                  <div className="relative" ref={bannerCountryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setCountryOpen(!countryOpen);
                        setGenreOpen(false);
                      }}
                      className={pillBase}
                      style={{ backgroundColor: pillBg }}
                    >
                      <span className="text-sm leading-none">
                        {selectedCountry.flag}
                      </span>
                      <span>{selectedCountry.name}</span>
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          countryOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {!isScrolled && countryOpen && (
                      <div
                        className="absolute top-full left-0 mt-2 w-64 sm:w-72 rounded-xl border border-white/15 bg-[#14141c] shadow-2xl shadow-black/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="p-2 border-b border-white/10">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                            <input
                              ref={bannerCountrySearchInputRef}
                              type="text"
                              placeholder="Search countries..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#e50914]/60"
                            />
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto scrollbar-thin">
                          {filteredCountries.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleCountrySelect(c.code)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                                country === c.code
                                  ? "bg-[#e50914] text-white font-bold"
                                  : "text-white/70 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <span className="text-base">{c.flag}</span>
                              <span className="font-medium">{c.name}</span>
                              <span className="ml-auto text-[10px] text-white/40">
                                {c.code}
                              </span>
                            </button>
                          ))}
                          {filteredCountries.length === 0 && (
                            <div className="px-3 py-4 text-center text-xs text-white/30">
                              No countries found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Genres Dropdown */}
                  <div className="relative" ref={bannerGenreDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setGenreOpen(!genreOpen);
                        setCountryOpen(false);
                      }}
                      className={`${pillBase} ${
                        genre !== "all"
                          ? "border-[#e50914]/50 text-white"
                          : ""
                      }`}
                      style={{
                        backgroundColor:
                          genre !== "all" ? "rgba(229,9,20,0.1)" : pillBg,
                      }}
                    >
                      <Clapperboard
                        className={`h-3.5 w-3.5 ${
                          genre !== "all" ? "text-[#e50914]" : "text-white/60"
                        }`}
                      />
                      <span>{selectedGenre.name}</span>
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          genreOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {!isScrolled && genreOpen && (
                      <div className="absolute top-full left-0 mt-2 w-56 sm:w-64 rounded-xl border border-white/15 bg-[#14141c] shadow-2xl shadow-black/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-2 border-b border-white/10">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                            <input
                              ref={bannerGenreSearchInputRef}
                              type="text"
                              placeholder="Search genres..."
                              value={genreSearch}
                              onChange={(e) => setGenreSearch(e.target.value)}
                              className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#e50914]/60"
                            />
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto scrollbar-thin">
                          {filteredGenres.map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => handleGenreSelect(g.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                                genre === g.id
                                  ? "bg-[#e50914] text-white font-bold"
                                  : "text-white/70 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <span>{g.name}</span>
                              {genre === g.id && (
                                <span className="text-white text-xs font-bold">
                                  ✓
                                </span>
                              )}
                            </button>
                          ))}
                          {filteredGenres.length === 0 && (
                            <div className="px-3 py-4 text-center text-xs text-white/30">
                              No genres found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-white/20 text-xs hidden sm:inline">|</span>
                  <span className="text-white/30 text-[10px] sm:text-xs hidden sm:inline">
                    {genre === "all"
                      ? "Netflix Official Top 10"
                      : `Netflix ${selectedGenre.name}`}
                  </span>
                </div>

                {/* Right: Slide Indicators + Type Filter Tabs (Search icon hidden here) */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
                  {/* Slide Indicators */}
                  {bannerItems.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10">
                      {bannerItems.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setBannerIndex(idx)}
                          aria-label={`Slide ${idx + 1}`}
                          className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                            idx === bannerIndex
                              ? "w-5 sm:w-6 bg-white shadow-sm"
                              : "w-1.5 bg-white/30 hover:bg-white/60"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#14141c] p-1">
                    {TYPE_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setTypeFilter(tab.key)}
                        className={`flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium transition-all ${
                          typeFilter === tab.key
                            ? "bg-white/10 text-white font-semibold shadow-sm"
                            : "text-white/50 hover:text-white"
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/30">
              <Film className="h-12 w-12 mx-auto mb-3" />
              <p className="text-sm">
                No Netflix data available for this region and filter
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Sticky Top Bar when scrolled down with ultra smooth transition */}
      <div
        className={`fixed top-0 inset-x-0 z-50 bg-[#060608]/92 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl py-2.5 px-4 sm:px-6 md:px-8 lg:px-10 transition-all duration-300 ease-out transform ${
          isScrolled
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto flex items-center justify-between gap-3 w-full max-w-[1400px]">
          {/* Left: Country & Genre Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Country Dropdown */}
            <div className="relative" ref={stickyCountryDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setCountryOpen(!countryOpen);
                  setGenreOpen(false);
                }}
                className={pillBase}
                style={{ backgroundColor: pillBg }}
              >
                <span className="text-sm leading-none">
                  {selectedCountry.flag}
                </span>
                <span>{selectedCountry.name}</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    countryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isScrolled && countryOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 sm:w-72 rounded-xl border border-white/15 bg-[#14141c] shadow-2xl shadow-black/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="p-2 border-b border-white/10">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                      <input
                        ref={stickyCountrySearchInputRef}
                        type="text"
                        placeholder="Search countries..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#e50914]/60"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-thin">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleCountrySelect(c.code)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                          country === c.code
                            ? "bg-[#e50914] text-white font-bold"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="text-base">{c.flag}</span>
                        <span className="font-medium">{c.name}</span>
                        <span className="ml-auto text-[10px] text-white/40">
                          {c.code}
                        </span>
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="px-3 py-4 text-center text-xs text-white/30">
                        No countries found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Genres Dropdown */}
            <div className="relative" ref={stickyGenreDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setGenreOpen(!genreOpen);
                  setCountryOpen(false);
                }}
                className={`${pillBase} ${
                  genre !== "all"
                    ? "border-[#e50914]/50 text-white"
                    : ""
                }`}
                style={{
                  backgroundColor:
                    genre !== "all" ? "rgba(229,9,20,0.1)" : pillBg,
                }}
              >
                <Clapperboard
                  className={`h-3.5 w-3.5 ${
                    genre !== "all" ? "text-[#e50914]" : "text-white/60"
                  }`}
                />
                <span>{selectedGenre.name}</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    genreOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isScrolled && genreOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 sm:w-64 rounded-xl border border-white/15 bg-[#14141c] shadow-2xl shadow-black/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-white/10">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                      <input
                        ref={stickyGenreSearchInputRef}
                        type="text"
                        placeholder="Search genres..."
                        value={genreSearch}
                        onChange={(e) => setGenreSearch(e.target.value)}
                        className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#e50914]/60"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-thin">
                    {filteredGenres.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleGenreSelect(g.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                          genre === g.id
                            ? "bg-[#e50914] text-white font-bold"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>{g.name}</span>
                        {genre === g.id && (
                          <span className="text-white text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                    {filteredGenres.length === 0 && (
                      <div className="px-3 py-4 text-center text-xs text-white/30">
                        No genres found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="text-white/20 text-xs hidden sm:inline">|</span>
            <span className="text-white/30 text-[10px] sm:text-xs hidden sm:inline">
              {genre === "all"
                ? "Netflix Official Top 10"
                : `Netflix ${selectedGenre.name}`}
            </span>
          </div>

          {/* Right: Type Filter Tabs + Search Icon Button matching Header */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#14141c] p-1">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTypeFilter(tab.key)}
                  className={`flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium transition-all ${
                    typeFilter === tab.key
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Icon Button only appears here in the sticky topbar */}
            <button
              onClick={openSearch}
              className="rounded-full p-2 text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white border border-white/10 bg-[#14141c] hover:scale-105 active:scale-95"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto space-y-8 sm:space-y-10 pt-4 sm:pt-6 pb-8">
        {/* Initial Loading (first load when no content exists yet) */}
        {loading && categories.length === 0 && tvTop10.length === 0 && movieTop10.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#e50914] animate-spin" />
          </div>
        ) : (
          <div
            className={`transition-opacity duration-300 ${
              loading ? "opacity-40 pointer-events-none" : "opacity-100"
            }`}
          >
            {/* === ALL or TV: Top 10 TV Shows === */}
            {showTvTop10 && tvTop10.length > 0 && (
              <NetflixTop10Row
                items={tvTop10}
                title={
                  genre === "all"
                    ? `Top 10 TV Shows in ${selectedCountry.name}`
                    : `Top 10 ${selectedGenre.name} Shows in ${selectedCountry.name}`
                }
                dateRange={tvDateRange}
              />
            )}

            {/* === ALL: First 3 category rows after TV top 10 === */}
            {typeFilter === "all" &&
              firstHalf.map((cat) => (
                <CategoryRowSection key={cat.id} cat={cat} />
              ))}

            {/* === ALL or MOVIE: Top 10 Movies === */}
            {showMovieTop10 && movieTop10.length > 0 && (
              <NetflixTop10Row
                items={movieTop10}
                title={
                  genre === "all"
                    ? `Top 10 Movies in ${selectedCountry.name}`
                    : `Top 10 ${selectedGenre.name} Movies in ${selectedCountry.name}`
                }
                dateRange={movieDateRange}
              />
            )}

            {/* === ALL: Remaining category rows === */}
            {typeFilter === "all" &&
              secondHalf.map((cat) => (
                <CategoryRowSection key={cat.id} cat={cat} />
              ))}

            {/* === TV only or MOVIE only: all categories === */}
            {typeFilter !== "all" &&
              categories.map((cat) => (
                <CategoryRowSection key={cat.id} cat={cat} />
              ))}

            {/* Empty State */}
            {categories.length === 0 &&
              tvTop10.length === 0 &&
              movieTop10.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Film className="h-12 w-12 text-white/20 mb-3" />
                  <p className="text-sm font-medium text-white/60">
                    No Netflix titles found for this filter in{" "}
                    {selectedCountry.name}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    Try selecting another genre or switching country
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryRowSection({ cat }: { cat: CategoryRow }) {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 md:px-8 lg:px-10">
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
        <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white">
          {cat.label}
        </h2>
      </div>
      <MediaSlider variant="backdrop" spaceBetween={12}>
        {cat.items.map((item) => (
          <MediaCard
            key={`${item.id}-${item.media_type}`}
            item={item}
            variant="backdrop"
          />
        ))}
      </MediaSlider>
    </section>
  );
}
