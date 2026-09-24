import React from "react";
import { get4KMedia, withFallback, EMPTY_PAGED } from "@/lib/api/tmdb";
import { MediaCard } from "@/components/media/MediaCard";
import { InfoTooltip } from "./InfoTooltip";

export const revalidate = 3600;

export default async function FourKPage() {
  const data = await withFallback(() => get4KMedia(1), EMPTY_PAGED);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-12 md:px-8 space-y-6">

      {/* Header matching screenshot 094644.png */}
      <div className="flex items-center gap-2.5">
        <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          4K
        </h1>
        <InfoTooltip />
      </div>

      {/* 4K Movies Grid matching 4-column landscape title posters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data.results.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            variant="backdrop"
            is4k={true}
            forceType="movie"
          />
        ))}
      </div>

    </div>
  );
}
