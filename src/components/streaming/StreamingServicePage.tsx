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
  Search,
  Clapperboard,
} from "lucide-react";
import { MediaSlider } from "@/components/media/MediaSlider";
import { MediaCard } from "@/components/media/MediaCard";
import { NetflixTop10Row } from "@/components/media/NetflixTop10Row";
import type { MediaItem } from "@/lib/api/tmdb";
import { backdropUrl, logoUrl, wsrvUrl } from "@/lib/api/tmdb";
import { getTitle, resolveMediaType } from "@/lib/utils";
import { COUNTRIES, NETFLIX_GENRES, type StreamingService } from "@/lib/constants";
import { useSearchModal } from "@/context/SearchContext";

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

interface StreamingServicePageProps {
  service: StreamingService;
}

export function StreamingServicePage({ service }: StreamingServicePageProps) {
  const { openSearch } = useSearchModal();
  const [top10, setTop10] = useState<Top10Item[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const availableCountries = useMemo(() => {
    if (service.supportedCountries && service.supportedCountries.length > 0) {
      return COUNTRIES.filter((c) => service.supportedCountries!.includes(c.code));
    }
    return COUNTRIES;
  }, [service.supportedCountries]);

  const [country, setCountry] = useState(() => {
    if (service.supportedCountries && service.supportedCountries.length > 0) {
      return service.supportedCountries.includes("US") ? "US" : service.supportedCountries[0];
    }
    return "US";
  });
  const [genre, setGenre] = useState("all");
  const [isScrolled, setIsScrolled] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [genreOpen, setGenreOpen] = useState(false);
  const [genreSearch, setGenreSearch] = useState("");

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const countrySearchInputRef = useRef<HTMLInputElement>(null);
  const genreSearchInputRef = useRef<HTMLInputElement>(null);
  const bannerToolbarRef = useRef<HTMLDivElement>(null);

  const selectedCountry =
    availableCountries.find((c) => c.code === country) || availableCountries[0] || COUNTRIES[0];
  const selectedGenre =
    NETFLIX_GENRES.find((g) => g.id === genre) || NETFLIX_GENRES[0];

  const filteredCountries = availableCountries.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredGenres = NETFLIX_GENRES.filter((g) =>
    g.name.toLowerCase().includes(genreSearch.toLowerCase())
  );

  const featured =
    top10[0]?.item ||
    (categories[0]?.items[0]
      ? { ...categories[0].items[0], _featuredFromCat: true }
      : null);

  const bannerItems = useMemo(() => {
    const items: { item: MediaItem; rank?: number; label?: string }[] = [];
    for (const t of top10.slice(0, 8)) {
      if (t.item) items.push({ item: t.item, rank: t.rank, label: t.title });
    }
    if (items.length < 5) {
      for (const cat of categories.slice(0, 3)) {
        for (const it of cat.items.slice(0, 3)) {
          if (items.length >= 8) break;
          if (!items.some((x) => x.item.id === it.id)) {
            items.push({ item: it, label: cat.label });
          }
        }
      }
    }
    return items;
  }, [top10, categories]);

  const currentBanner = bannerItems[bannerIndex]?.item || featured;

  // Cache: pre-fetch all banner image data upfront so slide transitions are instant
  const [bannerLogo, setBannerLogo] = useState<string | null>(null);
  const [bannerBackdrop, setBannerBackdrop] = useState<string | null>(null);
  const [bannerReady, setBannerReady] = useState(false);
  const bannerCache = useRef<Map<number, { logo: string | null; backdrop: string | null }>>(new Map());

  // Pre-fetch ALL banner items as soon as they're available
  useEffect(() => {
    if (!bannerItems.length) return;
    bannerItems.forEach(({ item }) => {
      if (!item?.id || bannerCache.current.has(item.id)) return;
      const type = resolveMediaType(item);
      fetch(`/api/images?type=${type}&id=${item.id}`)
        .then((r) => (r.ok ? r.json() as Promise<{ logo_path?: string | null; backdrop_path?: string | null }> : Promise.resolve({ logo_path: null, backdrop_path: null })))
        .then((d) => {
          bannerCache.current.set(item.id, {
            logo: d.logo_path || (item as MediaItem & { logo_path?: string }).logo_path || null,
            backdrop: d.backdrop_path || null,
          });
        })
        .catch(() => {
          bannerCache.current.set(item.id, { logo: null, backdrop: null });
        });
    });
  }, [bannerItems]);

  // When current banner changes, serve from cache instantly (or fetch if not yet cached)
  useEffect(() => {
    const item = currentBanner as (MediaItem & { media_type?: string; logo_path?: string }) | null;
    if (!item?.id) {
      setBannerLogo(null);
      setBannerBackdrop(null);
      setBannerReady(false);
      return;
    }
    const cached = bannerCache.current.get(item.id);
    if (cached) {
      // Already in cache — instant, no flash
      setBannerLogo(cached.logo);
      setBannerBackdrop(cached.backdrop);
      setBannerReady(true);
      return;
    }
    // Not yet cached (e.g. first slide on load) — fetch it
    const type = resolveMediaType(item);
    let cancelled = false;
    setBannerLogo(item.logo_path || null);
    setBannerBackdrop(null);
    setBannerReady(false);
    fetch(`/api/images?type=${type}&id=${item.id}`)
      .then((r) => (r.ok ? r.json() as Promise<{ logo_path?: string | null; backdrop_path?: string | null }> : Promise.resolve({ logo_path: null, backdrop_path: null })))
      .then((d) => {
        if (!cancelled) {
          const logo = d.logo_path || item.logo_path || null;
          const backdrop = d.backdrop_path || null;
          bannerCache.current.set(item.id, { logo, backdrop });
          setBannerLogo(logo);
          setBannerBackdrop(backdrop);
          setBannerReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          bannerCache.current.set(item.id, { logo: null, backdrop: null });
          setBannerReady(true);
        }
      });
    return () => { cancelled = true; };
  }, [currentBanner]);

  useEffect(() => {
    setBannerIndex(0);
  }, [typeFilter, country, genre]);

  // Smooth auto-advance: fade out → swap (instant from cache) → fade in
  useEffect(() => {
    if (bannerItems.length < 2) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setBannerIndex((prev) => (prev + 1) % bannerItems.length);
        setIsFading(false);
      }, 700);
    }, 10000);
    return () => clearInterval(interval);
  }, [bannerItems.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target as Node)
      ) {
        setCountryOpen(false);
        setCountrySearch("");
      }
      if (
        genreDropdownRef.current &&
        !genreDropdownRef.current.contains(e.target as Node)
      ) {
        setGenreOpen(false);
        setGenreSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (countryOpen && countrySearchInputRef.current) {
      countrySearchInputRef.current.focus();
    }
  }, [countryOpen]);

  useEffect(() => {
    if (genreOpen && genreSearchInputRef.current) {
      genreSearchInputRef.current.focus();
    }
  }, [genreOpen]);

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
  }, [loading, featured]);

  const fetchAll = useCallback(
    async (type: TypeFilter, countryCode: string, genreCode: string) => {
      setLoading(true);
      try {
        const [top10Res, catRes] = await Promise.all([
          fetch(
            `/api/streaming/trending?service=${service.slug}&type=${type}&country=${countryCode}&genre=${genreCode}`
          ),
          fetch(
            `/api/streaming/categories?service=${service.slug}&type=${type}&country=${countryCode}&genre=${genreCode}`
          ),
        ]);
        const top10Data = await top10Res.json();
        const catData = await catRes.json();

        setTop10(top10Data.results || []);
        setCategories(catData.categories || []);
      } catch {
        setTop10([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    },
    [service.slug]
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

  const pillBase =
    "flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold transition-all border border-white/10 text-white/60 hover:bg-white/10 hover:text-white";
  const pillBg = service.bgSecondary;

  return (
    <div className="min-h-screen" style={{ backgroundColor: service.bgPrimary }}>
      {/* Hero Banner - Full image with bottom gradient */}
      <div className="relative h-[80vh] sm:h-[86vh] md:h-[90vh] lg:h-[94vh] min-h-[640px] max-h-[960px] w-full z-30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2
              className="h-10 w-10 animate-spin"
              style={{ color: service.color }}
            />
          </div>
        ) : featured ? (
          <>
            {/* Clickable Banner Background Overlay that triggers Play */}
            {currentBanner && (
              <Link
                href={`/${resolveMediaType(currentBanner)}/${currentBanner.id}?play=true`}
                className="absolute inset-0 z-20 cursor-pointer"
                aria-label={`Play ${getTitle(currentBanner)}`}
              />
            )}

            {/* Background Image & Gradient Layer (overflow isolated) */}
            <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-500 ${isFading ? "opacity-0" : "opacity-100"}`}>
              {(() => {
                const item = currentBanner as MediaItem & {
                  still_path?: string | null;
                };
                // Fallback (text) image — always available immediately
                const fallbackImg = item.still_path || currentBanner.backdrop_path || currentBanner.poster_path;
                // Clean textless image — only available after fetch
                const cleanImg = bannerBackdrop || null;
                return (
                  <>
                    {/* Fallback image: always shown, fades out when clean image is ready */}
                    {fallbackImg && (
                      <Image
                        key={`fallback-${currentBanner.id}`}
                        src={wsrvUrl(backdropUrl(fallbackImg, "original"))}
                        alt={getTitle(currentBanner)}
                        fill
                        className={`object-cover object-center transition-opacity duration-700 ${bannerReady && cleanImg ? "opacity-0" : "opacity-100"}`}
                        priority
                        unoptimized
                      />
                    )}
                    {/* Clean textless image: fades in on top once fetch resolves */}
                    {cleanImg && (
                      <Image
                        key={`clean-${currentBanner.id}-${cleanImg}`}
                        src={wsrvUrl(backdropUrl(cleanImg, "original"))}
                        alt={getTitle(currentBanner)}
                        fill
                        className={`object-cover object-center transition-opacity duration-700 ${bannerReady ? "opacity-100" : "opacity-0"}`}
                        priority
                        unoptimized
                      />
                    )}
                    {!fallbackImg && !cleanImg && (
                      <div className="absolute inset-0" style={{ backgroundColor: service.bgSecondary }} />
                    )}
                  </>
                );
              })()}

              {/* Single bottom fade keeps the image clean while UI stays readable */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${service.bgPrimary} 0%, ${service.bgPrimary}99 18%, transparent 45%)`,
                }}
              />
            </div>

            {/* Content positioned close to the bottom of the image */}
            <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-6 md:pb-7 w-full z-40 pointer-events-none">
              <Link
                href={currentBanner ? `/${resolveMediaType(currentBanner)}/${currentBanner.id}?play=true` : "#"}
                className="block pointer-events-auto group/banner cursor-pointer max-w-xl"
                aria-label={`Play ${currentBanner ? getTitle(currentBanner) : ""}`}
              >
                <div className="flex items-center gap-2 mb-2 sm:mb-2.5 flex-wrap">
                  {bannerItems[bannerIndex]?.rank ? (
                    <span
                      className="text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded tracking-wide uppercase"
                      style={{ backgroundColor: service.color }}
                    >
                      #{bannerItems[bannerIndex].rank}
                    </span>
                  ) : (
                    <span
                      className="text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded tracking-wide uppercase"
                      style={{ backgroundColor: service.color }}
                    >
                      {service.name}
                    </span>
                  )}
                  <span
                    className="text-xs sm:text-sm font-semibold tracking-wider uppercase"
                    style={{ color: service.color }}
                  >
                    {genre !== "all" ? selectedGenre.name : "TOP 10"}
                  </span>
                  <span className="text-white/40 text-xs">|</span>
                  <span className="text-white/50 text-[10px] sm:text-xs">
                    {selectedCountry.flag} {selectedCountry.name}
                  </span>
                </div>

                {bannerReady ? (
                  bannerLogo ? (
                    <div
                      className={`relative h-12 sm:h-16 md:h-20 w-auto max-w-[240px] sm:max-w-[320px] md:max-w-[400px] mb-1.5 sm:mb-2 transition-opacity duration-500 group-hover/banner:scale-105 transition-transform ${isFading ? "opacity-0" : "opacity-100"}`}
                    >
                      <Image
                        src={wsrvUrl(logoUrl(bannerLogo, "w500"), 95)}
                        alt={getTitle(currentBanner)}
                        fill
                        className="object-contain object-left drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-1.5 sm:mb-2 tracking-tight leading-tight group-hover/banner:text-white/90 transition-all duration-500 ${isFading ? "opacity-0" : "opacity-100"}`}>
                      {getTitle(currentBanner)}
                    </h1>
                  )
                ) : (
                  // Placeholder keeps layout stable while fetch is in-flight — invisible but reserves space
                  <div className="h-12 sm:h-16 md:h-20 mb-1.5 sm:mb-2" />
                )}

                <p className={`text-xs sm:text-sm md:text-base text-white/70 line-clamp-2 sm:line-clamp-3 max-w-xl transition-opacity duration-500 ${isFading ? "opacity-0" : "opacity-100"}`}>
                  {currentBanner.overview}
                </p>
              </Link>

              {/* Toolbar Controls on Banner Image below description (Search icon hidden here) */}
              <div ref={bannerToolbarRef} className="mt-3.5 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full pointer-events-auto">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Country Dropdown */}
                  <div className="relative" ref={countryDropdownRef}>
                    <button
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

                    {countryOpen && (
                      <div
                        className="absolute top-full left-0 mt-2 w-64 sm:w-72 rounded-xl border border-white/15 bg-[#14141c] shadow-2xl shadow-black/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="p-2 border-b border-white/10">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                            <input
                              ref={countrySearchInputRef}
                              type="text"
                              placeholder="Search countries..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                            />
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto scrollbar-thin">
                          {filteredCountries.map((c) => (
                            <button
                              key={c.code}
                              onClick={() => handleCountrySelect(c.code)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                                country === c.code
                                  ? "text-white font-bold"
                                  : "text-white/70 hover:bg-white/5 hover:text-white"
                              }`}
                              style={
                                country === c.code
                                  ? { backgroundColor: service.color, color: "#fff" }
                                  : undefined
                              }
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
                  <div className="relative" ref={genreDropdownRef}>
                    <button
                      onClick={() => {
                        setGenreOpen(!genreOpen);
                        setCountryOpen(false);
                      }}
                      className={`${pillBase} ${
                        genre !== "all"
                          ? "border-white/30 text-white"
                          : ""
                      }`}
                      style={{
                        backgroundColor:
                          genre !== "all" ? service.colorFaded : pillBg,
                      }}
                    >
                      <Clapperboard
                        className="h-3.5 w-3.5"
                        style={{
                          color: genre !== "all" ? service.color : "rgba(255,255,255,0.6)",
                        }}
                      />
                      <span>{selectedGenre.name}</span>
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          genreOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {genreOpen && (
                      <div className="absolute top-full left-0 mt-2 w-56 sm:w-64 rounded-xl border border-white/15 bg-[#14141c] shadow-2xl shadow-black/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-2 border-b border-white/10">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                            <input
                              ref={genreSearchInputRef}
                              type="text"
                              placeholder="Search genres..."
                              value={genreSearch}
                              onChange={(e) => setGenreSearch(e.target.value)}
                              className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                            />
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto scrollbar-thin">
                          {filteredGenres.map((g) => (
                            <button
                              key={g.id}
                              onClick={() => handleGenreSelect(g.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                                genre === g.id
                                  ? "text-white font-bold"
                                  : "text-white/70 hover:bg-white/5 hover:text-white"
                              }`}
                              style={
                                genre === g.id
                                  ? { backgroundColor: service.color, color: "#fff" }
                                  : undefined
                              }
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
                  <span className="text-white/40 text-[10px] sm:text-xs font-medium hidden sm:inline">
                    {genre === "all"
                      ? `${service.name} Official Top 10`
                      : `${service.name} ${selectedGenre.name}`}
                  </span>
                </div>

                {/* Right: Type Filter Tabs (Search icon hidden here) */}
                <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#14141c] p-1">
                    {TYPE_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setTypeFilter(tab.key)}
                        className={`flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium transition-all ${
                          typeFilter === tab.key
                            ? "bg-white/15 text-white font-semibold shadow-sm"
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
              <Film className="h-12 w-12 mx-auto mb-3" style={{ color: service.color }} />
              <p className="text-sm">
                No {service.name} content available for this filter
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
            <div className="relative">
              <button
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

              {countryOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 sm:w-72 rounded-xl border border-white/15 bg-[#14141c] shadow-2xl shadow-black/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="p-2 border-b border-white/10">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                      <input
                        ref={countrySearchInputRef}
                        type="text"
                        placeholder="Search countries..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-thin">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => handleCountrySelect(c.code)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                          country === c.code
                            ? "text-white font-bold"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                        style={
                          country === c.code
                            ? { backgroundColor: service.color, color: "#fff" }
                            : undefined
                        }
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
            <div className="relative">
              <button
                onClick={() => {
                  setGenreOpen(!genreOpen);
                  setCountryOpen(false);
                }}
                className={`${pillBase} ${
                  genre !== "all"
                    ? "border-white/30 text-white"
                    : ""
                }`}
                style={{
                  backgroundColor:
                    genre !== "all" ? service.colorFaded : pillBg,
                }}
              >
                <Clapperboard
                  className="h-3.5 w-3.5"
                  style={{
                    color: genre !== "all" ? service.color : "rgba(255,255,255,0.6)",
                  }}
                />
                <span>{selectedGenre.name}</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    genreOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {genreOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 sm:w-64 rounded-xl border border-white/15 bg-[#14141c] shadow-2xl shadow-black/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-white/10">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                      <input
                        ref={genreSearchInputRef}
                        type="text"
                        placeholder="Search genres..."
                        value={genreSearch}
                        onChange={(e) => setGenreSearch(e.target.value)}
                        className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-thin">
                    {filteredGenres.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => handleGenreSelect(g.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                          genre === g.id
                            ? "text-white font-bold"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                        style={
                          genre === g.id
                            ? { backgroundColor: service.color, color: "#fff" }
                            : undefined
                        }
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
            <span className="text-white/40 text-[10px] sm:text-xs font-medium hidden sm:inline">
              {genre === "all"
                ? `${service.name} Official Top 10`
                : `${service.name} ${selectedGenre.name}`}
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
                      ? "bg-white/15 text-white font-semibold shadow-sm"
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
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2
              className="h-8 w-8 animate-spin"
              style={{ color: service.color }}
            />
          </div>
        )}

        {!loading && (
          <>
            {/* Top 10 Row */}
            {top10.length > 0 && (
              <NetflixTop10Row
                items={top10}
                title={
                  genre === "all"
                    ? `Top 10 on ${service.name} in ${selectedCountry.name}`
                    : `Top 10 ${selectedGenre.name} on ${service.name} in ${selectedCountry.name}`
                }
              />
            )}

            {/* Category Rows */}
            {categories.map((cat) => (
              <section
                key={cat.id}
                className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 md:px-8 lg:px-10"
              >
                <div className="mb-3.5 flex items-center gap-2.5">
                  <span
                    className="h-5 w-1 rounded-sm"
                    style={{ backgroundColor: service.color }}
                  />
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
            ))}

            {/* Empty State */}
            {categories.length === 0 && top10.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Film className="h-12 w-12 text-white/20 mb-3" />
                <p className="text-sm font-medium text-white/60">
                  No {service.name} titles found for this filter in{" "}
                  {selectedCountry.name}
                </p>
                <p className="text-xs text-white/30 mt-1">
                  Try selecting another genre
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
