"use client";

import React from "react";
import type { MediaItem } from "@/lib/api/tmdb";
import { MediaCard } from "./MediaCard";
import { MediaSlider } from "./MediaSlider";

interface Top10RowProps {
  items: MediaItem[];
  title?: string;
}

export function Top10Row({ items, title = "TOP 10 Today" }: Top10RowProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1360px]">
      {/* Header with red bar */}
      <div className="mb-3.5 flex items-center gap-2.5 px-4">
        <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white">
          {title}
        </h2>
      </div>

      {/* Vertical Poster Carousel */}
      <div className="px-4 pb-3">
        <MediaSlider variant="top10" spaceBetween={10}>
          {items.slice(0, 10).map((item, idx) => {
            const rank = idx + 1;
            const topBadge = `TOP ${rank < 10 ? "0" + rank : rank}`;

            return (
              <MediaCard
                key={item.id}
                item={item}
                variant="poster"
                topBadge={topBadge}
              />
            );
          })}
        </MediaSlider>
      </div>

    </section>
  );
}
