"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Play, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { backdropUrl, posterUrl, wsrvUrl } from "@/lib/api/tmdb";
import { getTitle, getYear, resolveMediaType } from "@/lib/utils";

export default function HistoryPage() {
  const { history, removeFromHistory, clearHistory } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Watch History
          </h1>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/70">
            {history.length}
          </span>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161622] px-3.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Grid of continue watching items */}
      {history.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {history.map((item) => {
            const type = resolveMediaType(item);
            const title = getTitle(item);
            const progress = item.progress || 25;
            const watchLink =
              type === "tv" && item.season && item.episode
                ? `/tv/${item.id}?play=true&season=${item.season}&episode=${item.episode}`
                : `/${type}/${item.id}?play=true`;

            return (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-white/5 bg-[#12121a] overflow-hidden transition-all hover:border-white/20 hover:scale-[1.02]"
              >
                {/* Backdrop with Progress Bar */}
                <div className="relative aspect-video w-full overflow-hidden bg-[#161622]">
                  <Image
                    src={
                      item.backdrop_path
                        ? wsrvUrl(backdropUrl(item.backdrop_path, "w780"))
                        : wsrvUrl(posterUrl(item.poster_path, "w500"))
                    }
                    alt={title}
                    fill
                    sizes="320px"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Play Button Overlay */}
                  <Link
                    href={watchLink}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e50914] text-white shadow-xl">
                      <Play className="h-5 w-5 fill-white translate-x-0.5" />
                    </div>
                  </Link>

                  {/* Progress Scrubber */}
                  <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20">
                    <div
                      style={{ width: `${progress}%` }}
                      className="h-full bg-[#e50914]"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="p-3.5 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={watchLink}
                      className="truncate text-sm font-bold text-white hover:text-[#e50914] transition-colors block"
                    >
                      {title}
                    </Link>
                    <p className="mt-0.5 text-xs text-white/50">
                      {type === "tv" && item.season && item.episode
                        ? `S${item.season} E${item.episode}`
                        : getYear(item) || "Movie"}
                      {" · "}
                      {progress}% watched
                    </p>
                  </div>

                  <button
                    onClick={() => removeFromHistory(item.id)}
                    className="p-1 text-white/40 hover:text-red-400 transition-colors"
                    title="Remove from history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-[#12121a] py-20 text-center max-w-lg mx-auto space-y-4">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-white/5 text-white/40">
            <Clock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No history yet</h3>
            <p className="text-xs text-white/50">
              Titles you watch on Cineby will automatically appear here.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#e50914] px-6 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors"
          >
            Start Watching
          </Link>
        </div>
      )}
    </div>
  );
}
