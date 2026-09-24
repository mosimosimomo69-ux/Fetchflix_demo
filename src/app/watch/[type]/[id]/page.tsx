import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tmdbFetch } from "@/lib/api/tmdb/client";
import type { MediaDetails, MediaType } from "@/lib/api/tmdb";
import { VideoPlayerView } from "@/components/player/VideoPlayerView";
import { getTitle } from "@/lib/utils";

interface WatchPageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
  searchParams: Promise<{
    season?: string;
    episode?: string;
  }>;
}

// Fast, cached details fetcher for watch page - fetches only essential metadata in a single fast call
const getFastWatchDetails = cache(async (type: "movie" | "tv", id: number): Promise<MediaDetails | null> => {
  try {
    return await tmdbFetch<MediaDetails>(`/${type}/${id}`, {
      language: "en-US",
    });
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: WatchPageProps): Promise<Metadata> {
  const { type, id } = await params;
  const mediaType = (type as MediaType) === "tv" ? "tv" : "movie";
  const details = await getFastWatchDetails(mediaType, Number(id));

  if (!details) return { title: "Watch" };

  return {
    title: `Watch ${getTitle(details)}`,
    description: details.overview?.slice(0, 160),
  };
}

export default async function WatchPage({
  params,
  searchParams,
}: WatchPageProps) {
  const [{ type, id }, { season, episode }] = await Promise.all([
    params,
    searchParams,
  ]);

  const mediaType = type === "tv" ? "tv" : "movie";
  const details = await getFastWatchDetails(mediaType, Number(id));

  if (!details) notFound();

  return (
    <>
      {/* Preconnect & DNS-Prefetch to accelerate streaming player connection */}
      <link rel="preconnect" href="https://player.videasy.to" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://player.videasy.to" />
      <link rel="preconnect" href="https://peachify.pro" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://peachify.pro" />
      <link rel="preconnect" href="https://vidnest.fun" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://vidnest.fun" />
      <link rel="preconnect" href="https://vidfast.pro" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://vidfast.pro" />
      <link rel="preconnect" href="https://vidlink.pro" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://vidlink.pro" />
      <link rel="preconnect" href="https://vidrock.to" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://vidrock.to" />
      <link rel="preconnect" href="https://vidsrc.to" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://vidsrc.to" />
      <link rel="preconnect" href="https://nxsha.space" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://nxsha.space" />
      <VideoPlayerView
        details={details}
        type={mediaType}
        initialSeason={season ? Number(season) : 1}
        initialEpisode={episode ? Number(episode) : 1}
      />
    </>
  );
}
