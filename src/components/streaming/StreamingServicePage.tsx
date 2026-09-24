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

function getNetworkBrandStyle(networkName: string, serviceColor?: string) {
  const norm = networkName.toLowerCase().trim();

  let glow = serviceColor || "rgba(255, 255, 255, 0.25)";
  if (norm.includes("marvel")) glow = "rgba(237, 29, 36, 0.4)";
  else if (norm.includes("star wars") || norm.includes("lucasfilm")) glow = "rgba(255, 232, 31, 0.35)";
  else if (norm.includes("pixar")) glow = "rgba(0, 180, 216, 0.4)";
  else if (norm.includes("disney") || norm === "disney+") glow = "rgba(17, 60, 207, 0.45)";
  else if (norm.includes("national geographic") || norm.includes("nat geo")) glow = "rgba(255, 204, 0, 0.4)";
  else if (norm.includes("hbo")) glow = "rgba(147, 51, 234, 0.45)";
  else if (norm.includes("dc")) glow = "rgba(0, 102, 204, 0.45)";
  else if (norm.includes("hulu")) glow = "rgba(28, 231, 131, 0.4)";
  else if (norm.includes("paramount") || norm.includes("cbs")) glow = "rgba(0, 100, 255, 0.45)";
  else if (norm.includes("showtime")) glow = "rgba(229, 9, 20, 0.45)";

  return {
    gradient: "from-[#f3f4f6] via-[#e5e7eb] to-[#d1d5db]",
    hoverGradient: "hover:from-[#e9eaec] hover:via-[#dde0e4] hover:to-[#c8cdd5]",
    selectedGradient: "from-[#e5e7eb] via-[#d1d5db] to-[#bfc4cc]",
    glow,
  };
}

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
  const [network, setNetwork] = useState("all");

  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [genreOpen, setGenreOpen] = useState(false);
  const [genreSearch, setGenreSearch] = useState("");

  const [isStudiosExpanded, setIsStudiosExpanded] = useState(false);
  const studioScrollRef = useRef<HTMLDivElement>(null);

  const scrollStudios = (direction: "left" | "right") => {
    if (!studioScrollRef.current) return;
    const scrollAmount = studioScrollRef.current.clientWidth * 0.75;
    studioScrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

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
    setNetwork("all");
  }, [typeFilter, country, genre]);

  useEffect(() => {
    setBannerIndex(0);
  }, [network]);

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
    async (type: TypeFilter, countryCode: string, genreCode: string, networkFilter: string) => {
      setLoading(true);
      try {
        const networkParam = networkFilter !== "all" ? `&network=${encodeURIComponent(networkFilter)}` : "";
        const [top10Res, catRes] = await Promise.all([
          fetch(
            `/api/streaming/trending?service=${service.slug}&type=${type}&country=${countryCode}&genre=${genreCode}${networkParam}`
          ),
          fetch(
            `/api/streaming/categories?service=${service.slug}&type=${type}&country=${countryCode}&genre=${genreCode}${networkParam}`
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
    fetchAll(typeFilter, country, genre, network);
  }, [typeFilter, country, genre, network, fetchAll]);

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
        {/* Studios / Subsidiary Networks Showcase matching screenshot */}
        {service.networks.length > 0 && (
          <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 md:px-8 lg:px-10">
            {/* Header: Title + View All > */}
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
                  Studios
                </h2>
                {network !== "all" && (
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white/90 border border-white/15"
                    style={{ backgroundColor: service.colorFaded || "rgba(255,255,255,0.1)" }}
                  >
                    {network}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsStudiosExpanded((prev) => !prev)}
                className="text-xs sm:text-sm font-semibold text-white/60 hover:text-white flex items-center gap-1 transition-colors group cursor-pointer"
              >
                <span>{isStudiosExpanded ? "Show Less" : "View All"}</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isStudiosExpanded ? "rotate-90" : "group-hover:translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Studios Cards Row with Navigation Chevrons */}
            <div className="relative group/carousel">
              {/* Left scroll arrow button */}
              {!isStudiosExpanded && (
                <button
                  onClick={() => scrollStudios("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-14 w-8 sm:w-10 rounded-r-xl bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border-r border-y border-white/15 backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 hover:scale-105 cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
              )}

              {/* Right scroll arrow button */}
              {!isStudiosExpanded && (
                <button
                  onClick={() => scrollStudios("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-14 w-8 sm:w-10 rounded-l-xl bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border-l border-y border-white/15 backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 hover:scale-105 cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
              )}

              {/* Studios list container */}
              <div
                ref={studioScrollRef}
                className={
                  isStudiosExpanded
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4.5"
                    : "flex gap-3 sm:gap-4.5 overflow-x-auto scrollbar-hide py-1.5 scroll-smooth"
                }
              >
                {/* 1. "ALL" combined studio/network card in front */}
                <button
                  onClick={() => setNetwork("all")}
                  className={`group relative flex-shrink-0 ${
                    isStudiosExpanded ? "w-full" : "w-44 sm:w-52 md:w-60 lg:w-64"
                  } aspect-[16/9] rounded-xl sm:rounded-2xl transition-all duration-300 shadow-xl overflow-hidden cursor-pointer ${
                    network === "all"
                      ? "bg-gradient-to-b from-[#525d70] via-[#3c4556] to-[#29303d] border-2 border-white ring-2 ring-white/40 scale-[1.02] shadow-2xl"
                      : "bg-gradient-to-b from-[#3a4150] via-[#2d3340] to-[#1f242e] border border-white/15 hover:from-[#4b5466] hover:via-[#394150] hover:to-[#262c37] hover:border-white/40 hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/80"
                  }`}
                  style={
                    network === "all"
                      ? {
                          boxShadow: `0 0 24px ${service.colorFaded || "rgba(255,255,255,0.25)"}, 0 10px 25px rgba(0,0,0,0.8)`,
                        }
                      : undefined
                  }
                  title={`All ${service.name} Studios`}
                >
                  {/* Subtle lighting overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10 pointer-events-none rounded-xl sm:rounded-2xl" />

                  {/* Centered ALL Combined Typography */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-5 pointer-events-none text-center">
                    <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-widest text-white uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-110">
                      ALL
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-white/70 uppercase mt-0.5">
                      Combined
                    </span>
                  </div>
                </button>

                {/* Individual Studio Cards with Grey Background for high logo visibility */}
                {service.networks.map((n) => {
                  const selected = network === n.name;
                  const brand = getNetworkBrandStyle(n.name, service.color);
                  return (
                    <button
                      key={n.name}
                      onClick={() => setNetwork(selected ? "all" : n.name)}
                      className={`group relative flex-shrink-0 ${
                        isStudiosExpanded ? "w-full" : "w-44 sm:w-52 md:w-60 lg:w-64"
                      } aspect-[16/9] rounded-xl sm:rounded-2xl transition-all duration-300 shadow-xl overflow-hidden cursor-pointer ${
                        selected
                          ? "border-2 border-white/40 ring-2 ring-white/20 scale-[1.02] shadow-2xl"
                          : "border border-white/10 hover:border-white/30 hover:scale-[1.03] hover:shadow-2xl"
                      }`}
                      style={
                        selected
                          ? {
                              background: "linear-gradient(135deg, #71717a 0%, #3f3f46 45%, #1c1917 100%)",
                              boxShadow: `0 0 28px rgba(229,9,20,0.3), 0 10px 30px rgba(0,0,0,0.9)`,
                            }
                          : {
                              background: "linear-gradient(135deg, #606068 0%, #3a3a42 50%, #1e1c1f 100%)",
                            }
                      }
                      title={n.name}
                    >
                      {/* Ambient lighting highlight */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10 pointer-events-none rounded-xl sm:rounded-2xl" />

                      {/* Centered logo container ensuring 100% fit without clipping */}
                      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-5 md:p-6 pointer-events-none">
                        {/* Light gray pill behind logo so dark logos (FX, 20th Century, etc.) are always visible */}
                        <div className="flex items-center justify-center rounded-xl bg-[#e5e7eb]/90 px-5 py-3 backdrop-blur-sm shadow-inner" style={{ maxWidth: '80%', maxHeight: '70%' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={n.logo}
                            alt={n.name}
                            className="w-auto h-auto max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105 select-none"
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

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
                  network !== "all"
                    ? `Top 10 ${network} on ${service.name}`
                    : genre === "all"
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
                  No {network !== "all" ? network : service.name} titles found for this filter in{" "}
                  {selectedCountry.name}
                </p>
                <p className="text-xs text-white/30 mt-1">
                  Try selecting another studio or genre
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
