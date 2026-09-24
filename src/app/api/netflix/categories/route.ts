import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/api/tmdb/client";
import { enrichWithTitleBackdrops } from "@/lib/api/tmdb/endpoints";
import type { Paged, MediaItem } from "@/lib/api/tmdb/types";
import { NETFLIX_GENRES } from "@/lib/constants";

const NETFLIX_PROVIDER = 8;

interface CategoryDef {
  id: string;
  label: string;
  type: "movie" | "tv" | "all";
  genres?: string;
  movieGenres?: string;
  tvGenres?: string;
  language?: string;
  sortBy?: string;
  voteCountGte?: number;
  page?: number;
}

const DEFAULT_ALL_CATEGORIES: CategoryDef[] = [
  { id: "trending-netflix", label: "Trending on Netflix", type: "all", sortBy: "popularity.desc" },
  { id: "top-rated-netflix", label: "Critically Acclaimed Netflix Hits", type: "all", sortBy: "vote_average.desc", voteCountGte: 80 },
  { id: "new-on-netflix", label: "New on Netflix", type: "all", sortBy: "primary_release_date.desc" },
  { id: "action-adventure", label: "Action & Adventure", type: "all", movieGenres: "28,12", tvGenres: "10759" },
  { id: "scifi-fantasy", label: "Sci-Fi & Fantasy", type: "all", movieGenres: "878,14", tvGenres: "10765" },
  { id: "korean-drama", label: "K-Drama & Asian Series", type: "tv", genres: "18", language: "ko,ja,zh" },
  { id: "crowd-pleaser", label: "Crowd Pleasers & Comedies", type: "all", genres: "35,10749" },
  { id: "suspenseful", label: "Suspense & Thrillers", type: "all", genres: "53,9648" },
  { id: "horror", label: "Horror", type: "all", genres: "27" },
  { id: "documentaries", label: "Docuseries & Real Stories", type: "all", genres: "99" },
];

const DEFAULT_MOVIE_CATEGORIES: CategoryDef[] = [
  { id: "popular-movies", label: "Popular Netflix Movies", type: "movie", sortBy: "popularity.desc" },
  { id: "top-rated-movies", label: "Top Rated Movies on Netflix", type: "movie", sortBy: "vote_average.desc", voteCountGte: 60 },
  { id: "new-movies", label: "New Movie Releases", type: "movie", sortBy: "primary_release_date.desc" },
  { id: "action-movies", label: "Action & Adventure Movies", type: "movie", genres: "28,12" },
  { id: "comedy-movies", label: "Comedy Movies", type: "movie", genres: "35" },
  { id: "thriller-movies", label: "Thriller & Suspense Movies", type: "movie", genres: "53,9648" },
  { id: "scifi-movies", label: "Sci-Fi & Fantasy Movies", type: "movie", genres: "878,14" },
  { id: "drama-movies", label: "Drama Movies", type: "movie", genres: "18" },
  { id: "horror-movies", label: "Horror Movies", type: "movie", genres: "27" },
  { id: "family-movies", label: "Family & Animation Movies", type: "movie", genres: "10751,16" },
];

const DEFAULT_TV_CATEGORIES: CategoryDef[] = [
  { id: "popular-tv", label: "Popular Netflix TV Shows", type: "tv", sortBy: "popularity.desc" },
  { id: "top-rated-tv", label: "Top Rated TV Shows on Netflix", type: "tv", sortBy: "vote_average.desc", voteCountGte: 30 },
  { id: "new-tv", label: "New TV Releases", type: "tv", sortBy: "first_air_date.desc" },
  { id: "k-drama", label: "K-Drama & Asian Series", type: "tv", genres: "18", language: "ko,ja,zh" },
  { id: "tv-thrillers", label: "Crime & Thriller Series", type: "tv", genres: "53,80,9648" },
  { id: "scifi-tv", label: "Sci-Fi & Fantasy Series", type: "tv", genres: "10765" },
  { id: "comedy-tv", label: "Comedy Series", type: "tv", genres: "35" },
  { id: "action-tv", label: "Action & Adventure Series", type: "tv", genres: "10759" },
  { id: "docuseries", label: "Documentary Series", type: "tv", genres: "99" },
  { id: "drama-tv", label: "Drama Series", type: "tv", genres: "18" },
];

function getGenreCategories(
  genreId: string,
  type: "movie" | "tv" | "all"
): CategoryDef[] {
  const selectedGenre = NETFLIX_GENRES.find((g) => g.id === genreId);
  if (!selectedGenre || selectedGenre.id === "all") {
    if (type === "movie") return DEFAULT_MOVIE_CATEGORIES;
    if (type === "tv") return DEFAULT_TV_CATEGORIES;
    return DEFAULT_ALL_CATEGORIES;
  }

  const { name, movieGenreId, tvGenreId } = selectedGenre;
  const mGId = movieGenreId ? String(movieGenreId) : undefined;
  const tGId = tvGenreId ? String(tvGenreId) : undefined;

  if (type === "movie") {
    return [
      {
        id: `${genreId}-movie-popular`,
        label: `Popular ${name} Movies on Netflix`,
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
        label: `New ${name} Movies on Netflix`,
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
    ];
  }

  if (type === "tv") {
    return [
      {
        id: `${genreId}-tv-popular`,
        label: `Popular ${name} TV Shows on Netflix`,
        type: "tv",
        genres: tGId,
        sortBy: "popularity.desc",
      },
      {
        id: `${genreId}-tv-top-rated`,
        label: `Top Rated ${name} TV Series`,
        type: "tv",
        genres: tGId,
        sortBy: "vote_average.desc",
        voteCountGte: 20,
      },
      {
        id: `${genreId}-tv-new`,
        label: `New ${name} Series on Netflix`,
        type: "tv",
        genres: tGId,
        sortBy: "first_air_date.desc",
      },
      {
        id: `${genreId}-tv-more`,
        label: `More ${name} TV Shows`,
        type: "tv",
        genres: tGId,
        sortBy: "popularity.desc",
        page: 2,
      },
    ];
  }

  // type === "all"
  const categories: CategoryDef[] = [
    {
      id: `${genreId}-popular`,
      label: `Popular ${name} on Netflix`,
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
      voteCountGte: 30,
    },
    {
      id: `${genreId}-new`,
      label: `New Releases in ${name}`,
      type: "all",
      movieGenres: mGId,
      tvGenres: tGId,
      sortBy: "primary_release_date.desc",
    },
  ];

  if (mGId) {
    categories.push({
      id: `${genreId}-movies`,
      label: `${name} Movies on Netflix`,
      type: "movie",
      genres: mGId,
      sortBy: "popularity.desc",
    });
  }

  if (tGId) {
    categories.push({
      id: `${genreId}-tv`,
      label: `${name} TV Shows & Series`,
      type: "tv",
      genres: tGId,
      sortBy: "popularity.desc",
    });
  }

  categories.push({
    id: `${genreId}-more`,
    label: `More ${name} Titles`,
    type: "all",
    movieGenres: mGId,
    tvGenres: tGId,
    sortBy: "popularity.desc",
    page: 2,
  });

  return categories;
}

async function fetchCategory(cat: CategoryDef, region: string): Promise<MediaItem[]> {
  const watchRegion = region || "US";

  if (cat.language) {
    const data = await tmdbFetch<Paged<MediaItem>>(
      `/discover/${cat.type === "all" ? "movie" : cat.type}`,
      {
        with_genres: cat.genres || cat.movieGenres || cat.tvGenres,
        with_original_language: cat.language,
        with_watch_providers: NETFLIX_PROVIDER,
        watch_region: watchRegion,
        sort_by: cat.sortBy || "popularity.desc",
        page: cat.page || 1,
      }
    );
    const mapped = (data.results || []).map((i) => ({
      ...i,
      media_type: cat.type === "all" ? resolveType(i) : cat.type,
    }));
    return enrichWithTitleBackdrops(mapped, cat.type === "all" ? undefined : cat.type);
  }

  if (cat.type === "all") {
    const movieGenreVal = cat.movieGenres || cat.genres;
    const tvGenreVal = cat.tvGenres || cat.genres;

    const movieParams: Record<string, string | number | undefined> = {
      with_genres: movieGenreVal,
      with_watch_providers: NETFLIX_PROVIDER,
      watch_region: watchRegion,
      sort_by: cat.sortBy || "popularity.desc",
      page: cat.page || 1,
    };
    const tvParams: Record<string, string | number | undefined> = {
      with_genres: tvGenreVal,
      with_watch_providers: NETFLIX_PROVIDER,
      watch_region: watchRegion,
      sort_by: cat.sortBy || "popularity.desc",
      page: cat.page || 1,
    };
    if (cat.voteCountGte) {
      movieParams["vote_count.gte"] = cat.voteCountGte;
      tvParams["vote_count.gte"] = cat.voteCountGte;
    }

    const [movies, tv] = await Promise.all([
      tmdbFetch<Paged<MediaItem>>("/discover/movie", movieParams).catch(() => ({ results: [] })),
      tmdbFetch<Paged<MediaItem>>("/discover/tv", tvParams).catch(() => ({ results: [] })),
    ]);

    const merged: MediaItem[] = [
      ...((movies.results || []).map((i) => ({ ...i, media_type: "movie" as const }))),
      ...((tv.results || []).map((i) => ({ ...i, media_type: "tv" as const }))),
    ];

    let sorted = merged;
    if (cat.sortBy === "vote_average.desc") {
      sorted = merged.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else if (cat.sortBy?.includes("date")) {
      sorted = merged.sort((a, b) => {
        const dateA = a.release_date || a.first_air_date || "";
        const dateB = b.release_date || b.first_air_date || "";
        return dateB.localeCompare(dateA);
      });
    } else {
      sorted = merged.sort(
        (a, b) => ((b as { popularity?: number }).popularity || 0) - ((a as { popularity?: number }).popularity || 0)
      );
    }

    return enrichWithTitleBackdrops(sorted.slice(0, 20));
  }

  const params: Record<string, string | number | undefined> = {
    with_genres: cat.type === "movie" ? (cat.movieGenres || cat.genres) : (cat.tvGenres || cat.genres),
    with_watch_providers: NETFLIX_PROVIDER,
    watch_region: watchRegion,
    sort_by: cat.sortBy || "popularity.desc",
    page: cat.page || 1,
  };
  if (cat.voteCountGte) {
    params["vote_count.gte"] = cat.voteCountGte;
  }

  const data = await tmdbFetch<Paged<MediaItem>>(`/discover/${cat.type}`, params);
  const mapped = (data.results || []).map((i) => ({ ...i, media_type: cat.type }));
  return enrichWithTitleBackdrops(mapped, cat.type);
}

function resolveType(item: MediaItem): "movie" | "tv" {
  if (item.media_type) return item.media_type as "movie" | "tv";
  if ("title" in item && item.title) return "movie";
  return "tv";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") || "US";
  const type = (searchParams.get("type") as "movie" | "tv" | "all") || "all";
  const genre = searchParams.get("genre") || "all";

  try {
    const categoryDefs = getGenreCategories(genre, type);

    const results = await Promise.allSettled(
      categoryDefs.map(async (cat) => {
        const items = await fetchCategory(cat, country);
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
    console.error("Netflix categories error:", error);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}

