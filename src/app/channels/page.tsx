"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Search, Radio, Play, X, ExternalLink } from "lucide-react";
import { SPORTS_CATEGORIES } from "@/lib/constants";

interface SportsEvent {
  id: string;
  title: string;
  category: string;
  league: string;
  teams: [string, string];
  score?: string;
  time: string;
  backdrop: string;
  streamUrl?: string;
}

const SAMPLE_EVENTS: SportsEvent[] = [
  {
    id: "sp-1",
    title: "Arsenal vs Chelsea",
    category: "Football",
    league: "Premier League",
    teams: ["Arsenal", "Chelsea"],
    score: "2 - 1",
    time: "65'",
    backdrop: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "sp-2",
    title: "Lakers vs Celtics",
    category: "Basketball",
    league: "NBA",
    teams: ["LA Lakers", "Boston Celtics"],
    score: "98 - 95",
    time: "Q4 03:20",
    backdrop: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "sp-3",
    title: "Chiefs vs 49ers",
    category: "American Football",
    league: "NFL",
    teams: ["KC Chiefs", "SF 49ers"],
    score: "24 - 20",
    time: "Q3 08:45",
    backdrop: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "sp-4",
    title: "UFC 312: Pereira vs Ankalaev",
    category: "Fight",
    league: "UFC",
    teams: ["Pereira", "Ankalaev"],
    time: "Main Card Live",
    backdrop: "https://images.unsplash.com/photo-1517438322307-e67111335449?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "sp-5",
    title: "Monaco Grand Prix - Race Day",
    category: "Motor Sports",
    league: "Formula 1",
    teams: ["Red Bull", "Ferrari"],
    time: "Lap 42/78",
    backdrop: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "sp-6",
    title: "Yankees vs Red Sox",
    category: "Baseball",
    league: "MLB",
    teams: ["NY Yankees", "Boston Red Sox"],
    score: "4 - 2",
    time: "Bot 7th",
    backdrop: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?q=80&w=800&auto=format&fit=crop",
  },
];

export default function ChannelsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All Sports");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStream, setActiveStream] = useState<SportsEvent | null>(null);

  const filteredEvents = SAMPLE_EVENTS.filter((ev) => {
    const matchesCategory =
      activeCategory === "All Sports" || ev.category === activeCategory;
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.league.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-16 md:px-8 space-y-12">

      {/* Title & Description matching screenshot 094629.png */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
          Live Sports
        </h1>
        <p className="text-sm md:text-base text-white/60">
          Watch your favorite sports live in high quality. Never miss a game again.
        </p>

        {/* Search Sports Events Input */}
        <div className="pt-3 max-w-lg mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search sports events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#14141c] pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#e50914]"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          {SPORTS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-white text-black shadow-lg"
                  : "border border-white/10 bg-[#14141c] text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Live Now Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
          <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
            Live Now
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => setActiveStream(event)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] transition-all duration-300 hover:border-red-500/40 hover:scale-[1.02] hover:shadow-2xl"
            >
              {/* Event Poster / Backdrop */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1a1a24]">
                <Image
                  src={event.backdrop}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-black/40 to-transparent" />

                {/* LIVE Badge */}
                <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-lg backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  LIVE
                </div>

                {/* League Badge */}
                <div className="absolute right-3 top-3 z-10 rounded-lg bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur">
                  {event.league}
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e50914] text-white shadow-xl">
                    <Play className="h-5 w-5 fill-white translate-x-0.5" />
                  </div>
                </div>
              </div>

              {/* Match Details */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#e50914] uppercase tracking-wider">
                    {event.category}
                  </span>
                  <span className="text-xs text-white/50">{event.time}</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#e50914] transition-colors truncate">
                  {event.title}
                </h3>
                {event.score && (
                  <p className="text-xs font-mono font-bold text-white/80">
                    Score: <span className="text-red-400">{event.score}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Stream Player Modal */}
      {activeStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setActiveStream(null)}
          />
          <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d12] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  <Radio className="h-3.5 w-3.5 animate-pulse" />
                  LIVE STREAM
                </div>
                <h3 className="text-sm font-bold text-white">{activeStream.title}</h3>
              </div>
              <button
                onClick={() => setActiveStream(null)}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src="https://www.youtube-nocookie.com/embed/live_stream?channel=UC4R8DWoMoI7CAwX8_BQQ5vg&autoplay=1"
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="p-4 flex items-center justify-between text-xs text-white/60">
              <span>Streaming in 1080p 60fps HD</span>
              <span>Ultra Low Latency</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
