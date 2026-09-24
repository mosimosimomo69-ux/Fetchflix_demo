"use client";

import React from "react";
import Link from "next/link";
import { Heart, Play, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { MediaCard } from "@/components/media/MediaCard";

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist, user, openLogin } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            My Watchlist
          </h1>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/70">
            {watchlist.length}
          </span>
        </div>
      </div>

      {/* Grid */}
      {watchlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {watchlist.map((item) => (
            <div key={item.id} className="group relative">
              <MediaCard item={item} variant="backdrop" />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFromWatchlist(item.id);
                }}
                className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-lg"
                title="Remove from watchlist"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

      ) : (
        <div className="rounded-2xl border border-white/5 bg-[#12121a] py-20 text-center max-w-lg mx-auto space-y-4">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-white/5 text-white/40">
            <Heart className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Your watchlist is empty</h3>
            <p className="text-xs text-white/50">
              Save your favorite movies and shows to watch them later.
            </p>
          </div>
          <Link
            href="/movie"
            className="inline-flex items-center gap-2 rounded-full bg-[#e50914] px-6 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors"
          >
            Explore Content
          </Link>
        </div>
      )}
    </div>
  );
}
