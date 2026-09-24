"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { MediaItem } from "@/lib/api/tmdb";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface WatchHistoryItem extends MediaItem {
  progress?: number;
  season?: number;
  episode?: number;
  watchedAt?: number;
}

export interface SubtitleSettings {
  fontSize: number;
  backgroundBlur: number;
  color: string;
  latency: number;
}

interface AuthContextType {
  user: User | null;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "signup";
  authReason: string | null;
  openLogin: (reason?: string) => void;
  openSignUp: (reason?: string) => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: "login" | "signup") => void;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  watchlist: MediaItem[];
  addToWatchlist: (item: MediaItem) => void;
  removeFromWatchlist: (id: number) => void;
  isInWatchlist: (id: number) => boolean;
  history: WatchHistoryItem[];
  addToHistory: (item: MediaItem, progress?: number, season?: number, episode?: number) => void;
  removeFromHistory: (id: number) => void;
  clearHistory: () => void;
  adsEnabled: boolean;
  toggleAds: () => void;
  subtitleSettings: SubtitleSettings;
  updateSubtitleSettings: (settings: Partial<SubtitleSettings>) => void;
}

const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 30,
  backgroundBlur: 0,
  color: "#ffffff",
  latency: 0,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [adsEnabled, setAdsEnabled] = useState<boolean>(true);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(DEFAULT_SUBTITLE_SETTINGS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("cineby_user");
      if (savedUser) setUser(JSON.parse(savedUser));

      const savedWatchlist = localStorage.getItem("cineby_watchlist");
      if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));

      const savedHistory = localStorage.getItem("cineby_history");
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedAds = localStorage.getItem("cineby_ads_enabled");
      if (savedAds !== null) setAdsEnabled(savedAds === "true");

      const savedSubs = localStorage.getItem("cineby_subtitle_settings");
      if (savedSubs) setSubtitleSettings(JSON.parse(savedSubs));
    } catch (e) {
      console.error("Failed to restore storage:", e);
    }
  }, []);

  const openLogin = useCallback((reason?: string) => {
    setAuthModalTab("login");
    setAuthReason(reason || null);
    setIsAuthModalOpen(true);
  }, []);

  const openSignUp = useCallback((reason?: string) => {
    setAuthModalTab("signup");
    setAuthReason(reason || null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthReason(null);
  }, []);

  const login = async (email: string): Promise<boolean> => {
    const name = email.split("@")[0] || "User";
    const loggedUser: User = {
      id: "u_" + Date.now(),
      name,
      email,
    };
    setUser(loggedUser);
    localStorage.setItem("cineby_user", JSON.stringify(loggedUser));
    closeAuthModal();
    return true;
  };

  const signup = async (name: string, email: string): Promise<boolean> => {
    const loggedUser: User = {
      id: "u_" + Date.now(),
      name: name || email.split("@")[0] || "User",
      email,
    };
    setUser(loggedUser);
    localStorage.setItem("cineby_user", JSON.stringify(loggedUser));
    closeAuthModal();
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("cineby_user");
  };

  const addToWatchlist = useCallback((item: MediaItem) => {
    setWatchlist((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev;
      const updated = [item, ...prev];
      localStorage.setItem("cineby_watchlist", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromWatchlist = useCallback((id: number) => {
    setWatchlist((prev) => {
      const updated = prev.filter((x) => x.id !== id);
      localStorage.setItem("cineby_watchlist", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isInWatchlist = useCallback((id: number) => {
    return watchlist.some((x) => x.id === id);
  }, [watchlist]);

  const addToHistory = useCallback((
    item: MediaItem,
    progress = 0,
    season?: number,
    episode?: number
  ) => {
    setHistory((prev) => {
      const filtered = prev.filter((x) => x.id !== item.id);
      const updated: WatchHistoryItem[] = [
        {
          ...item,
          progress,
          season,
          episode,
          watchedAt: Date.now(),
        },
        ...filtered,
      ].slice(0, 30);
      localStorage.setItem("cineby_history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((id: number) => {
    setHistory((prev) => {
      const updated = prev.filter((x) => x.id !== id);
      localStorage.setItem("cineby_history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem("cineby_history");
  }, []);

  const toggleAds = useCallback(() => {
    setAdsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("cineby_ads_enabled", String(next));
      return next;
    });
  }, []);

  const updateSubtitleSettings = useCallback((settings: Partial<SubtitleSettings>) => {
    setSubtitleSettings((prev) => {
      const next = { ...prev, ...settings };
      localStorage.setItem("cineby_subtitle_settings", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthModalOpen,
        authModalTab,
        authReason,
        openLogin,
        openSignUp,
        closeAuthModal,
        setAuthModalTab,
        login,
        signup,
        logout,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        history,
        addToHistory,
        removeFromHistory,
        clearHistory,
        adsEnabled,
        toggleAds,
        subtitleSettings,
        updateSubtitleSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
