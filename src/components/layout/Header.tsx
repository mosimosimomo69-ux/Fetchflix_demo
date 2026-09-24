"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  Search,
  User,
  ChevronDown,
  ChevronUp,
  Film,
  Tv,
  Sparkles,
  Clock,
  Heart,
  Sliders,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSearchModal } from "@/context/SearchContext";

export function Header() {
  const pathname = usePathname();
  const { user, openLogin, logout, adsEnabled, toggleAds } = useAuth();
  const { openSearch } = useSearchModal();
  const [browseOpen, setBrowseOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const browseRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        browseRef.current &&
        !browseRef.current.contains(event.target as Node)
      ) {
        setBrowseOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide the top bar when the user is on the more info detail page of a movie/series or watch player
  const isDetailPage =
    (pathname.startsWith("/movie/") && pathname !== "/movie") ||
    (pathname.startsWith("/tv/") && pathname !== "/tv") ||
    pathname.startsWith("/watch");

  if (isDetailPage) {
    return null;
  }

  return (
    <header className="absolute top-0 inset-x-0 z-40 w-full bg-transparent border-none">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">


        {/* Fetchflix Logo - sleek compact size */}
        <Link href="/" className="flex items-center group">
          <div className="relative h-5 sm:h-6 w-20 sm:w-24 transition-transform group-hover:scale-105">
            <Image
              src="/fetchflix.png"
              alt="Fetchflix"
              fill
              priority
              className="object-contain object-left drop-shadow-md"
              unoptimized
            />
          </div>
        </Link>

        {/* Navigation & Action Items Right */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {/* Home */}
          <Link
            href="/"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              pathname === "/"
                ? "text-white font-semibold"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          {/* Browse Dropdown Button */}
          <div className="relative" ref={browseRef}>
            <button
              onClick={() => setBrowseOpen(!browseOpen)}
              className={`flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-sm font-medium transition-colors ${
                browseOpen ||
                pathname.startsWith("/movie") ||
                pathname.startsWith("/tv")
                  ? "bg-white/15 text-white border-white/25"
                  : "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Browse</span>
              {browseOpen ? (
                <ChevronUp className="h-3.5 w-3.5 opacity-70" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              )}
            </button>

            {/* Browse Dropdown Menu */}
            {browseOpen && (
              <div className="absolute right-0 top-full mt-2.5 z-50 w-72 sm:w-80 rounded-2xl border border-white/10 bg-[#0d0d12]/98 p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                <h3 className="text-center text-sm font-bold text-white tracking-wide pb-3 border-b border-white/10">
                  Browse
                </h3>

                {/* CONTENT Section */}
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2.5">
                    Content
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href="/movie"
                      onClick={() => setBrowseOpen(false)}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-[#14141c] p-3 text-center transition-all hover:border-red-500/40 hover:bg-[#1a1a24] group"
                    >
                      <div className="rounded-lg bg-red-950/40 p-2 text-[#e50914] group-hover:scale-110 transition-transform">
                        <Film className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-white/90">
                        Movies
                      </span>
                    </Link>

                    <Link
                      href="/tv"
                      onClick={() => setBrowseOpen(false)}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-[#14141c] p-3 text-center transition-all hover:border-red-500/40 hover:bg-[#1a1a24] group"
                    >
                      <div className="rounded-lg bg-red-950/40 p-2 text-[#e50914] group-hover:scale-110 transition-transform">
                        <Tv className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-white/90">
                        TV Shows
                      </span>
                    </Link>

                    <Link
                      href="/anime"
                      onClick={() => setBrowseOpen(false)}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-[#14141c] p-3 text-center transition-all hover:border-red-500/40 hover:bg-[#1a1a24] group"
                    >
                      <div className="rounded-lg bg-red-950/40 p-2 text-[#e50914] group-hover:scale-110 transition-transform">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-white/90">
                        Anime
                      </span>
                    </Link>
                  </div>
                </div>

                {/* STREAMING Section */}
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2.5">
                    Streaming
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { href: "/netflix", img: "/logos/netflix.png", alt: "Netflix" },
                      { href: "/prime-video", img: "/logos/prime-video.png", alt: "Prime Video" },
                      { href: "/max", img: "/logos/max.png", alt: "Max" },
                      { href: "/disney-plus", img: "/logos/disney-plus.png", alt: "Disney+" },
                      { href: "/apple-tv", img: "/logos/apple-tv.png", alt: "Apple TV+" },
                      { href: "/hulu", img: "/logos/hulu.png", alt: "Hulu" },
                      { href: "/paramount-plus", img: "/logos/paramount-plus.png", alt: "Paramount+" },
                    ].map((s) => (
                      <Link
                        key={s.href}
                        href={s.href}
                        onClick={() => setBrowseOpen(false)}
                        className="flex items-center justify-center rounded-lg bg-white/90 hover:bg-white p-2 sm:p-2.5 transition-all group shadow-sm hover:scale-105"
                      >
                        <img
                          src={s.img}
                          alt={s.alt}
                          className="h-4 sm:h-5 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                        />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* PERSONAL Section */}
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2.5">
                    Personal
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/history"
                      onClick={() => setBrowseOpen(false)}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-[#14141c] p-3 text-center transition-all hover:border-white/20 hover:bg-[#1a1a24] group"
                    >
                      <Clock className="h-5 w-5 text-white/70 group-hover:text-white" />
                      <span className="text-xs font-medium text-white/90">
                        History
                      </span>
                    </Link>

                    <Link
                      href="/watchlist"
                      onClick={() => setBrowseOpen(false)}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-[#14141c] p-3 text-center transition-all hover:border-white/20 hover:bg-[#1a1a24] group"
                    >
                      <Heart className="h-5 w-5 text-white/70 group-hover:text-white" />
                      <span className="text-xs font-medium text-white/90">
                        Watchlist
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Ads Status Toggle */}
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-[#14141c] px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-white/80">
                    <Sliders className="h-4 w-4 text-white/50" />
                    <span>Ads status</span>
                  </div>
                  <button
                    onClick={toggleAds}
                    className={`flex items-center justify-center rounded-full px-3 py-0.5 text-xs font-bold transition-all ${
                      adsEnabled
                        ? "bg-[#e50914] text-white"
                        : "bg-white/15 text-white/60"
                    }`}
                  >
                    {adsEnabled ? "ON" : "OFF"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Icon Button */}
          <button
            onClick={openSearch}
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* User Profile Button */}
          <div className="relative" ref={userMenuRef}>
            {user ? (
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#e50914] to-red-400 text-xs font-bold text-white shadow-md hover:scale-105 transition-transform"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
            ) : (
              <button
                onClick={() => openLogin()}
                className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </button>
            )}

            {user && userMenuOpen && (
              <div className="absolute right-0 top-full mt-2.5 z-50 w-48 rounded-xl border border-white/10 bg-[#12121a] p-2 shadow-xl backdrop-blur-xl">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-xs font-semibold text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-white/40 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="py-1">
                  <Link
                    href="/watchlist"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-white/80 rounded-lg hover:bg-white/5 hover:text-white"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    Watchlist
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-white/80 rounded-lg hover:bg-white/5 hover:text-white"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    History
                  </Link>
                </div>
                <div className="pt-1 border-t border-white/10">
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-400 rounded-lg hover:bg-rose-950/30"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
