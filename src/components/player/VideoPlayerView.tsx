"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { MediaDetails } from "@/lib/api/tmdb";
import { useAuth } from "@/context/AuthContext";
import { VIDEO_SERVERS } from "@/lib/constants";

interface VideoPlayerViewProps {
  details: MediaDetails;
  type: "movie" | "tv";
  initialSeason?: number;
  initialEpisode?: number;
  onClose?: () => void;
}

export function VideoPlayerView({
  details,
  type,
  initialSeason = 1,
  initialEpisode = 1,
  onClose,
}: VideoPlayerViewProps) {
  const router = useRouter();
  const { addToHistory } = useAuth();

  // State: selected server (default: vidking or persisted preference)
  const [selectedServer, setSelectedServer] = useState<string>("vidking");
  const [currentSeason, setCurrentSeason] = useState<number>(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState<number>(initialEpisode);
  const [isEpisodeMenuOpen, setIsEpisodeMenuOpen] = useState<boolean>(false);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const [isServerMenuOpen, setIsServerMenuOpen] = useState<boolean>(false);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentSeason(initialSeason);
  }, [initialSeason]);

  useEffect(() => {
    setCurrentEpisode(initialEpisode);
  }, [initialEpisode]);

  // Restore preferred server from localStorage if set
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fetchflix_player_server");
      if (saved && VIDEO_SERVERS.some((s) => s.id === saved)) {
        setSelectedServer(saved);
      }
    } catch {}
  }, []);

  // Save to history on mount or episode change
  useEffect(() => {
    addToHistory(
      {
        id: details.id,
        title: details.title,
        name: details.name,
        overview: details.overview,
        poster_path: details.poster_path,
        backdrop_path: details.backdrop_path,
        release_date: details.release_date,
        first_air_date: details.first_air_date,
        vote_average: details.vote_average,
      },
      10,
      type === "tv" ? currentSeason : undefined,
      type === "tv" ? currentEpisode : undefined
    );
  }, [
    details.id,
    details.title,
    details.name,
    details.overview,
    details.poster_path,
    details.backdrop_path,
    details.release_date,
    details.first_air_date,
    details.vote_average,
    type,
    currentSeason,
    currentEpisode,
    addToHistory,
  ]);

  // Valid seasons calculation for TV shows
  const validSeasons = useMemo(
    () => (details.seasons || []).filter((s) => s.season_number > 0 && s.episode_count > 0),
    [details.seasons]
  );
  const activeSeasonSummary =
    validSeasons.find((s) => s.season_number === currentSeason) || validSeasons[0];
  const maxEpisodes = activeSeasonSummary?.episode_count || 30;

  const handleSelectEpisode = (seasonNum: number, episodeNum: number) => {
    setCurrentSeason(seasonNum);
    setCurrentEpisode(episodeNum);
    setIsEpisodeMenuOpen(false);
    setIsIframeLoading(true);
    setRefreshKey((prev) => prev + 1);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("play", "true");
      url.searchParams.set("season", String(seasonNum));
      url.searchParams.set("episode", String(episodeNum));
      window.history.replaceState(null, "", url.toString());
    }
  };

  const handleBack = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.push(`/${type}/${details.id}`);
    }
  }, [onClose, router, type, details.id]);

  // Reload / Refresh Player
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setIsIframeLoading(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  }, []);

  const handleSelectServer = (serverId: string) => {
    setSelectedServer(serverId);
    setIsServerMenuOpen(false);
    setIsIframeLoading(true);
    try {
      localStorage.setItem("fetchflix_player_server", serverId);
    } catch {}
  };

  // Keyboard shortcut listener (Escape to exit, R to refresh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "Escape") {
        if (isServerMenuOpen) {
          setIsServerMenuOpen(false);
        } else if (isEpisodeMenuOpen) {
          setIsEpisodeMenuOpen(false);
        } else {
          handleBack();
        }
      } else if (e.key === "r" || e.key === "R") {
        handleRefresh();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack, isServerMenuOpen, isEpisodeMenuOpen, handleRefresh]);

  // Auto-hide top overlay header on inactivity
  const handleMouseMove = useCallback(() => {
    setShowOverlay(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isServerMenuOpen && !isEpisodeMenuOpen) {
        setShowOverlay(false);
      }
    }, 3500);
  }, [isServerMenuOpen, isEpisodeMenuOpen]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [handleMouseMove]);

  // Track fullscreen mode to hide watermark when in full screen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Shield against popup windows, ad redirects, and focus stealing across all players
  useEffect(() => {
    // 1. Intercept any top-level window.open calls from embedded scripts
    const originalOpen = window.open;
    window.open = function (...args) {
      console.warn("[FetchFlix Shield] Blocked top-level popup window.open attempt:", args);
      return null;
    };

    // 2. Prevent unauthorized top-level window redirects
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return (e.returnValue = "");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 3. Track clicks and refocus if window lost focus due to an ad popup attempt
    let lastInteractionTime = 0;
    const handleUserInteraction = () => {
      lastInteractionTime = Date.now();
    };
    const handleWindowBlur = () => {
      if (Date.now() - lastInteractionTime < 1500) {
        window.focus();
      }
    };

    window.addEventListener("click", handleUserInteraction, true);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.open = originalOpen;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("click", handleUserInteraction, true);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  // Generate Embed URL depending on selected server
  const getEmbedUrl = (serverId: string) => {
    const id = details.id;
    const season = currentSeason;
    const episode = currentEpisode;

    switch (serverId) {
      case "vidking":
        return type === "tv"
          ? `https://player.videasy.to/tv/${id}/${season}/${episode}`
          : `https://player.videasy.to/movie/${id}`;
      case "peachify":
        return type === "tv"
          ? `https://peachify.pro/embed/tv/${id}/${season}/${episode}`
          : `https://peachify.pro/embed/movie/${id}`;
      case "videasy":
        return type === "tv"
          ? `https://player.videasy.to/tv/${id}/${season}/${episode}`
          : `https://player.videasy.to/movie/${id}`;
      case "vidnest":
        return `/api/player?server=vidnest&type=${type}&id=${id}&season=${season}&episode=${episode}`;
      case "smashy":
        return type === "tv"
          ? `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${season}&episode=${episode}`
          : `https://embed.smashystream.com/playere.php?tmdb=${id}`;
      case "vidup":
        return type === "tv"
          ? `https://nhdapi.com/tv/${id}/${season}/${episode}?autoPlay=true`
          : `https://nhdapi.com/movie/${id}?autoPlay=true`;
      case "vidfast":
        return type === "tv"
          ? `https://vidfast.pro/tv/${id}/${season}/${episode}`
          : `https://vidfast.pro/movie/${id}`;
      case "vidlink":
        return type === "tv"
          ? `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=e50914&secondaryColor=e50914&autoplay=true`
          : `https://vidlink.pro/movie/${id}?primaryColor=e50914&secondaryColor=e50914&autoplay=true`;
      case "vidmov":
        return type === "tv"
          ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
          : `https://vidsrc.to/embed/movie/${id}`;
      case "vidfyi":
        return type === "tv"
          ? `https://vidsrc.pm/embed/tv/${id}/${season}/${episode}`
          : `https://vidsrc.pm/embed/movie/${id}`;
      case "vidrock":
        return `/api/player?server=vidrock&type=${type}&id=${id}&season=${season}&episode=${episode}`;
      case "movies111":
        return `/api/player?server=movies111&type=${type}&id=${id}&season=${season}&episode=${episode}`;
      case "nontongo":
        return type === "tv"
          ? `https://www.nontongo.win/embed/tv/${id}/${season}/${episode}`
          : `https://www.nontongo.win/embed/movie/${id}`;
      case "vidsrc":
        return type === "tv"
          ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
          : `https://vidsrc.to/embed/movie/${id}`;
      case "hyperlink":
        return type === "tv"
          ? `https://nxsha.space/embed/tv/${id}/${season}/${episode}?lang=en&autoplay=true&sub=en`
          : `https://nxsha.space/embed/movie/${id}?lang=en&autoplay=true&sub=en`;
      case "nexastream":
        return type === "tv"
          ? `https://nxsha.space/embed/tv/${id}/${season}/${episode}?lang=en&autoplay=true&sub=en`
          : `https://nxsha.space/embed/movie/${id}?lang=en&autoplay=true&sub=en`;
      case "ultrabox":
        return type === "tv"
          ? `https://vidsrc.pm/embed/tv/${id}/${season}/${episode}`
          : `https://vidsrc.pm/embed/movie/${id}`;
      case "cloudbox":
        return type === "tv"
          ? `https://nhdapi.com/tv/${id}/${season}/${episode}?autoPlay=true`
          : `https://nhdapi.com/movie/${id}?autoPlay=true`;
      case "upcloud":
        return type === "tv"
          ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
          : `https://vidsrc.to/embed/movie/${id}`;
      case "streamvault":
        return type === "tv"
          ? `https://peachify.pro/embed/tv/${id}/${season}/${episode}`
          : `https://peachify.pro/embed/movie/${id}`;
      case "mediahub":
        return type === "tv"
          ? `https://player.videasy.to/tv/${id}/${season}/${episode}`
          : `https://player.videasy.to/movie/${id}`;
      case "cloudplay":
        return `/api/player?server=cloudplay&type=${type}&id=${id}&season=${season}&episode=${episode}`;
      case "streamboxhd":
        return `/api/player?server=streamboxhd&type=${type}&id=${id}&season=${season}&episode=${episode}`;
      case "movievault":
        return type === "tv"
          ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
          : `https://www.2embed.cc/embed/${id}`;
      default:
        return type === "tv"
          ? `https://player.videasy.to/tv/${id}/${season}/${episode}`
          : `https://player.videasy.to/movie/${id}`;
    }
  };

  const embedUrl = getEmbedUrl(selectedServer);
  const currentServerObj =
    VIDEO_SERVERS.find((s) => s.id === selectedServer) || VIDEO_SERVERS[0];

  return (
    <div
      className="fixed inset-0 z-50 h-screen w-screen bg-black overflow-hidden select-none font-sans"
      onMouseMove={handleMouseMove}
    >
      {/* 1. Main Player Iframe */}
      <iframe
        key={`${selectedServer}-${type}-${details.id}-${currentSeason}-${currentEpisode}-${refreshKey}`}
        src={embedUrl}
        className="h-full w-full border-0 bg-black"
        allow="accelerometer; autoplay *; clipboard-write; encrypted-media *; gyroscope; picture-in-picture *; web-share; fullscreen *"
        allowFullScreen
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setIsIframeLoading(false)}
      />

      {/* 2. Buffering / Connecting Feedback Overlay */}
      {isIframeLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
          <div className="flex flex-col items-center max-w-sm px-6 text-center space-y-4 animate-in fade-in duration-200">
            <div className="relative flex items-center justify-center h-14 w-14">
              <div className="absolute inset-0 rounded-full border-2 border-red-600/30 animate-ping opacity-35" />
              <div className="h-10 w-10 rounded-full border-2 border-t-red-600 border-r-transparent border-b-white/20 border-l-transparent animate-spin" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-white tracking-wide">
                Connecting to {currentServerObj.name.replace(" (Default)", "")}...
              </p>
              <p className="text-xs text-zinc-400">
                Buffering high-speed stream for {details.title || details.name || "video"}
              </p>
            </div>

            <p className="text-[11px] text-zinc-400 bg-white/10 border border-white/15 rounded-full px-3 py-1">
              Tip: Server 2 (Peachify) & Server 4 (VidNest) offer instant playback
            </p>
          </div>
        </div>
      )}

      {/* 3. Top Header Controls & FetchFlix Watermark Logo */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        {/* Background gradient (fades out when controls hide) */}
        <div
          className={`absolute inset-0 bg-gradient-to-b from-black/95 via-black/50 to-transparent pb-16 transition-opacity duration-300 pointer-events-none ${
            showOverlay || isServerMenuOpen || isEpisodeMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="relative px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between">
          {/* Left: Close Button + Server Dropdown + Episode Controls (Completely disappears when video is playing/idle) */}
          <div
            className={`flex items-center gap-2 sm:gap-2.5 transition-all duration-300 ${
              showOverlay || isServerMenuOpen || isEpisodeMenuOpen
                ? "opacity-100 pointer-events-auto translate-y-0"
                : "opacity-0 pointer-events-none -translate-y-1.5"
            }`}
          >
            {/* 1. Sleek Liquid Glass Close Button */}
            <button
              onClick={handleBack}
              aria-label="Close player (Esc)"
              title="Close player (Esc)"
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-xl transition-all hover:bg-black/85 hover:text-white hover:scale-105 active:scale-95 shadow-xl border border-white/25 cursor-pointer"
            >
              <X className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </button>

            {/* 2. Server Selection Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsServerMenuOpen((prev) => !prev)}
                aria-expanded={isServerMenuOpen}
                title="Select streaming server"
                className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium backdrop-blur-xl transition-all shadow-xl border cursor-pointer ${
                  isServerMenuOpen
                    ? "bg-[#e50914]/35 text-white border-[#e50914]/70 shadow-[0_0_16px_rgba(229,9,20,0.35)]"
                    : "bg-white/15 text-white border-white/25 hover:bg-black/85 hover:border-white/15 hover:text-white/95"
                }`}
              >
                <span className="font-semibold truncate max-w-[105px] sm:max-w-[140px]">
                  {currentServerObj.name.replace(" (Default)", "")}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 text-zinc-300 ${
                    isServerMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Server Selection Dropdown - Liquid Glass Style */}
              {isServerMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsServerMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2.5 z-50 w-72 sm:w-80 rounded-2xl bg-black/65 backdrop-blur-2xl border border-white/20 pt-2.5 pb-2.5 px-0 overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-150">
                    {/* Header with Title and Liquid Glass Outlined Refresh Button */}
                    <div className="flex items-center justify-between px-3.5 pb-2 border-b border-white/15 mb-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                        Select Server
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefresh();
                        }}
                        aria-label="Refresh player stream"
                        title="Reload stream (R)"
                        className="rounded-lg border border-white/20 hover:border-white/10 bg-white/15 hover:bg-black/85 px-2.5 py-1 text-xs font-medium text-white transition-all cursor-pointer active:scale-95 backdrop-blur-md shadow-sm"
                      >
                        {isRefreshing ? "Refreshing..." : "Refresh"}
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-[60vh] overflow-y-auto px-2.5 pr-1.5">
                      {VIDEO_SERVERS.map((server) => {
                        const isSelected = selectedServer === server.id;
                        return (
                          <button
                            key={server.id}
                            onClick={() => handleSelectServer(server.id)}
                            className={`flex w-full items-start justify-between rounded-xl p-2.5 text-left transition-all cursor-pointer backdrop-blur-md ${
                              isSelected
                                ? "bg-[#e50914]/35 text-white border border-[#e50914]/70 shadow-[0_0_16px_rgba(229,9,20,0.35)]"
                                : "bg-white/10 border border-white/15 text-white shadow-sm hover:bg-black/85 hover:border-white/10 hover:text-white/90"
                            }`}
                          >
                            <div className="space-y-0.5 pr-2">
                              <div className="flex items-center gap-1.5 text-xs font-semibold">
                                <span className={isSelected ? "text-white font-bold" : "text-zinc-100"}>
                                  {server.name}
                                </span>
                                {server.id === "vidking" && (
                                  <span className="rounded border border-red-400/70 bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-300">
                                    MAIN
                                  </span>
                                )}
                                {server.is4k && (
                                  <span className="rounded border border-amber-400/70 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                                    4K
                                  </span>
                                )}
                                {"isMultiAudio" in server && Boolean((server as { isMultiAudio?: boolean }).isMultiAudio) && (
                                  <span className="rounded border border-emerald-400/70 bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                                    MULTI-AUDIO
                                  </span>
                                )}
                              </div>
                              <p className={`text-[11px] leading-tight ${isSelected ? "text-zinc-200" : "text-zinc-400"}`}>
                                {server.desc}
                              </p>
                            </div>
                            {isSelected && (
                              <span className="text-[11px] font-bold text-[#e50914] mt-0.5">
                                Active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 3. TV Episode Selector & Navigator (only for TV series) */}
            {type === "tv" && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Previous Episode Button */}
                <button
                  onClick={() => {
                    if (currentEpisode > 1) {
                      handleSelectEpisode(currentSeason, currentEpisode - 1);
                    } else {
                      const prevSeasonIndex =
                        validSeasons.findIndex((s) => s.season_number === currentSeason) - 1;
                      if (prevSeasonIndex >= 0) {
                        const prevSeason = validSeasons[prevSeasonIndex];
                        handleSelectEpisode(prevSeason.season_number, prevSeason.episode_count || 1);
                      }
                    }
                  }}
                  disabled={
                    currentEpisode <= 1 &&
                    validSeasons.findIndex((s) => s.season_number === currentSeason) <= 0
                  }
                  aria-label="Previous Episode"
                  title="Previous Episode"
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-xl transition-all hover:bg-black/85 hover:text-white hover:scale-105 active:scale-95 shadow-xl border border-white/25 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white/15"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Episode Selector Dropdown Trigger Button (Liquid Glass Style) */}
                <div className="relative">
                  <button
                    onClick={() => setIsEpisodeMenuOpen((prev) => !prev)}
                    aria-expanded={isEpisodeMenuOpen}
                    title="Select Season & Episode"
                    className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium backdrop-blur-xl transition-all shadow-xl border cursor-pointer ${
                      isEpisodeMenuOpen
                        ? "bg-[#e50914]/35 text-white border-[#e50914]/70 shadow-[0_0_16px_rgba(229,9,20,0.35)]"
                        : "bg-white/15 text-white border-white/25 hover:bg-black/85 hover:border-white/15 hover:text-white/95"
                    }`}
                  >
                    <span className="font-semibold whitespace-nowrap">
                      S{currentSeason} : E{currentEpisode}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 text-zinc-300 ${
                        isEpisodeMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Season & Episode Liquid Glass Dropdown Menu */}
                  {isEpisodeMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setIsEpisodeMenuOpen(false)}
                      />
                      <div className="absolute left-0 top-full mt-2.5 z-50 w-72 sm:w-80 rounded-2xl bg-black/65 backdrop-blur-2xl border border-white/20 p-3 shadow-[0_16px_48px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/15">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                            Select Episode
                          </span>
                          <span className="text-xs font-semibold text-zinc-400">
                            Season {currentSeason} ({maxEpisodes} Eps)
                          </span>
                        </div>

                        {/* Season Tabs (if multiple seasons exist) */}
                        {validSeasons.length > 1 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5 scrollbar-none">
                            {validSeasons.map((s) => (
                              <button
                                key={s.id || s.season_number}
                                onClick={() => handleSelectEpisode(s.season_number, 1)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer ${
                                  s.season_number === currentSeason
                                    ? "bg-red-600 text-white font-bold shadow-md"
                                    : "bg-white/10 text-zinc-300 hover:bg-white/20 hover:text-white"
                                }`}
                              >
                                Season {s.season_number}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Episodes Grid */}
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-56 overflow-y-auto pr-1">
                          {Array.from({ length: maxEpisodes }, (_, i) => i + 1).map((epNum) => {
                            const isCurrent = epNum === currentEpisode;
                            return (
                              <button
                                key={epNum}
                                onClick={() => handleSelectEpisode(currentSeason, epNum)}
                                className={`h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                                  isCurrent
                                    ? "bg-[#e50914] text-white font-bold shadow-[0_0_12px_rgba(229,9,20,0.5)] scale-105"
                                    : "bg-white/10 text-zinc-300 hover:bg-white/25 hover:text-white"
                                }`}
                              >
                                E{epNum}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Next Episode Button */}
                <button
                  onClick={() => {
                    if (currentEpisode < maxEpisodes) {
                      handleSelectEpisode(currentSeason, currentEpisode + 1);
                    } else {
                      const nextSeasonIndex =
                        validSeasons.findIndex((s) => s.season_number === currentSeason) + 1;
                      if (nextSeasonIndex < validSeasons.length) {
                        const nextSeason = validSeasons[nextSeasonIndex];
                        handleSelectEpisode(nextSeason.season_number, 1);
                      }
                    }
                  }}
                  disabled={
                    currentEpisode >= maxEpisodes &&
                    validSeasons.findIndex((s) => s.season_number === currentSeason) >=
                      validSeasons.length - 1
                  }
                  aria-label="Next Episode"
                  title="Next Episode"
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-xl transition-all hover:bg-black/85 hover:text-white hover:scale-105 active:scale-95 shadow-xl border border-white/25 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white/15"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right: FetchFlix Watermark Logo (Partially disappears when video is playing; hover makes it and left controls reappear; click goes Home) */}
          <div
            className={`transition-all duration-500 pointer-events-auto ${
              isFullscreen
                ? "opacity-0 scale-95 pointer-events-none"
                : showOverlay || isServerMenuOpen || isEpisodeMenuOpen
                ? "opacity-100 scale-100"
                : "opacity-25 hover:opacity-100 scale-100"
            }`}
            onMouseEnter={() => {
              setShowOverlay(true);
            }}
          >
            <button
              onClick={() => router.push("/")}
              aria-label="Go to Fetchflix Home"
              title="Go to Fetchflix Home"
              className="relative h-6 sm:h-7 w-20 sm:w-24 drop-shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0 flex items-center justify-end"
            >
              <Image
                src="/fetchflix.png"
                alt="Fetchflix"
                fill
                priority
                className="object-contain object-right"
                unoptimized
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
