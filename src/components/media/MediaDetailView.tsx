"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Volume2,
  VolumeX,
  Play,
  Plus,
  Check,
  Download,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import type { MediaDetails, MediaType } from "@/lib/api/tmdb";
import { backdropUrl, logoUrl, wsrvUrl } from "@/lib/api/tmdb";
import {
  formatRating,
  formatRuntime,
  getTitle,
  getYear,
  resolveMediaType,
} from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { CastRow } from "./CastRow";
import { SeasonBrowser } from "./SeasonBrowser";
import { MediaCard } from "./MediaCard";
import { VideoPlayerView } from "@/components/player/VideoPlayerView";

interface MediaDetailViewProps {
  details: MediaDetails;
  type: MediaType;
  initialPlay?: boolean;
  initialSeason?: number;
  initialEpisode?: number;
}

export function MediaDetailView({
  details,
  type,
  initialPlay = false,
  initialSeason = 1,
  initialEpisode = 1,
}: MediaDetailViewProps) {
  const router = useRouter();
  const { watchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const [isPlaying, setIsPlaying] = useState(initialPlay);
  const [activeSeason, setActiveSeason] = useState(initialSeason);
  const [activeEpisode, setActiveEpisode] = useState(initialEpisode);
  const [muted, setMuted] = useState(true);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const episodesRef = useRef<HTMLDivElement>(null);
  const similarRef = useRef<HTMLDivElement>(null);

  const handleStartPlay = (season = 1, episode = 1) => {
    setActiveSeason(season);
    setActiveEpisode(episode);
    setIsPlaying(true);
    const playUrl = `${window.location.pathname}?play=true${
      type === "tv" ? `&season=${season}&episode=${episode}` : ""
    }`;
    window.history.pushState(null, "", playUrl);
  };

  const handleClosePlay = () => {
    setIsPlaying(false);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const isSaved = watchlist.some((item) => item.id === details.id);

  const toggleWatchlist = () => {
    if (isSaved) {
      removeFromWatchlist(details.id);
    } else {
      addToWatchlist({
        id: details.id,
        title: details.title,
        name: details.name,
        overview: details.overview,
        poster_path: details.poster_path,
        backdrop_path: details.backdrop_path,
        logo_path: details.logo_path,
        release_date: details.release_date,
        first_air_date: details.first_air_date,
        vote_average: details.vote_average,
        media_type: type,
      });
    }
  };

  const scrollToEpisodes = () => {
    episodesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSimilars = () => {
    similarRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const title = getTitle(details);
  const year = getYear(details) || "2026";
  const rating = formatRating(details.vote_average);
  const runtime = formatRuntime(details.runtime || details.episode_run_time?.[0]);
  const genres = (details.genres || []).map((g) => g.name).join(" · ");
  const cast = details.credits?.cast || [];
  const similar = (
    details.recommendations?.results?.length
      ? details.recommendations.results
      : details.similar?.results || []
  ).filter((i) => i.backdrop_path || i.poster_path);

  const trailer =
    details.videos?.results?.find(
      (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
    ) ||
    details.videos?.results?.find(
      (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
    ) ||
    details.videos?.results?.find((v) => v.site === "YouTube");
  const trailerKey = trailer?.key;

  if (isPlaying) {
    return (
      <VideoPlayerView
        details={details}
        type={type}
        initialSeason={activeSeason}
        initialEpisode={activeEpisode}
        onClose={handleClosePlay}
      />
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Top Hero Showcase */}
      <div className="relative h-[80vh] min-h-[540px] max-h-[820px] w-full overflow-hidden bg-black">
        {/* Background Trailer Video or High-Res Backdrop Image */}
        {trailerKey ? (
          <div className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none">
            <iframe
              key={`trailer-${trailerKey}-${muted}`}
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${
                muted ? 1 : 0
              }&controls=0&loop=1&playlist=${trailerKey}&playsinline=1&rel=0&disablekb=1&modestbranding=1&iv_load_policy=3`}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[160%] w-[160%] min-w-full min-h-full border-0 opacity-85 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : details.backdrop_path ? (
          <Image
            src={wsrvUrl(backdropUrl(details.backdrop_path, "original"), 85)}
            alt={title}
            fill
            priority
            className="object-cover object-top"
            unoptimized
          />
        ) : null}

        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608] via-[#060608]/60 to-transparent w-full md:w-3/4" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent h-24" />

        {/* Top Control Bar */}
        <div className="absolute inset-x-0 top-0 z-20 mx-auto flex max-w-[1360px] items-center justify-between p-4 md:p-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-white hover:text-black"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Audio Mute Toggle */}
          {trailerKey && (
            <button
              onClick={() => setMuted(!muted)}
              aria-label="Toggle Audio"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-white hover:text-black"
            >
              {muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4 text-[#e50914]" />
              )}
            </button>
          )}
        </div>

        {/* Hero Details Content with matching layout */}
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1360px] px-6 sm:px-10 md:px-12 pb-12 md:pb-16">
          <div className="max-w-2xl space-y-4 pt-8 md:pt-14">
            {/* Distinct Stylized Title Logo or Reduced Bold Typography */}
            {details.logo_path ? (
              <div className="relative h-14 sm:h-18 md:h-22 w-auto max-w-[240px] sm:max-w-[320px] md:max-w-[380px]">
                <Image
                  src={wsrvUrl(logoUrl(details.logo_path, "w500"), 95)}
                  alt={title}
                  fill
                  priority
                  className="object-contain object-left drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]"
                  unoptimized
                />
              </div>
            ) : (
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white drop-shadow-2xl font-sans">
                {title}
              </h1>
            )}

            {/* Metadata line */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-white/80">
              <span className="flex items-center gap-1 text-[#e50914] font-bold">
                <Star className="h-3.5 w-3.5 fill-[#e50914]" />
                {rating}
              </span>
              <span className="text-white/40">·</span>
              <span>{year}</span>
              {runtime && (
                <>
                  <span className="text-white/40">·</span>
                  <span>{runtime}</span>
                </>
              )}
              {type === "tv" && details.number_of_seasons && (
                <>
                  <span className="text-white/40">·</span>
                  <span>
                    {details.number_of_seasons} Season
                    {details.number_of_seasons > 1 ? "s" : ""}
                  </span>
                </>
              )}
              {genres && (
                <>
                  <span className="text-white/40">·</span>
                  <span>{genres}</span>
                </>
              )}
            </div>

            {/* Overview description */}
            <p className="line-clamp-3 text-xs sm:text-sm leading-relaxed text-white/80 drop-shadow-md">
              {details.overview ||
                "Watch this thrilling title on Cineby in HD with multiple servers."}
            </p>

            {/* Action Buttons Row (matching Screenshot 2026-08-21 154503.png) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Play Button */}
              <button
                onClick={() => handleStartPlay(activeSeason, activeEpisode)}
                className="flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-black shadow-xl transition-all hover:bg-white/90 hover:scale-105 active:scale-95"
              >
                <Play className="h-4 w-4 fill-black" />
                Play
              </button>

              {/* Add to Watchlist Button */}
              <button
                onClick={toggleWatchlist}
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                  isSaved
                    ? "border-red-500 bg-[#e50914] text-white shadow-lg"
                    : "border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:border-white/40"
                }`}
                aria-label="Add to Watchlist"
              >
                {isSaved ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </button>

              {/* Episodes Button (TV only) */}
              {type === "tv" && (
                <button
                  onClick={scrollToEpisodes}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur transition-all hover:bg-white/20 hover:border-white/40"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Episodes
                </button>
              )}

              {/* Similars Button */}
              {similar.length > 0 && (
                <button
                  onClick={scrollToSimilars}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur transition-all hover:bg-white/20 hover:border-white/40"
                >
                  <Sparkles className="h-4 w-4" />
                  Similars
                </button>
              )}

              {/* Download Button */}
              <button
                onClick={() => setDownloadModalOpen(true)}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur transition-all hover:bg-white/20 hover:border-white/40"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Body with exact margin & padding matching Screenshot 2026-08-21 154503.png */}
      <div className="mx-auto max-w-[1360px] px-6 sm:px-10 md:px-12 py-10 space-y-12 md:space-y-16">
        {/* TV Show Seasons & Episodes */}
        {type === "tv" && details.seasons && (
          <div ref={episodesRef}>
            <SeasonBrowser tvId={details.id} seasons={details.seasons} />
          </div>
        )}

        {/* Actors Section */}
        {cast.length > 0 && <CastRow cast={cast} />}

        {/* You May Like / Related Shows Section */}
        {similar.length > 0 && (
          <div ref={similarRef} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
              <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                You may like
              </h2>
            </div>

            {/* 3-column 16:9 Backdrop Grid matching screenshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {similar.slice(0, 12).map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  variant="backdrop"
                  forceType={type}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Download Modal */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setDownloadModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d12] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                Download {title}
              </h3>
              <button
                onClick={() => setDownloadModalOpen(false)}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Select your preferred quality to download via high-speed P2P CDN:
            </p>

            <div className="space-y-2">
              <a
                href={`https://www.vidking.net/download?id=${details.id}&quality=1080p`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-white/5 bg-[#14141c] p-3 text-sm font-semibold text-white hover:border-[#e50914] transition-colors"
              >
                <span>1080p Full HD (MKV)</span>
                <span className="text-xs text-white/50">2.4 GB</span>
              </a>

              <a
                href={`https://www.vidking.net/download?id=${details.id}&quality=720p`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-white/5 bg-[#14141c] p-3 text-sm font-semibold text-white hover:border-[#e50914] transition-colors"
              >
                <span>720p HD (MP4)</span>
                <span className="text-xs text-white/50">1.1 GB</span>
              </a>

              <a
                href={`https://www.vidking.net/download?id=${details.id}&quality=480p`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-white/5 bg-[#14141c] p-3 text-sm font-semibold text-white hover:border-[#e50914] transition-colors"
              >
                <span>480p SD (MP4)</span>
                <span className="text-xs text-white/50">540 MB</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
