"use client";

import React, { useState } from "react";
import type { MediaItem } from "@/lib/api/tmdb";
import { MediaCard } from "./MediaCard";
import { MediaSlider } from "./MediaSlider";

interface TrendingRowProps {
  movieItems: MediaItem[];
  tvItems: MediaItem[];
}

export function TrendingRow({ movieItems, tvItems }: TrendingRowProps) {
  const [tab, setTab] = useState<"movies" | "series">("movies");

  const items = tab === "movies" ? movieItems : tvItems;

  return (
    <section className="mx-auto w-full max-w-[1360px]">
      {/* Header & Tabs (matching screenshot Home (3).png) */}
      <div className="mb-4 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
          <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
            Trending Today
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-4 text-sm font-semibold">
          <button
            onClick={() => setTab("movies")}
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
            onClick={() => setTab("series")}
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
      <div className="px-4">
        <MediaSlider key={tab} variant="backdrop">
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
