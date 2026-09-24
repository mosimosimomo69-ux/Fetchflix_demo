import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { MediaItem } from "@/lib/api/tmdb";
import { posterUrl, backdropUrl, wsrvUrl } from "@/lib/api/tmdb";
import { formatRating, getTitle, getYear, resolveMediaType } from "@/lib/utils";

interface MediaCardProps {
  item: MediaItem;
  variant?: "poster" | "backdrop";
  topBadge?: string;
  is4k?: boolean;
  live?: boolean;
  className?: string;
  forceType?: "movie" | "tv";
  inlineRating?: boolean;
}

export function MediaCard({
  item,
  variant = "poster",
  topBadge,
  is4k,
  live,
  className = "",
  forceType,
  inlineRating = false,
}: MediaCardProps) {
  const type = forceType || resolveMediaType(item);
  const title = getTitle(item);
  const year = getYear(item);
  const rating = formatRating(item.vote_average);

  const isBackdrop = variant === "backdrop";
  // Theatrical title poster for vertical cards, or official English title backdrop for horizontal cards
  const imageSrc = isBackdrop
    ? item.backdrop_path
      ? wsrvUrl(backdropUrl(item.backdrop_path, "w780"))
      : wsrvUrl(posterUrl(item.poster_path, "w500"))
    : wsrvUrl(posterUrl(item.poster_path, "w500"));

  return (
    <Link
      href={`/${type}/${item.id}`}
      className={`group block select-none ${className}`}
    >
      {/* Thumbnail Container matching screenshot 094610.png & Home (2).png */}
      <div
        data-thumb
        className={`relative overflow-hidden rounded-lg bg-[#14141c] border border-white/[0.06] transition-all duration-300 group-hover:border-white/20 group-hover:scale-[1.02] group-hover:shadow-2xl ${
          isBackdrop ? "aspect-[16/9] w-full" : "aspect-[2/3] w-full"
        }`}
      >

        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes={
            isBackdrop
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
              : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
          }
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />

        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-20" />

        {/* TOP 01-10 Red Ribbon Bookmark Badge (matching screenshot Home (2).png) */}
        {topBadge && (
          <div
            className="absolute left-0 top-0 z-20 flex w-7 sm:w-8 flex-col items-center justify-center bg-[#e50914] pb-2.5 pt-1 text-white shadow-xl select-none"
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
            }}
          >
            <span className="text-[8px] font-black uppercase tracking-tighter leading-none">
              {topBadge.split(" ")[0]}
            </span>
            <span className="text-xs font-black leading-none mt-0.5">
              {topBadge.split(" ")[1]}
            </span>
          </div>
        )}


        {/* 4K Badge */}
        {is4k && (
          <div className="absolute right-2 top-2 z-10 rounded bg-purple-600/90 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-white backdrop-blur">
            4K
          </div>
        )}

        {/* LIVE Badge */}
        {live && (
          <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}

        {/* Inline Rating Badge (bottom-right inside thumbnail) */}
        {inlineRating && (
          <div className="absolute bottom-1.5 right-1.5 z-20 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
            <Star className="h-2.5 w-2.5 fill-[#e50914] text-[#e50914]" />
            <span className="text-[10px] font-bold text-[#e50914]">{rating}</span>
          </div>
        )}
      </div>

      {/* Info text below matching screenshot 094610.png */}
      {!inlineRating && (
      <div className="mt-2.5 px-0.5">
        <h3 className="truncate text-sm font-semibold text-white group-hover:text-[#e50914] transition-colors">
          {title}
        </h3>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50">
          <span className="flex items-center gap-1 text-[#e50914] font-semibold">
            <Star className="h-3 w-3 fill-[#e50914] text-[#e50914]" />
            {rating}
          </span>
          <span>·</span>
          <span>{year || "2026"}</span>
          <span>·</span>
          <span>{type === "tv" ? "TV Show" : "Movie"}</span>
        </div>
      </div>
      )}
    </Link>
  );
}
