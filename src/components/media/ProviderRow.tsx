"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { MediaItem } from "@/lib/api/tmdb";
import { STREAMING_PROVIDERS } from "@/lib/constants";
import { MediaCard } from "./MediaCard";
import { MediaSlider } from "./MediaSlider";

function NetflixIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 2h3.5v20H5z" fill="#B81D24" />
      <path d="M15.5 2H19v20h-3.5z" fill="#B81D24" />
      <path d="M5 2h3.5l10.5 20H15.5L5 2z" fill="#E50914" />
    </svg>
  );
}

function PrimeVideoIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="4" fill="#00A8E1" />
      <path
        d="M6 7.5h4.2c1.8 0 3 1 3 2.5s-1.2 2.5-3 2.5H8.2V16H6V7.5zm2.2 3.4h1.8c.6 0 1-.3 1-.9s-.4-.9-1-.9H8.2v1.8z"
        fill="#ffffff"
      />
      <path
        d="M7 18.5c3.2 2 7 2 10.2 0"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M16.5 17.2l1.7 1.3-1.1 1.5" fill="#ffffff" />
    </svg>
  );
}

function HboMaxIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="4" fill="#494952" />
      <text
        x="12"
        y="12.5"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="7.5"
        fontWeight="900"
        letterSpacing="-0.5"
        fontFamily="system-ui, sans-serif"
      >
        HBO
      </text>
      <text
        x="12.5"
        y="19"
        textAnchor="middle"
        fill="#d4d4d8"
        fontSize="6.5"
        fontWeight="700"
        letterSpacing="1"
        fontFamily="system-ui, sans-serif"
      >
        max
      </text>
    </svg>
  );
}

function DisneyPlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="4" fill="#040D36" />
      <path
        d="M4 14C8 8.5 15.5 7 20 11"
        stroke="#0063E5"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fill="white"
        fontSize="9"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        D+
      </text>
    </svg>
  );
}

function AppleTvIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="4" fill="#1C1C1E" />
      <path
        d="M8.2 7.2c.4-.5.7-1.1.6-1.8-.6 0-1.2.4-1.6.8-.4.4-.6 1-.6 1.7.7.1 1.2-.2 1.6-.7zm.6 1.9c-1 0-1.7.6-2.2.6-.5 0-1.1-.5-1.9-.5-1 0-1.9.6-2.4 1.5-1.1 1.9-.3 4.6.8 6.1.5.8 1.1 1.6 1.9 1.6.8 0 1-.5 2-.5 1 0 1.2.5 2 .5.8 0 1.4-.8 1.9-1.5.6-.9.8-1.7.8-1.7-.1 0-1.6-.6-1.6-2.3 0-1.4 1.2-2.1 1.2-2.2-.7-1-1.7-1.1-2-1.1h-.5z"
        fill="#ffffff"
      />
      <text
        x="16.5"
        y="14.5"
        textAnchor="middle"
        fill="white"
        fontSize="6.5"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        tv+
      </text>
    </svg>
  );
}

function ParamountPlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="4" fill="#0064FF" />
      <path
        d="M12 4.5l1.6 3.8 4 .4-3 2.7.9 4-3.5-2.1-3.5 2.1.9-4-3-2.7 4-.4L12 4.5z"
        fill="#ffffff"
      />
      <text
        x="12"
        y="20.5"
        textAnchor="middle"
        fill="white"
        fontSize="6"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        P+
      </text>
    </svg>
  );
}

function HuluIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="4" fill="#061A14" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fill="#1CE783"
        fontSize="8"
        fontWeight="bold"
        letterSpacing="-0.3"
        fontFamily="system-ui, sans-serif"
      >
        hulu
      </text>
    </svg>
  );
}

function ProviderWebsiteIcon({
  id,
  className = "h-4 w-4",
}: {
  id: number;
  className?: string;
}) {
  switch (id) {
    case 8:
      return <NetflixIcon className={className} />;
    case 9:
    case 119:
      return <PrimeVideoIcon className={className} />;
    case 1899:
    case 384:
      return <HboMaxIcon className={className} />;
    case 337:
      return <DisneyPlusIcon className={className} />;
    case 350:
    case 2:
      return <AppleTvIcon className={className} />;
    case 2303:
    case 531:
      return <ParamountPlusIcon className={className} />;
    case 15:
      return <HuluIcon className={className} />;
    default:
      return <NetflixIcon className={className} />;
  }
}

function getProviderSlug(id: number): string {
  switch (id) {
    case 8:
      return "netflix";
    case 9:
    case 119:
      return "prime-video";
    case 1899:
    case 384:
      return "max";
    case 337:
      return "disney-plus";
    case 350:
    case 2:
      return "apple-tv";
    case 2303:
    case 531:
      return "paramount-plus";
    case 15:
      return "hulu";
    default:
      return "netflix";
  }
}

function ScreenTvIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  );
}

interface ProviderRowProps {
  initialMovieItems?: MediaItem[];
  initialTvItems?: MediaItem[];
  initialItems?: MediaItem[];
  initialProviderId?: number;
}

export function ProviderRow({
  initialMovieItems,
  initialTvItems,
  initialItems,
  initialProviderId = 8, // Netflix default
}: ProviderRowProps) {
  const [selectedProvider, setSelectedProvider] = useState(
    STREAMING_PROVIDERS.find((p) => p.id === initialProviderId) || STREAMING_PROVIDERS[0]
  );
  const [tab, setTab] = useState<"movies" | "series">("movies");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [movieItems, setMovieItems] = useState<MediaItem[]>(
    initialMovieItems || initialItems || []
  );
  const [tvItems, setTvItems] = useState<MediaItem[]>(
    initialTvItems || initialItems || []
  );
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const items = tab === "movies" ? movieItems : tvItems;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProviderContent = async (
    providerId: number,
    mediaType: "movies" | "series"
  ) => {
    const typeParam = mediaType === "movies" ? "movie" : "tv";
    const res = await fetch(
      `/api/discover?providerId=${providerId}&type=${typeParam}&sortBy=popularity.desc`
    );
    if (res.ok) {
      const data = await res.json();
      return data.results || [];
    }
    return [];
  };

  const handleSelectProvider = async (provider: (typeof STREAMING_PROVIDERS)[number]) => {
    setSelectedProvider(provider);
    setDropdownOpen(false);
    setLoading(true);

    try {
      const [movies, tv] = await Promise.all([
        fetchProviderContent(provider.id, "movies"),
        fetchProviderContent(provider.id, "series"),
      ]);
      setMovieItems(movies);
      setTvItems(tv);
    } catch (err) {
      console.error("Provider fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (newTab: "movies" | "series") => {
    if (newTab === tab) return;
    setTab(newTab);
    const targetItems = newTab === "movies" ? movieItems : tvItems;
    if (targetItems.length === 0) {
      setLoading(true);
      try {
        const results = await fetchProviderContent(selectedProvider.id, newTab);
        if (newTab === "movies") setMovieItems(results);
        else setTvItems(results);
      } catch (err) {
        console.error("Tab change fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1360px]">
      {/* Header with Provider Dropdown & Movies/Series tabs */}
      <div className="mb-4 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-white md:text-2xl hover:text-white/80 transition-colors group"
            >
              <span>
                Only on{" "}
                <span className="underline decoration-[#e50914] underline-offset-4">
                  {selectedProvider.name}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-2 z-30 w-52 rounded-xl border border-white/10 bg-[#12121a] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                {STREAMING_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProvider(p)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                      p.id === selectedProvider.id
                        ? "bg-[#e50914] text-white font-semibold"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="inline-flex items-center justify-center h-4 w-4 rounded overflow-hidden shrink-0">
                      <ProviderWebsiteIcon id={p.id} className="h-full w-full object-contain" />
                    </span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Movies/Series Tabs & Extreme Right Provider Link */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Filter Tabs */}
          <div className="flex items-center gap-4 text-sm font-semibold">
            <button
              onClick={() => handleTabChange("movies")}
              className={`relative pb-1 transition-colors ${
                tab === "movies"
                  ? "text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Movies
              {tab === "movies" && (
                <span className="absolute inset-x-0 -bottom-1 h-[2.5px] rounded-full bg-[#e50914]" />
              )}
            </button>

            <button
              onClick={() => handleTabChange("series")}
              className={`relative pb-1 transition-colors ${
                tab === "series"
                  ? "text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Series
              {tab === "series" && (
                <span className="absolute inset-x-0 -bottom-1 h-[2.5px] rounded-full bg-[#e50914]" />
              )}
            </button>
          </div>

          {/* Extreme Right Margin: Enclosed Button with Screen Icon and Service Icon */}
          <Link
            href={`/${getProviderSlug(selectedProvider.id)}`}
            className="flex items-center gap-1 sm:gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 shadow-sm backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 hover:scale-105"
            title={`Browse all ${selectedProvider.name} titles`}
            aria-label={`Browse all ${selectedProvider.name} titles`}
          >
            <ScreenTvIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/70" />
            <span className="inline-flex items-center justify-center h-3.5 w-3.5 sm:h-4 sm:w-4 rounded overflow-hidden shrink-0">
              <ProviderWebsiteIcon id={selectedProvider.id} className="h-full w-full object-contain" />
            </span>
          </Link>
        </div>
      </div>

      {/* 16:9 Backdrop Carousel */}
      <div
        className={`px-4 transition-opacity duration-200 ${
          loading ? "opacity-40" : "opacity-100"
        }`}
      >
        <MediaSlider key={`${selectedProvider.id}-${tab}`} variant="backdrop">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              variant="backdrop"
              forceType={tab === "movies" ? "movie" : "tv"}
            />
          ))}
        </MediaSlider>
      </div>
    </section>
  );
}
