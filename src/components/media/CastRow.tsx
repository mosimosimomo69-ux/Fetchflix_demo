import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CastMember } from "@/lib/api/tmdb";
import { profileUrl, wsrvUrl } from "@/lib/api/tmdb";

interface CastRowProps {
  cast: CastMember[];
}

export function CastRow({ cast }: CastRowProps) {
  if (!cast || cast.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Header with red indicator bar (matching screenshot show series info (1).png) */}
      <div className="flex items-center gap-2.5">
        <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
        <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
          Actors
        </h2>
      </div>

      {/* Grid of actor cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {cast.slice(0, 12).map((person) => (
          <Link
            key={person.id}
            href={`/person/${person.id}`}
            className="group flex items-center gap-3.5 rounded-2xl border border-white/5 bg-[#12121a] p-3 transition-all duration-200 hover:border-white/20 hover:bg-[#181824] hover:scale-[1.02] cursor-pointer"
          >
            {/* Circular Avatar */}
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[#1a1a24] border border-white/10 group-hover:border-[#e50914]/50 transition-colors">
              <Image
                src={wsrvUrl(profileUrl(person.profile_path))}
                alt={person.name}
                fill
                sizes="48px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            </div>

            {/* Names */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white group-hover:text-[#e50914] transition-colors">
                {person.name}
              </p>
              <p className="truncate text-xs text-white/50">
                {person.character || "Actor"}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>
    </section>
  );
}
