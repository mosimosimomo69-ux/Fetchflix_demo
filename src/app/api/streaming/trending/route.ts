import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/api/tmdb/client";
import { enrichWithTitleBackdrops } from "@/lib/api/tmdb/endpoints";
import { getStreamingService, getNetworkTmdbFilter, NETFLIX_GENRES } from "@/lib/constants";
import type { Paged, MediaItem } from "@/lib/api/tmdb/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("service") || "";
  const type = (searchParams.get("type") as "movie" | "tv" | "all") || "all";
  const country = searchParams.get("country") || "US";
  const genre = searchParams.get("genre") || "all";
  const network = searchParams.get("network") || "all";

  const service = getStreamingService(slug);
  if (!service) {
    return NextResponse.json({ results: [], error: "Unknown service" }, { status: 400 });
  }

  const selectedGenre = NETFLIX_GENRES.find((g) => g.id === genre);

  try {
    let items: MediaItem[] = [];

    if (network !== "all") {
      const netFilter = getNetworkTmdbFilter(network);
      const movieNetParams: Record<string, string | number | undefined> = {
        sort_by: "popularity.desc",
        page: 1,
      };
      const tvNetParams: Record<string, string | number | undefined> = {
        sort_by: "popularity.desc",
        page: 1,
      };

      if (netFilter.companyId) {
        movieNetParams.with_companies = netFilter.companyId;
        tvNetParams.with_companies = netFilter.companyId;
      }
      if (netFilter.networkId) {
        tvNetParams.with_networks = netFilter.networkId;
        // For networks without specific movie companies, allow movie fallback or company
        if (netFilter.companyId) movieNetParams.with_companies = netFilter.companyId;
      }

      if (selectedGenre && selectedGenre.id !== "all") {
        if (selectedGenre.movieGenreId) movieNetParams.with_genres = selectedGenre.movieGenreId;
        if (selectedGenre.tvGenreId) tvNetParams.with_genres = selectedGenre.tvGenreId;
      }

      if (type === "all") {
        const [movies, tv] = await Promise.all([
          tmdbFetch<Paged<MediaItem>>("/discover/movie", movieNetParams).catch(() => ({ results: [] })),
          tmdbFetch<Paged<MediaItem>>("/discover/tv", tvNetParams).catch(() => ({ results: [] })),
        ]);

        let combined = [
          ...((movies.results || []).map((i) => ({ ...i, media_type: "movie" as const }))),
          ...((tv.results || []).map((i) => ({ ...i, media_type: "tv" as const }))),
        ];

        // If no discover results and query fallback exists, do targeted search
        if (combined.length === 0 && netFilter.queryFallback) {
          const searchData = await tmdbFetch<Paged<MediaItem>>("/search/multi", {
            query: netFilter.queryFallback,
            page: 1,
          }).catch(() => ({ results: [] }));
          combined = (searchData.results || []).map((i) => ({
            ...i,
            media_type: (i.title ? "movie" : "tv") as "movie" | "tv",
          }));
        }

        items = combined
          .sort((a, b) => ((b as { popularity?: number }).popularity || 0) - ((a as { popularity?: number }).popularity || 0))
          .slice(0, 10);
      } else {
        const activeParams = type === "movie" ? movieNetParams : tvNetParams;
        const data = await tmdbFetch<Paged<MediaItem>>(`/discover/${type}`, activeParams).catch(() => ({ results: [] }));
        items = (data.results || []).map((i) => ({ ...i, media_type: type })).slice(0, 10);

        if (items.length === 0 && netFilter.queryFallback) {
          const searchData = await tmdbFetch<Paged<MediaItem>>(`/search/${type}`, {
            query: netFilter.queryFallback,
            page: 1,
          }).catch(() => ({ results: [] }));
          items = (searchData.results || []).map((i) => ({ ...i, media_type: type })).slice(0, 10);
        }
      }
    } else {
      const movieParams: Record<string, string | number | undefined> = {
        with_watch_providers: service.providerId,
        watch_region: country || "US",
        sort_by: "popularity.desc",
        page: 1,
      };
      const tvParams: Record<string, string | number | undefined> = {
        with_watch_providers: service.providerId,
        watch_region: country || "US",
        sort_by: "popularity.desc",
        page: 1,
      };

      if (selectedGenre && selectedGenre.id !== "all") {
        if (selectedGenre.movieGenreId) movieParams.with_genres = selectedGenre.movieGenreId;
        if (selectedGenre.tvGenreId) tvParams.with_genres = selectedGenre.tvGenreId;
      }

      if (type === "all") {
        const [movies, tv] = await Promise.all([
          tmdbFetch<Paged<MediaItem>>("/discover/movie", movieParams).catch(() => ({ results: [] })),
          tmdbFetch<Paged<MediaItem>>("/discover/tv", tvParams).catch(() => ({ results: [] })),
        ]);

        const movieItems = (movies.results || []).map((i) => ({
          ...i,
          media_type: "movie" as const,
        }));
        const tvItems = (tv.results || []).map((i) => ({
          ...i,
          media_type: "tv" as const,
        }));

        items = [...movieItems, ...tvItems]
          .sort((a, b) => ((b as Record<string, unknown>).popularity as number || 0) - ((a as Record<string, unknown>).popularity as number || 0))
          .slice(0, 10);
      } else {
        const activeParams = type === "movie" ? movieParams : tvParams;
        const data = await tmdbFetch<Paged<MediaItem>>(`/discover/${type}`, activeParams);
        items = (data.results || [])
          .map((i) => ({ ...i, media_type: type }))
          .slice(0, 10);
      }
    }

    const enriched = await enrichWithTitleBackdrops(items);

    const top10 = enriched.map((item, idx) => ({
      rank: idx + 1,
      weeks: 1,
      title: item.title || item.name || "Unknown",
      item,
    }));

    return NextResponse.json({ results: top10 });
  } catch (error) {
    console.error(`${service.name} trending error:`, error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
