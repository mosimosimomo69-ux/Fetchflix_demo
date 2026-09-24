"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { MediaItem } from "@/lib/api/tmdb";
import { MOVIE_GENRES, TV_GENRES } from "@/lib/constants";
import { MediaCard } from "./MediaCard";
import { MediaSlider } from "./MediaSlider";

interface GenreRowProps {
  initialItems: MediaItem[];
  initialGenreId?: number;
  initialGenreName?: string;
}

export function GenreRow({
  initialItems,
  initialGenreId = 35, // Comedy default
  initialGenreName = "Comedy",
}: GenreRowProps) {
  const [selectedGenre, setSelectedGenre] = useState<{ id: number; name: string }>({
    id: initialGenreId,
    name: initialGenreName,
  });
  const [tab, setTab] = useState<"movies" | "series">("movies");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentGenres = tab === "movies" ? MOVIE_GENRES : TV_GENRES;

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

  const fetchGenreContent = async (genreId: number, mediaType: "movies" | "series") => {
    setLoading(true);
    try {
      const type = mediaType === "movies" ? "movie" : "tv";
      const res = await fetch(`/api/discover?genreId=${genreId}&type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.results || []);
      }
    } catch (err) {
      console.error("Genre fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGenre = (genre: { id: number; name: string }) => {
    setSelectedGenre(genre);
    setDropdownOpen(false);
    fetchGenreContent(genre.id, tab);
  };

  const handleTabChange = (newTab: "movies" | "series") => {
    setTab(newTab);
    fetchGenreContent(selectedGenre.id, newTab);
  };

  return (
    <section className="mx-auto w-full max-w-[1360px]">
      {/* Header with Genre Dropdown and Tabs (matching screenshots Home (4).png & (5).png) */}
      <div className="mb-4 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-white md:text-2xl hover:text-white/80 transition-colors"
            >
              <span>{selectedGenre.name}</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-2 z-30 w-52 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#12121a] p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                {currentGenres.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleSelectGenre(g)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                      g.id === selectedGenre.id
                        ? "bg-[#e50914] text-white font-semibold"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

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
      </div>

      {/* 16:9 Backdrop Carousel */}
      <div
        className={`px-4 transition-opacity duration-200 ${
          loading ? "opacity-40" : "opacity-100"
        }`}
      >
        <MediaSlider key={`${tab}-${selectedGenre.id}`} variant="backdrop">
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
