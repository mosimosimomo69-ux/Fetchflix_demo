"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Star } from "lucide-react";
import type { MediaItem } from "@/lib/api/tmdb";
import { backdropUrl, wsrvUrl } from "@/lib/api/tmdb";
import { formatRating, getTitle, getYear, resolveMediaType } from "@/lib/utils";
import { MOVIE_GENRES, TV_GENRES } from "@/lib/constants";

const SLIDE_INTERVAL = 8000;

interface HeroBannerProps {
  slides: MediaItem[];
}

export function HeroBanner({ slides }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (idx: number) => setCurrentIndex(((idx % slides.length) + slides.length) % slides.length),
    [slides.length]
  );
  const nextSlide = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const interval = setInterval(nextSlide, SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [nextSlide, paused, slides.length, currentIndex]);

  if (!slides || slides.length === 0) return null;

  const current = slides[currentIndex];
  const type = resolveMediaType(current);
  const title = getTitle(current);
  const year = getYear(current) || "2026";
  const rating = formatRating(current.vote_average);

  const genreList = type === "tv" ? TV_GENRES : MOVIE_GENRES;
  const genres = (current.genre_ids || [])
    .map((id) => genreList.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");

  return (
    <div
      className="group relative h-[85vh] sm:h-[86vh] min-h-[580px] max-h-[850px] w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background Images */}
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {slide.backdrop_path && (
            <Image
              src={wsrvUrl(backdropUrl(slide.backdrop_path, "original"), 85)}
              alt={getTitle(slide)}
              fill
              priority={i === 0}
              className={`object-cover object-center ${i === currentIndex ? "hero-kenburns" : ""}`}
              unoptimized
            />
          )}
        </div>
      ))}

      {/* Deep cinematic overlays for text legibility matching screenshot */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/60 via-35% to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#060608]/95 via-[#060608]/60 via-45% to-transparent w-full md:w-3/4" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent h-28" />

      {/* Content matching Screenshot 2026-08-21 175532.png */}
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 pb-16 sm:pb-20 md:pb-24">
        <div className="max-w-xl sm:max-w-2xl space-y-3">

          {/* Bold Uppercase Typography Title matching screenshot */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white drop-shadow-2xl font-sans leading-none">
            {title}
          </h1>

          {/* Meta line: ★ 7.9  ·  2026  ·  Animation  ·  Family */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs sm:text-sm font-medium text-white/80">
            <span className="flex items-center gap-1 text-[#e50914] font-bold">
              <Star className="h-3.5 w-3.5 fill-[#e50914] text-[#e50914]" />
              {rating}
            </span>
            <span className="text-white/40">·</span>
            <span>{year}</span>
            {genres && (
              <>
                <span className="text-white/40">·</span>
                <span>{genres}</span>
              </>
            )}
          </div>

          {/* Overview description - clamped to 3 lines matching screenshot */}
          <p className="line-clamp-3 text-xs sm:text-sm md:text-base leading-relaxed text-white/80 drop-shadow-md">
            {current.overview ||
              "Experience the thrilling adventure on Cineby. Stream now in ultra-high definition."}
          </p>

          {/* Action Buttons matching screenshot */}
          <div className="pt-2 sm:pt-3 flex items-center gap-3.5">
            <Link
              href={`/${type}/${current.id}?play=true`}
              className="flex items-center gap-2.5 rounded-full bg-white px-7 py-2.5 text-sm font-bold text-black shadow-xl transition-all hover:bg-white/90 hover:scale-105 active:scale-95"
            >
              <Play className="h-4 w-4 fill-black text-black" />
              <span>Play</span>
            </Link>

            <Link
              href={`/${type}/${current.id}`}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-black/60 hover:border-white/40 hover:scale-105 active:scale-95"
            >
              <Info className="h-4 w-4 text-white" />
              <span>See More</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
