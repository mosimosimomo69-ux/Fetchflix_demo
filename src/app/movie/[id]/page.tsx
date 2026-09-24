import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MediaDetailView } from "@/components/media/MediaDetailView";
import { getMovieDetails } from "@/lib/api/tmdb";

export const revalidate = 3600;

type MoviePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ play?: string }>;
};

// Deduplicate: generateMetadata and the page both need details — fetch once
const getCachedMovieDetails = cache((id: number) => getMovieDetails(id).catch(() => null));

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const movie = await getCachedMovieDetails(Number(id));
  if (!movie) return { title: "Movie" };
  return {
    title: movie.title ?? "Movie",
    description: movie.overview?.slice(0, 160),
  };
}

export default async function MoviePage({
  params,
  searchParams,
}: MoviePageProps) {
  const [{ id }, { play }] = await Promise.all([params, searchParams]);
  const movie = await getCachedMovieDetails(Number(id));
  if (!movie) notFound();

  return (
    <MediaDetailView
      details={movie}
      type="movie"
      initialPlay={play === "true"}
    />
  );
}

