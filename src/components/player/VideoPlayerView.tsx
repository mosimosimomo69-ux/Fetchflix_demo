"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Search,
  SkipForward,
  Play,
} from "lucide-react";
import type { MediaDetails, Episode } from "@/lib/api/tmdb";
import { stillUrl, backdropUrl, pickBestLogo, logoUrl } from "@/lib/api/tmdb";
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
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState<boolean>(false);
  const [modalSeason, setModalSeason] = useState<number>(initialSeason);
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
  const [isLoadingSeason, setIsLoadingSeason] = useState<boolean>(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState<boolean>(false);
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState<string>("");
  const [autoplayNext, setAutoplayNext] = useState<boolean>(true);
  const activeCardRef = useRef<HTMLDivElement | null>(null);

  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const [isServerMenuOpen, setIsServerMenuOpen] = useState<boolean>(false);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentSeason(initialSeason);
    setModalSeason(initialSeason);
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

  // Restore autoplay next preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fetchflix_autoplay_next");
      if (saved !== null) {
        setAutoplayNext(saved === "true");
      }
    } catch {}
  }, []);

  const toggleAutoplayNext = () => {
    setAutoplayNext((prev) => {
      const nextVal = !prev;
      try {
        localStorage.setItem("fetchflix_autoplay_next", String(nextVal));
      } catch {}
      return nextVal;
    });
  };

  // Fetch season episodes when modalSeason changes
  useEffect(() => {
    if (type !== "tv" || !details.id) return;
    let isCancelled = false;
    setIsLoadingSeason(true);

    fetch(`/api/season?tvId=${details.id}&season=${modalSeason}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch season details");
        return res.json();
      })
      .then((data) => {
        if (!isCancelled && data?.episodes && Array.isArray(data.episodes)) {
          setSeasonEpisodes(data.episodes);
        }
      })
      .catch((err) => {
        console.warn("Could not load season details:", err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingSeason(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [type, details.id, modalSeason]);

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
  const validSeasons = useMemo(() => {
    const filtered = (details.seasons || []).filter(
      (s) => s.season_number > 0 && s.episode_count > 0
    );
    if (filtered.length > 0) return filtered;
    return [
      {
        id: 1,
        season_number: 1,
        name: "Season 1",
        episode_count: details.number_of_episodes || 10,
        poster_path: null,
      },
    ];
  }, [details.seasons, details.number_of_episodes]);

  const activeSeasonSummary =
    validSeasons.find((s) => s.season_number === modalSeason) || validSeasons[0];
  const maxEpisodesForSeason = activeSeasonSummary?.episode_count || 30;

  const logoFile = useMemo(
    () => pickBestLogo(details.images?.logos),
    [details.images?.logos]
  );

  const episodesToDisplay: Episode[] = useMemo(() => {
    let list: Episode[] = [];
    if (seasonEpisodes.length > 0 && seasonEpisodes[0].season_number === modalSeason) {
      list = seasonEpisodes;
    } else {
      list = Array.from({ length: maxEpisodesForSeason }, (_, i) => ({
        id: i + 1,
        name: `Episode ${i + 1}`,
        overview: details.overview || "",
        episode_number: i + 1,
        season_number: modalSeason,
        still_path: details.backdrop_path || details.poster_path || null,
        runtime: details.episode_run_time?.[0] || 42,
      }));
    }

    if (!episodeSearchQuery.trim()) {
      return list;
    }

    const q = episodeSearchQuery.trim().toLowerCase();
    return list.filter(
      (ep) =>
        ep.name.toLowerCase().includes(q) ||
        String(ep.episode_number).includes(q) ||
        (ep.overview && ep.overview.toLowerCase().includes(q))
    );
  }, [seasonEpisodes, modalSeason, maxEpisodesForSeason, details, episodeSearchQuery]);

  const currentEpisodeObj = useMemo(() => {
    if (seasonEpisodes.length > 0 && seasonEpisodes[0].season_number === currentSeason) {
      const found = seasonEpisodes.find((ep) => ep.episode_number === currentEpisode);
      if (found) return found;
    }
    return {
      id: currentEpisode,
      name: `Episode ${currentEpisode}`,
      overview: details.overview || "",
      episode_number: currentEpisode,
      season_number: currentSeason,
      still_path: details.backdrop_path || null,
      runtime: details.episode_run_time?.[0] || 42,
    };
  }, [seasonEpisodes, currentEpisode, currentSeason, details]);

  const formatRuntime = (mins?: number) => {
    if (!mins || mins <= 0) mins = details.episode_run_time?.[0] || 42;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    if (hours > 0) {
      return `${hours}h ${remaining > 0 ? `${remaining}m` : ""}`.trim();
    }
    return `0h ${mins}m`;
  };

  const handleSelectEpisode = (seasonNum: number, episodeNum: number) => {
    setCurrentSeason(seasonNum);
    setCurrentEpisode(episodeNum);
    setModalSeason(seasonNum);
    setIsEpisodeModalOpen(false);
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

  // Auto-scroll active card into view when modal opens
  useEffect(() => {
    if (isEpisodeModalOpen && activeCardRef.current) {
      activeCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isEpisodeModalOpen, modalSeason]);

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
        if (isEpisodeModalOpen) {
          setIsEpisodeModalOpen(false);
        } else if (isServerMenuOpen) {
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
  }, [handleBack, isServerMenuOpen, isEpisodeMenuOpen, isEpisodeModalOpen, handleRefresh]);

  // Auto-hide top overlay header on inactivity
  const handleMouseMove = useCallback(() => {
    setShowOverlay(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isServerMenuOpen && !isEpisodeMenuOpen && !isEpisodeModalOpen) {
        setShowOverlay(false);
      }
    }, 3500);
  }, [isServerMenuOpen, isEpisodeMenuOpen, isEpisodeModalOpen]);

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
        return `/api/player?server=vidking&type=${type}&id=${id}&season=${season}&episode=${episode}`;
      case "peachify":
        return `/api/player?server=peachify&type=${type}&id=${id}&season=${season}&episode=${episode}`;
      case "videasy":
        return `/api/player?server=videasy&type=${type}&id=${id}&season=${season}&episode=${episode}`;
      case "vidnest":
        return `/api/player?server=vidnest&type=${type}&id=${id}&season=${season}&episode=${episode}`;
      case "vidfast":
        return `/api/player?server=vidfast&type=${type}&id=${id}&season=${season}&episode=${episode}`;
      case "vidlink":
        return `/api/player?server=vidlink&type=${type}&id=${id}&season=${season}&episode=${episode}`;
      case "smashy":
        return type === "tv"
          ? `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${season}&episode=${episode}`
          : `https://embed.smashystream.com/playere.php?tmdb=${id}`;
      case "vidup":
        return type === "tv"
          ? `https://nhdapi.com/tv/${id}/${season}/${episode}?autoPlay=true`
          : `https://nhdapi.com/movie/${id}?autoPlay=true`;
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
              Tip: Ultra-Buffering Engine active · 2–4 min pre-buffer & zero-stall playback
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

                {/* Episode Switcher Trigger Button with User's Exact SVG */}
                <button
                  onClick={() => {
                    setModalSeason(currentSeason);
                    setIsEpisodeModalOpen(true);
                  }}
                  title="Seasons & Episodes"
                  aria-label="Seasons & Episodes"
                  className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium backdrop-blur-xl transition-all shadow-xl border cursor-pointer ${
                    isEpisodeModalOpen
                      ? "bg-[#e50914]/35 text-white border-[#e50914]/70 shadow-[0_0_16px_rgba(229,9,20,0.35)]"
                      : "bg-white/15 text-white border-white/25 hover:bg-black/85 hover:border-white/15 hover:text-white/95"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 256 256"
                    className="h-4 w-4 sm:h-4.5 sm:w-4.5 fill-current shrink-0 text-white"
                  >
                    <path d="M216,40H72A16,16,0,0,0,56,56V72H40A16,16,0,0,0,24,88V200a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V184h16a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM184,88v16H40V88Zm0,112H40V120H184v80Zm32-32H200V88a16,16,0,0,0-16-16H72V56H216Z" />
                  </svg>
                  <span className="font-semibold whitespace-nowrap">
                    S{currentSeason} : E{currentEpisode}
                  </span>
                </button>

                {/* Next Episode Button */}
                <button
                  onClick={() => {
                    const activeSummary =
                      validSeasons.find((s) => s.season_number === currentSeason) || validSeasons[0];
                    const maxEp = activeSummary?.episode_count || 30;
                    if (currentEpisode < maxEp) {
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
                    currentEpisode >=
                      (validSeasons.find((s) => s.season_number === currentSeason)?.episode_count ||
                        30) &&
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
                : showOverlay || isServerMenuOpen || isEpisodeMenuOpen || isEpisodeModalOpen
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

      {/* 4. Fullscreen Episode & Season Switcher Modal (Overlay) */}
      {type === "tv" && isEpisodeModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 overflow-hidden select-none">
          {/* Cinematic backdrop behind the modal */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <img
              src={backdropUrl(details.backdrop_path, "original")}
              alt=""
              className="h-full w-full object-cover opacity-25 filter blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/90" />
          </div>

          {/* Top Header Navigation Bar */}
          <div className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-8 sm:py-6 border-b border-white/10 bg-black/40 backdrop-blur-md">
            {/* Top Left: Back Arrow */}
            <button
              onClick={() => setIsEpisodeModalOpen(false)}
              aria-label="Back to video"
              title="Back to video (Esc)"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95 border border-white/15 shadow-md"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Top Right: Season Dropdown, Search Input, Autoplay Next, Close */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Season Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsSeasonDropdownOpen((prev) => !prev)}
                  aria-expanded={isSeasonDropdownOpen}
                  className="flex items-center gap-1.5 sm:gap-2 bg-[#2d0e12] hover:bg-[#3f1319] border border-[#e50914]/50 text-[#ff4c53] font-semibold text-xs sm:text-sm px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <span>Season {modalSeason}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isSeasonDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isSeasonDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30 bg-transparent"
                      onClick={() => setIsSeasonDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 z-40 w-44 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/15 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95 duration-150">
                      {validSeasons.map((s) => {
                        const isSelected = s.season_number === modalSeason;
                        return (
                          <button
                            key={s.id || s.season_number}
                            onClick={() => {
                              setModalSeason(s.season_number);
                              setIsSeasonDropdownOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#e50914]/25 text-white"
                                : "text-zinc-200 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <span>{s.name || `Season ${s.season_number}`}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-[#e50914]" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Unified Search & Next (Autoplay) Button Container matching Screenshot */}
              <div className="flex items-center bg-[#14141c]/90 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-white/30 rounded-xl h-8.5 sm:h-9.5 px-3 gap-2.5 transition-all shadow-sm">
                {/* Search icon + input */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={episodeSearchQuery}
                    onChange={(e) => setEpisodeSearchQuery(e.target.value)}
                    className="bg-transparent text-white placeholder-zinc-500 text-xs sm:text-sm outline-none w-20 sm:w-28 md:w-36 focus:w-44 transition-all"
                  />
                  {episodeSearchQuery && (
                    <button
                      onClick={() => setEpisodeSearchQuery("")}
                      className="text-zinc-400 hover:text-white cursor-pointer mr-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Next button + Autoplay Toggle Switch */}
                <button
                  type="button"
                  onClick={toggleAutoplayNext}
                  role="switch"
                  aria-checked={autoplayNext}
                  title={autoplayNext ? "Autoplay Next: Enabled" : "Autoplay Next: Disabled"}
                  aria-label="Toggle autoplay next episode"
                  className="flex items-center gap-1.5 shrink-0 pl-2.5 border-l border-white/10 cursor-pointer select-none group"
                >
                  <SkipForward className="h-3.5 w-3.5 text-zinc-300 group-hover:text-white transition-colors" />
                  <div className="w-8 h-4.5 rounded-full p-0.5 bg-[#383844] group-hover:bg-[#444452] transition-colors relative flex items-center">
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        autoplayNext ? "translate-x-3.5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsEpisodeModalOpen(false)}
                title="Close (Esc)"
                aria-label="Close"
                className="flex h-8.5 w-8.5 sm:h-9.5 sm:w-9.5 items-center justify-center rounded-xl bg-[#14141c] hover:bg-[#1e1e28] text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="relative z-10 flex-1 min-h-0 flex flex-col md:flex-row p-4 sm:p-8 lg:p-12 gap-8 items-start md:items-end justify-between overflow-y-auto md:overflow-hidden">
            {/* Left Details Panel */}
            <div className="w-full md:max-w-md lg:max-w-xl pb-4 md:pb-6 flex flex-col justify-end">
              {logoFile ? (
                <img
                  src={logoUrl(logoFile, "w500")}
                  alt={details.name || details.title}
                  className="max-h-20 sm:max-h-28 md:max-h-36 max-w-[240px] sm:max-w-md w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] mb-4"
                />
              ) : (
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] mb-3">
                  {details.name || details.title}
                </h1>
              )}

              <p className="text-xs sm:text-sm text-zinc-300 font-medium mb-1.5 drop-shadow">
                Season {modalSeason} · Episode {currentEpisodeObj.episode_number} ·{" "}
                {formatRuntime(currentEpisodeObj.runtime)}
              </p>

              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-sm line-clamp-2">
                {currentEpisodeObj.name || `Episode ${currentEpisodeObj.episode_number}`}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300/85 leading-relaxed max-w-xl line-clamp-3 sm:line-clamp-4 drop-shadow">
                {currentEpisodeObj.overview || details.overview || "No episode description available."}
              </p>
            </div>

            {/* Right Episodes Scrollable Column */}
            <div className="w-full md:w-[400px] lg:w-[460px] shrink-0 flex flex-col max-h-[60vh] md:max-h-[calc(100vh-160px)]">
              <div className="overflow-y-auto pr-2 space-y-3.5 custom-scrollbar">
                {isLoadingSeason ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3 text-zinc-400">
                    <div className="h-8 w-8 rounded-full border-2 border-t-red-600 border-r-transparent border-b-white/20 border-l-transparent animate-spin" />
                    <p className="text-xs font-medium">Loading episodes for Season {modalSeason}...</p>
                  </div>
                ) : episodesToDisplay.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 text-xs bg-white/5 rounded-2xl border border-white/10">
                    No episodes found matching "{episodeSearchQuery}"
                  </div>
                ) : (
                  episodesToDisplay.map((ep) => {
                    const isActive =
                      modalSeason === currentSeason && ep.episode_number === currentEpisode;
                    return (
                      <div
                        key={ep.id || ep.episode_number}
                        ref={isActive ? activeCardRef : undefined}
                        onClick={() => handleSelectEpisode(modalSeason, ep.episode_number)}
                        className={`group relative w-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 select-none ${
                          isActive
                            ? "border-2 border-white shadow-[0_8px_32px_rgba(0,0,0,0.8)] ring-1 ring-white/30"
                            : "border border-white/10 hover:border-white/30 bg-zinc-950/60 hover:bg-zinc-900/80 hover:scale-[1.01]"
                        }`}
                      >
                        {/* Episode Still Background */}
                        <div className="absolute inset-0 z-0">
                          <img
                            src={stillUrl(ep.still_path || details.backdrop_path, "w500")}
                            alt={ep.name}
                            className={`h-full w-full object-cover transition-opacity duration-300 ${
                              isActive ? "opacity-60" : "opacity-35 group-hover:opacity-50"
                            }`}
                            loading="lazy"
                          />
                          <div
                            className={`absolute inset-0 ${
                              isActive
                                ? "bg-gradient-to-t from-black via-black/80 to-black/30"
                                : "bg-gradient-to-t from-black via-black/85 to-black/50"
                            }`}
                          />
                        </div>

                        {/* Card Content */}
                        <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-end min-h-[120px] sm:min-h-[140px]">
                          {isActive ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="bg-[#e50914] text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase inline-block shadow-sm">
                                  WATCHING
                                </span>
                                <h3 className="text-white font-extrabold text-base sm:text-lg leading-snug line-clamp-1 drop-shadow-sm">
                                  {ep.episode_number}. {ep.name}
                                </h3>
                              </div>
                              <p className="text-xs text-zinc-300 font-medium">
                                {ep.runtime ? `${ep.runtime}m left` : "42m left"}
                              </p>
                              {ep.overview && (
                                <p className="text-xs text-zinc-300/85 line-clamp-2 leading-relaxed pt-0.5">
                                  {ep.overview}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-zinc-100 font-bold text-sm sm:text-base group-hover:text-white line-clamp-1 drop-shadow-sm">
                                  {ep.episode_number}. {ep.name}
                                </h3>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm text-white shrink-0 ml-2">
                                  <Play className="h-3.5 w-3.5 fill-white" />
                                </div>
                              </div>
                              <p className="text-xs text-zinc-400 font-medium">
                                {ep.runtime ? `${ep.runtime}m left` : "42m left"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
