import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMovieDetails, getTVDetails } from "@/lib/api/tmdb";
import type { MediaType } from "@/lib/api/tmdb";
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

export async function generateMetadata({
  params,
}: WatchPageProps): Promise<Metadata> {
  const { type, id } = await params;
  const mediaType = (type as MediaType) || "movie";
  const details =
    mediaType === "tv"
      ? await getTVDetails(Number(id)).catch(() => null)
      : await getMovieDetails(Number(id)).catch(() => null);

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
  const details =
    mediaType === "tv"
      ? await getTVDetails(Number(id)).catch(() => null)
      : await getMovieDetails(Number(id)).catch(() => null);

  if (!details) notFound();

  return (
    <VideoPlayerView
      details={details}
      type={mediaType}
      initialSeason={season ? Number(season) : 1}
      initialEpisode={episode ? Number(episode) : 1}
    />
  );
}
