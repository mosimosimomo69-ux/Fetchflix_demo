import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MediaDetailView } from "@/components/media/MediaDetailView";
import { getTVDetails } from "@/lib/api/tmdb";

export const revalidate = 3600;

type TVPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ play?: string; season?: string; episode?: string }>;
};

// Deduplicate: generateMetadata and the page both need details — fetch once
const getCachedTVDetails = cache((id: number) => getTVDetails(id).catch(() => null));

export async function generateMetadata({ params }: TVPageProps): Promise<Metadata> {
  const { id } = await params;
  const show = await getCachedTVDetails(Number(id));
  if (!show) return { title: "TV Show" };
  return {
    title: show.name ?? "TV Show",
    description: show.overview?.slice(0, 160),
  };
}

export default async function TVPage({ params, searchParams }: TVPageProps) {
  const [{ id }, { play, season, episode }] = await Promise.all([params, searchParams]);
  const show = await getCachedTVDetails(Number(id));
  if (!show) notFound();

  return (
    <MediaDetailView
      details={show}
      type="tv"
      initialPlay={play === "true"}
      initialSeason={season ? Number(season) : 1}
      initialEpisode={episode ? Number(episode) : 1}
    />
  );
}
