import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/api/tmdb/client";
import { enrichWithTitleBackdrops } from "@/lib/api/tmdb/endpoints";
import { getStreamingService, getNetworkTmdbFilter, NETFLIX_GENRES } from "@/lib/constants";
import type { Paged, MediaItem } from "@/lib/api/tmdb/types";
import { rateLimit, sanitizeString, allowList, sanitizeCountry } from "@/lib/security";

interface CategoryDef {
  id: string;
  label: string;
  type: "movie" | "tv" | "all";
  genres?: string;
  movieGenres?: string;
  tvGenres?: string;
  sortBy?: string;
  voteCountGte?: number;
  page?: number;
}

function buildNetworkCategories(
  networkName: string
): {
  all: CategoryDef[];
  movie: CategoryDef[];
  tv: CategoryDef[];
} {
  return {
    all: [
      { id: "popular", label: `Popular ${networkName} Titles`, type: "all", sortBy: "popularity.desc" },
      { id: "top-rated", label: `Top Rated ${networkName}`, type: "all", sortBy: "vote_average.desc", voteCountGte: 30 },
      { id: "action", label: `${networkName} Action & Adventure`, type: "all", genres: "28,12,10759" },
      { id: "scifi", label: `${networkName} Sci-Fi & Fantasy`, type: "all", genres: "878,14,10765" },
      { id: "comedy", label: `${networkName} Comedy & Family`, type: "all", genres: "35,10751,16" },
      { id: "drama", label: `${networkName} Drama & Thrillers`, type: "all", genres: "18,53,80" },
      { id: "releases", label: `More ${networkName} Releases`, type: "all", sortBy: "popularity.desc", page: 2 },
    ],
    movie: [
      { id: "popular-movies", label: `Popular ${networkName} Movies`, type: "movie", sortBy: "popularity.desc" },
      { id: "top-rated-movies", label: `Top Rated ${networkName} Movies`, type: "movie", sortBy: "vote_average.desc", voteCountGte: 30 },
      { id: "action-movies", label: `${networkName} Action & Adventure`, type: "movie", genres: "28,12" },
      { id: "scifi-movies", label: `${networkName} Sci-Fi & Fantasy`, type: "movie", genres: "878,14" },
      { id: "comedy-movies", label: `${networkName} Comedy & Animation`, type: "movie", genres: "35,16,10751" },
      { id: "more-movies", label: `More ${networkName} Movies`, type: "movie", sortBy: "popularity.desc", page: 2 },
    ],
    tv: [
      { id: "popular-tv", label: `Popular ${networkName} Series`, type: "tv", sortBy: "popularity.desc" },
      { id: "top-rated-tv", label: `Top Rated ${networkName} Series`, type: "tv", sortBy: "vote_average.desc", voteCountGte: 15 },
      { id: "drama-tv", label: `${networkName} Drama & Crime Series`, type: "tv", genres: "18,80,9648" },
      { id: "animation-tv", label: `${networkName} Animated & Comedy Series`, type: "tv", genres: "16,35,10762" },
      { id: "more-tv", label: `More ${networkName} Series`, type: "tv", sortBy: "popularity.desc", page: 2 },
    ],
  };
}

function buildCategories(
  serviceName: string,
  genreId: string = "all"
): {
  all: CategoryDef[];
  movie: CategoryDef[];
  tv: CategoryDef[];
} {
  const selectedGenre = NETFLIX_GENRES.find((g) => g.id === genreId);

  if (selectedGenre && selectedGenre.id !== "all") {
    const { name, movieGenreId, tvGenreId } = selectedGenre;
    const mGId = movieGenreId ? String(movieGenreId) : undefined;
    const tGId = tvGenreId ? String(tvGenreId) : undefined;

    return {
      all: [
        {
          id: `${genreId}-popular`,
          label: `Popular ${name} on ${serviceName}`,
          type: "all",
          movieGenres: mGId,
          tvGenres: tGId,
          sortBy: "popularity.desc",
        },
        {
          id: `${genreId}-top-rated`,
          label: `Top Rated ${name}`,
          type: "all",
          movieGenres: mGId,
          tvGenres: tGId,
          sortBy: "vote_average.desc",
          voteCountGte: 40,
        },
        {
          id: `${genreId}-new`,
          label: `New ${name} Releases`,
          type: "all",
          movieGenres: mGId,
          tvGenres: tGId,
          sortBy: "primary_release_date.desc",
        },
        {
          id: `${genreId}-movies`,
          label: `${name} Movies`,
          type: "movie",
          genres: mGId,
          sortBy: "popularity.desc",
          page: 1,
        },
        {
          id: `${genreId}-tv`,
          label: `${name} TV Shows`,
          type: "tv",
          genres: tGId,
          sortBy: "popularity.desc",
          page: 1,
        },
        {
          id: `${genreId}-hidden-gems`,
          label: `Hidden Gem ${name}`,
          type: "all",
          movieGenres: mGId,
          tvGenres: tGId,
          sortBy: "vote_average.desc",
          voteCountGte: 15,
          page: 2,
        },
      ],
      movie: [
        {
          id: `${genreId}-movie-popular`,
          label: `Popular ${name} Movies on ${serviceName}`,
          type: "movie",
          genres: mGId,
          sortBy: "popularity.desc",
        },
        {
          id: `${genreId}-movie-top-rated`,
          label: `Top Rated ${name} Movies`,
          type: "movie",
          genres: mGId,
          sortBy: "vote_average.desc",
          voteCountGte: 30,
        },
        {
          id: `${genreId}-movie-new`,
          label: `New ${name} Movies`,
          type: "movie",
          genres: mGId,
          sortBy: "primary_release_date.desc",
        },
        {
          id: `${genreId}-movie-more`,
          label: `More ${name} Movies`,
          type: "movie",
          genres: mGId,
          sortBy: "popularity.desc",
          page: 2,
        },
      ],
      tv: [
        {
          id: `${genreId}-tv-popular`,
          label: `Popular ${name} Series on ${serviceName}`,
          type: "tv",
          genres: tGId,
          sortBy: "popularity.desc",
        },
        {
          id: `${genreId}-tv-top-rated`,
          label: `Top Rated ${name} Series`,
          type: "tv",
          genres: tGId,
          sortBy: "vote_average.desc",
          voteCountGte: 20,
        },
        {
          id: `${genreId}-tv-new`,
          label: `New ${name} Series`,
          type: "tv",
          genres: tGId,
          sortBy: "first_air_date.desc",
        },
        {
          id: `${genreId}-tv-more`,
          label: `More ${name} Series`,
          type: "tv",
          genres: tGId,
          sortBy: "popularity.desc",
          page: 2,
        },
      ],
    };
  }

  return {
    all: [
      { id: "trending", label: `Trending on ${serviceName}`, type: "all", sortBy: "popularity.desc" },
      { id: "top-rated", label: `Top Rated on ${serviceName}`, type: "all", sortBy: "vote_average.desc", voteCountGte: 80 },
      { id: "new", label: `New on ${serviceName}`, type: "all", sortBy: "primary_release_date.desc" },
      { id: "action", label: "Action & Adventure", type: "all", genres: "28,12,10759" },
      { id: "comedy", label: "Comedy", type: "all", genres: "35" },
      { id: "drama", label: "Drama", type: "all", genres: "18" },
      { id: "scifi", label: "Sci-Fi & Fantasy", type: "all", genres: "878,14,10765" },
      { id: "thriller", label: "Suspense & Thrillers", type: "all", genres: "53,9648" },
      { id: "horror", label: "Horror", type: "all", genres: "27" },
      { id: "family", label: "Family & Kids", type: "all", genres: "10751,16,10762" },
    ],
    movie: [
      { id: "popular-movies", label: `Popular Movies on ${serviceName}`, type: "movie", sortBy: "popularity.desc" },
      { id: "top-rated-movies", label: `Top Rated Movies`, type: "movie", sortBy: "vote_average.desc", voteCountGte: 60 },
      { id: "new-movies", label: `New Movie Releases`, type: "movie", sortBy: "primary_release_date.desc" },
      { id: "action-movies", label: "Action & Adventure Movies", type: "movie", genres: "28,12" },
      { id: "comedy-movies", label: "Comedy Movies", type: "movie", genres: "35" },
      { id: "drama-movies", label: "Drama Movies", type: "movie", genres: "18" },
      { id: "scifi-movies", label: "Sci-Fi & Fantasy Movies", type: "movie", genres: "878,14" },
      { id: "horror-movies", label: "Horror Movies", type: "movie", genres: "27" },
      { id: "thriller-movies", label: "Thriller Movies", type: "movie", genres: "53,9648" },
      { id: "family-movies", label: "Family & Animation Movies", type: "movie", genres: "10751,16" },
    ],
    tv: [
      { id: "popular-tv", label: `Popular TV Shows on ${serviceName}`, type: "tv", sortBy: "popularity.desc" },
      { id: "top-rated-tv", label: `Top Rated TV Shows`, type: "tv", sortBy: "vote_average.desc", voteCountGte: 30 },
      { id: "new-tv", label: `New TV Releases`, type: "tv", sortBy: "first_air_date.desc" },
      { id: "action-tv", label: "Action & Adventure Series", type: "tv", genres: "10759" },
      { id: "comedy-tv", label: "Comedy Series", type: "tv", genres: "35" },
      { id: "drama-tv", label: "Drama Series", type: "tv", genres: "18" },
      { id: "scifi-tv", label: "Sci-Fi & Fantasy Series", type: "tv", genres: "10765" },
      { id: "thriller-tv", label: "Crime & Thriller Series", type: "tv", genres: "53,80,9648" },
      { id: "horror-tv", label: "Horror Series", type: "tv", genres: "27" },
      { id: "docuseries", label: "Documentary Series", type: "tv", genres: "99" },
    ],
  };
}

async function fetchCategory(
  cat: CategoryDef,
  providerId: number,
  region: string,
  network: string = "all"
): Promise<MediaItem[]> {
  const isNetwork = network !== "all";
  const netFilter = isNetwork ? getNetworkTmdbFilter(network) : null;

  const baseParams: Record<string, string | number | undefined> = {
    sort_by: cat.sortBy || "popularity.desc",
    page: cat.page || 1,
  };

  if (!isNetwork) {
    baseParams.with_watch_providers = providerId;
    baseParams.watch_region = region || "US";
  }

  if (cat.genres) baseParams.with_genres = cat.genres;
  if (cat.voteCountGte) baseParams["vote_count.gte"] = cat.voteCountGte;

  if (cat.type === "all") {
    const movieParams: Record<string, string | number | undefined> = {
      ...baseParams,
      sort_by: cat.sortBy || "popularity.desc",
    };
    if (cat.movieGenres) movieParams.with_genres = cat.movieGenres;
    if (netFilter?.companyId) movieParams.with_companies = netFilter.companyId;

    const tvParams: Record<string, string | number | undefined> = {
      ...baseParams,
      sort_by: cat.sortBy || "popularity.desc",
    };
    if (cat.tvGenres) tvParams.with_genres = cat.tvGenres;
    if (netFilter?.networkId) tvParams.with_networks = netFilter.networkId;
    else if (netFilter?.companyId) tvParams.with_companies = netFilter.companyId;

    const [movies, tv] = await Promise.all([
      tmdbFetch<Paged<MediaItem>>("/discover/movie", movieParams).catch(() => ({ results: [] })),
      tmdbFetch<Paged<MediaItem>>("/discover/tv", tvParams).catch(() => ({ results: [] })),
    ]);

    const merged: MediaItem[] = [
      ...((movies.results || []).map((i) => ({ ...i, media_type: "movie" as const }))),
      ...((tv.results || []).map((i) => ({ ...i, media_type: "tv" as const }))),
    ];

    merged.sort((a, b) => {
      if (cat.sortBy === "vote_average.desc") return (b.vote_average || 0) - (a.vote_average || 0);
      if (cat.sortBy?.includes("date")) {
        const dateA = a.release_date || a.first_air_date || "";
        const dateB = b.release_date || b.first_air_date || "";
        return dateB.localeCompare(dateA);
      }
      return ((b as { popularity?: number }).popularity || 0) - ((a as { popularity?: number }).popularity || 0);
    });

    return enrichWithTitleBackdrops(merged.slice(0, 20));
  }

  const singleParams = { ...baseParams };
  if (isNetwork && netFilter) {
    if (cat.type === "movie" && netFilter.companyId) singleParams.with_companies = netFilter.companyId;
    if (cat.type === "tv") {
      if (netFilter.networkId) singleParams.with_networks = netFilter.networkId;
      else if (netFilter.companyId) singleParams.with_companies = netFilter.companyId;
    }
  }

  const data = await tmdbFetch<Paged<MediaItem>>(`/discover/${cat.type}`, singleParams);
  const mapped = (data.results || []).map((i) => ({ ...i, media_type: cat.type }));
  return enrichWithTitleBackdrops(mapped, cat.type);
}

export async function GET(req: Request) {
  const limited = rateLimit(req, 40);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const slug = sanitizeString(searchParams.get("service"), 32);
  const type = allowList(searchParams.get("type"), ["movie", "tv", "all"] as const, "all");
  const country = sanitizeCountry(searchParams.get("country"));
  const genre = sanitizeString(searchParams.get("genre"), 32) || "all";
  const network = sanitizeString(searchParams.get("network"), 32) || "all";

  const service = getStreamingService(slug);
  if (!service) {
    return NextResponse.json({ categories: [], error: "Unknown service" }, { status: 400 });
  }

  try {
    const isNetwork = network !== "all";
    const allCats = isNetwork
      ? buildNetworkCategories(network)
      : buildCategories(service.name, genre);

    const categoryDefs = type === "movie" ? allCats.movie : type === "tv" ? allCats.tv : allCats.all;

    const results = await Promise.allSettled(
      categoryDefs.map(async (cat) => {
        const items = await fetchCategory(cat, service.providerId, country, network);
        return { id: cat.id, label: cat.label, items };
      })
    );

    const categories = results
      .filter(
        (r): r is PromiseFulfilledResult<{ id: string; label: string; items: MediaItem[] }> =>
          r.status === "fulfilled" && r.value.items.length > 0
      )
      .map((r) => r.value);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error(`${service.name} categories error:`, error);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}
