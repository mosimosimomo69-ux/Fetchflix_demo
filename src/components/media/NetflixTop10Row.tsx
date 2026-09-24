"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "@/lib/api/tmdb";
import { MediaCard } from "./MediaCard";

interface Top10Item {
  rank: number;
  weeks: number;
  title: string;
  item: MediaItem | null;
}

interface NetflixTop10RowProps {
  items: Top10Item[];
  title: string;
  dateRange?: string | null;
}

export function NetflixTop10Row({ items, title, dateRange }: NetflixTop10RowProps) {
  const scroller = useRef<HTMLDivElement>(null);
  if (!items || items.length === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    scroller.current?.scrollBy({
      left: direction * scroller.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  const filtered = items.filter((e) => e.item);

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 md:px-8 lg:px-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {dateRange && (
            <span className="text-xs text-white/30 ml-2 hidden sm:inline">{dateRange}</span>
          )}
        </div>
        <div className="hidden gap-1 md:flex">
          <button
            onClick={() => scrollBy(-1)}
            className="rounded-full border border-white/10 p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="rounded-full border border-white/10 p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
      >
        {filtered.map((entry, idx) => {
          const num = idx + 1;
          const topBadge = `TOP ${num < 10 ? "0" + num : num}`;
          return (
            <div
              key={entry.rank}
              className="flex-shrink-0 snap-start"
              style={{ width: "clamp(140px, 15vw, 180px)" }}
            >
              <MediaCard
                item={entry.item!}
                variant="poster"
                topBadge={topBadge}
                inlineRating
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
