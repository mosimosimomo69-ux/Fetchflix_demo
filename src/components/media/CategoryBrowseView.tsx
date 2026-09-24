"use client";

import React, { useState } from "react";
import type { MediaItem } from "@/lib/api/tmdb";
import { MediaCard } from "./MediaCard";

export interface CategoryTab {
  id: string;
  name: string;
  genreId?: number;
  sortBy?: string;
}

interface CategoryBrowseViewProps {
  type: "movie" | "tv";
  title?: string;
  initialItems: MediaItem[];
  tabs: CategoryTab[];
}

export function CategoryBrowseView({
  type,
  title,
  initialItems,
  tabs,
}: CategoryBrowseViewProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || "popular");
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [loading, setLoading] = useState<boolean>(false);

  const handleTabChange = async (tab: CategoryTab) => {
    setActiveTab(tab.id);
    setLoading(true);

    try {
      let url = `/api/category?type=${type}`;
      if (tab.genreId) {
        url += `&genreId=${tab.genreId}`;
      }
      if (tab.sortBy) {
        url += `&sortBy=${tab.sortBy}`;
      } else if (tab.id === "popular") {
        url += `&sortBy=popularity.desc`;
      } else if (tab.id === "rating") {
        url += `&sortBy=vote_average.desc`;
      } else if (tab.id === "recent") {
        url += `&sortBy=primary_release_date.desc`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.results || []);
      }
    } catch (err) {
      console.error("Failed to load category items:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-12 md:px-8 space-y-6">

      {/* Optional Title */}
      {title && (
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            {title}
          </h1>
        </div>
      )}

      {/* Horizontal Category Tabs (matching screenshots 094545.png & 094610.png) */}
      <div className="relative border-b border-white/[0.08] pb-1">
        <div className="scrollbar-hide flex items-center gap-6 overflow-x-auto whitespace-nowrap py-2 text-sm font-semibold">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab)}
                className={`relative pb-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                {tab.name}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#e50914]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Media Grid matching screenshot 094610.png */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-opacity duration-200 ${
          loading ? "opacity-40" : "opacity-100"
        }`}
      >
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            variant="backdrop"
            forceType={type}
          />
        ))}
      </div>


      {items.length === 0 && !loading && (
        <div className="py-16 text-center text-white/40">
          No content available in this category.
        </div>
      )}
    </div>
  );
}
