"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
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

  // State: selected server (default: vidlink) & iframe refresh counter
  const [selectedServer, setSelectedServer] = useState<string>("vidlink");
  const [isServerMenuOpen, setIsServerMenuOpen] = useState<boolean>(false);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save to history on mount
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
      type === "tv" ? initialSeason : undefined,
      type === "tv" ? initialEpisode : undefined
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
    initialSeason,
    initialEpisode,
    addToHistory,
  ]);

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
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  }, []);

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
        } else {
          handleBack();
        }
      } else if (e.key === "r" || e.key === "R") {
        handleRefresh();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack, isServerMenuOpen, handleRefresh]);

  // Auto-hide top overlay header on inactivity
  const handleMouseMove = useCallback(() => {
    setShowOverlay(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isServerMenuOpen) {
        setShowOverlay(false);
      }
    }, 3500);
  }, [isServerMenuOpen]);

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

  // Generate Embed URL depending on selected server
  const getEmbedUrl = (serverId: string) => {
    const id = details.id;
    const season = initialSeason;
    const episode = initialEpisode;

    switch (serverId) {
      case "cinesrc":
        return type === "tv"
          ? `https://cinesrc.st/embed/tv/${id}?s=${season}&e=${episode}`
          : `https://cinesrc.st/embed/movie/${id}`;
      case "nexus":
        return type === "tv"
          ? `https://nxsha.space/embed/tv/${id}/${season}/${episode}?lang=en&autoplay=true&sub=en`
          : `https://nxsha.space/embed/movie/${id}?lang=en&autoplay=true&sub=en`;
      case "aura":
        return type === "tv"
          ? `https://vidgod.site/tv/${id}/${season}/${episode}?autoPlay=true`
          : `https://vidgod.site/movie/${id}?autoPlay=true`;
      case "filix":
        return type === "tv"
          ? `https://nhdapi.com/tv/${id}/${season}/${episode}?autoPlay=true`
          : `https://nhdapi.com/movie/${id}?autoPlay=true`;
      case "vidlink":
        return type === "tv"
          ? `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=e50914&secondaryColor=e50914&autoplay=true`
          : `https://vidlink.pro/movie/${id}?primaryColor=e50914&secondaryColor=e50914&autoplay=true`;
      case "vidking":
        return type === "tv"
          ? `https://www.vidking.net/embed/tv/${id}/${season}/${episode}?color=e50914&autoPlay=true`
          : `https://www.vidking.net/embed/movie/${id}?color=e50914&autoPlay=true`;
      case "vidsrcto":
        return type === "tv"
          ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
          : `https://vidsrc.to/embed/movie/${id}`;
      case "vidsrcme":
        return type === "tv"
          ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
          : `https://vidsrc.me/embed/movie?tmdb=${id}`;
      case "vidsrcpm":
        return type === "tv"
          ? `https://vidsrc.pm/embed/tv/${id}/${season}/${episode}`
          : `https://vidsrc.pm/embed/movie/${id}`;
      case "2embed":
        return type === "tv"
          ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
          : `https://www.2embed.cc/embed/${id}`;
      default:
        return type === "tv"
          ? `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=e50914&secondaryColor=e50914&autoplay=true`
          : `https://vidlink.pro/movie/${id}?primaryColor=e50914&secondaryColor=e50914&autoplay=true`;
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
        key={`${selectedServer}-${type}-${details.id}-${initialSeason}-${initialEpisode}-${refreshKey}`}
        src={embedUrl}
        className="h-full w-full border-0 bg-black"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        referrerPolicy="origin"
      />

      {/* 2. Top Header Controls & FetchFlix Watermark */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        {/* Background gradient (fades out when controls hide) */}
        <div
          className={`absolute inset-0 bg-gradient-to-b from-black/95 via-black/50 to-transparent pb-16 transition-opacity duration-300 pointer-events-none ${
            showOverlay || isServerMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="relative px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between">
          {/* Left: Close Button + Clean Server Dropdown (Fades out when inactive) */}
          <div
            className={`flex items-center gap-2 sm:gap-2.5 transition-opacity duration-300 ${
              showOverlay || isServerMenuOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            {/* 1. Sleek Glass Close Button (Compact) */}
            <button
              onClick={handleBack}
              aria-label="Close player (Esc)"
              title="Close player (Esc)"
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-black/80 text-white/90 backdrop-blur-md transition-all hover:bg-white hover:text-black hover:scale-105 active:scale-95 shadow-xl border border-white/15 cursor-pointer"
            >
              <X className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </button>

            {/* 2. Clean Server Dropdown (No icons in trigger or menu) */}
            <div className="relative">
              <button
                onClick={() => setIsServerMenuOpen((prev) => !prev)}
                aria-expanded={isServerMenuOpen}
                title="Select streaming server"
                className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium backdrop-blur-md transition-all shadow-2xl border cursor-pointer ${
                  isServerMenuOpen
                    ? "bg-[#e50914] text-white border-[#e50914]"
                    : "bg-black/80 text-white/90 hover:bg-white/15 hover:border-white/30 border-white/15"
                }`}
              >
                <span className="font-semibold text-white truncate max-w-[100px] sm:max-w-[140px]">
                  {currentServerObj.name.replace(" (Default)", "")}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 text-zinc-400 ${
                    isServerMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Server Selection Dropdown (Zero icons) */}
              {isServerMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsServerMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl bg-[#121218] border border-white/15 p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    {/* Header with Title and Outlined Refresh Button (No icons) */}
                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 mb-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Select Server
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefresh();
                        }}
                        aria-label="Refresh player stream"
                        title="Reload stream (R)"
                        className="rounded-lg border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:text-white transition-all cursor-pointer active:scale-95"
                      >
                        {isRefreshing ? "Refreshing..." : "Refresh"}
                      </button>
                    </div>

                    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                      {VIDEO_SERVERS.map((server) => {
                        const isSelected = selectedServer === server.id;
                        return (
                          <button
                            key={server.id}
                            onClick={() => {
                              setSelectedServer(server.id);
                              setIsServerMenuOpen(false);
                            }}
                            className={`flex w-full items-start justify-between rounded-xl p-2.5 text-left transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#e50914]/20 text-white border border-[#e50914]/40 shadow-inner"
                                : "text-zinc-300 hover:bg-white/10 hover:text-white border border-transparent"
                            }`}
                          >
                            <div className="space-y-0.5 pr-2">
                              <div className="flex items-center gap-1.5 text-xs font-semibold">
                                <span className={isSelected ? "text-white font-bold" : "text-zinc-200"}>
                                  {server.name}
                                </span>
                                {server.id === "vidlink" && (
                                  <span className="rounded border border-red-500/60 bg-transparent px-1.5 py-0.5 text-[9px] font-bold text-red-400">
                                    MAIN
                                  </span>
                                )}
                                {server.is4k && (
                                  <span className="rounded border border-amber-500/60 bg-transparent px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                                    4K
                                  </span>
                                )}
                                {"isMultiAudio" in server && Boolean((server as { isMultiAudio?: boolean }).isMultiAudio) && (
                                  <span className="rounded border border-emerald-500/60 bg-transparent px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                                    MULTI-AUDIO
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-tight">
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
          </div>

          {/* Right: FetchFlix Logo Watermark */}
          {/* While playing: disappears to very faint watermark (opacity-20). In Fullscreen: hidden (opacity-0). On pause/hover: fully visible (opacity-90). */}
          <div
            className={`pointer-events-none select-none transition-all duration-500 ${
              isFullscreen
                ? "opacity-0 scale-95"
                : showOverlay || isServerMenuOpen
                ? "opacity-90 scale-100"
                : "opacity-20 scale-100"
            }`}
          >
            <div className="relative h-5 sm:h-6 w-20 sm:w-24 drop-shadow-md">
              <Image
                src="/fetchflix.png"
                alt="Fetchflix"
                fill
                priority
                className="object-contain object-right"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
