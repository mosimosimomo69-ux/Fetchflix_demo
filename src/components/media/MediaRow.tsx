"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "@/lib/api/tmdb";
import { MediaCard } from "./MediaCard";

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  seeAllHref?: string;
}

export function MediaRow({ title, items, seeAllHref }: MediaRowProps) {
  const scroller = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    scroller.current?.scrollBy({
      left: direction * scroller.current.clientWidth * 0.9,
      behavior: "smooth",
    });
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-0.5">
        <h2 className="text-base font-semibold text-white md:text-lg">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              See all
            </Link>
          )}
          <div className="hidden gap-1 md:flex">
            <button
              onClick={() => scrollBy(-1)}
              aria-label={`Scroll ${title} left`}
              className="rounded-full border border-white/10 p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label={`Scroll ${title} right`}
              className="rounded-full border border-white/10 p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1"
      >
        {items.map((item) => (
          <MediaCard
            key={`${item.media_type}-${item.id}`}
            item={item}
            className="w-[140px] flex-shrink-0 snap-start md:w-[170px]"
          />
        ))}
      </div>
    </section>
  );
}
