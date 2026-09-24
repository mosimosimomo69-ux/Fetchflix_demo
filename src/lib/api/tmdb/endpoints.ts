import { tmdbFetch, pickBestLogo } from "./client";
import type {
  MediaDetails,
  MediaItem,
  Paged,
  SeasonDetails,
  PersonDetails,
  MediaType,
} from "./types";
import { WATCH_REGION } from "@/lib/constants";

export const EMPTY_PAGED: Paged<MediaItem> = {
  page: 1,
  results: [],
  total_pages: 0,
  total_results: 0,
};

const backdropCache = new Map<string, string>();

export async function enrichWithTitleBackdrops(
  items: MediaItem[],
  defaultType?: MediaType
): Promise<MediaItem[]> {
  return Promise.all(
    items.map(async (item) => {
      const type = (item.media_type || defaultType || "movie") as MediaType;
      const cacheKey = `${type}-${item.id}`;
      if (backdropCache.has(cacheKey)) {
        return { ...item, backdrop_path: backdropCache.get(cacheKey)! };
      }
      try {
        const imgData = await tmdbFetch<{
          backdrops?: Array<{ file_path: string; iso_639_1?: string | null }>;
          posters?: Array<{ file_path: string; iso_639_1?: string | null }>;
          logos?: Array<{ file_path: string; iso_639_1?: string | null }>;
        }>(`/${type}/${item.id}/images`, { include_image_language: "en,null" });
        // Theatrical / English backdrop with official title text (iso_639_1 === "en")
        const enBackdrop =
          imgData.backdrops?.find((b) => b.iso_639_1 === "en")?.file_path ||
          imgData.backdrops?.find((b) => b.iso_639_1 === null || b.iso_639_1 === "")?.file_path ||
          imgData.backdrops?.[0]?.file_path;
        const enPoster =
          imgData.posters?.find((p) => p.iso_639_1 === "en")?.file_path ||
          imgData.posters?.find((p) => p.iso_639_1 === null)?.file_path;
        const logo_path = pickBestLogo(imgData.logos);

        if (enBackdrop) {
          backdropCache.set(cacheKey, enBackdrop);
        }

        return {
          ...item,
          backdrop_path: enBackdrop || item.backdrop_path,
          poster_path: enPoster || item.poster_path,
          logo_path: logo_path || item.logo_path,
        };
      } catch {}
      return item;
    })
  );
}


export async function getHeroSlides(): Promise<MediaItem[]> {
  const data = await tmdbFetch<Paged<MediaItem>>("/trending/all/day");
  const topItems = data.results.slice(0, 6);

  return Promise.all(
    topItems.map(async (item) => {
      const type = (item.media_type || "movie") as MediaType;
      try {
        const imgData = await tmdbFetch<{
          backdrops?: Array<{ file_path: string; iso_639_1?: string | null }>;
          logos?: Array<{ file_path: string; iso_639_1?: string | null }>;
        }>(`/${type}/${item.id}/images`, { include_image_language: "en,null" });

        // Clean textless backdrop without text (iso_639_1 === null)
        const textlessBackdrop =
          imgData.backdrops?.find((b) => b.iso_639_1 === null)?.file_path ||
          item.backdrop_path;
        const logo_path = pickBestLogo(imgData.logos);

        return {
          ...item,
          backdrop_path: textlessBackdrop,
          logo_path,
        };
      } catch {
        return item;
      }
    })
  );
}

export async function getTrendingAll(window: "day" | "week" = "day") {
  const data = await tmdbFetch<Paged<MediaItem>>(`/trending/all/${window}`);
  return enrichWithTitleBackdrops(data.results);
}

export async function getTop10Today() {
  const data = await tmdbFetch<Paged<MediaItem>>("/trending/all/day");
  return enrichWithTitleBackdrops(data.results.slice(0, 10));
}


export async function getTrendingMovies(window: "day" | "week" = "day") {
  const data = await tmdbFetch<Paged<MediaItem>>(`/trending/movie/${window}`);
  const items = data.results.map((item) => ({ ...item, media_type: "movie" }));
  return enrichWithTitleBackdrops(items, "movie");
}

export async function getTrendingTV(window: "day" | "week" = "day") {
  const data = await tmdbFetch<Paged<MediaItem>>(`/trending/tv/${window}`);
  const items = data.results.map((item) => ({ ...item, media_type: "tv" }));
  return enrichWithTitleBackdrops(items, "tv");
}

export async function getTopRatedMovies(page = 1) {
  const data = await tmdbFetch<Paged<MediaItem>>("/movie/top_rated", { page });
  const items = data.results.map((i) => ({ ...i, media_type: "movie" }));
  const results = await enrichWithTitleBackdrops(items, "movie");
  return {
    ...data,
    results,
  };
}

export async function getTopRatedTV(page = 1) {
  const data = await tmdbFetch<Paged<MediaItem>>("/tv/top_rated", { page });
  const items = data.results.map((i) => ({ ...i, media_type: "tv" }));
  const results = await enrichWithTitleBackdrops(items, "tv");
  return {
    ...data,
    results,
  };
}

export async function getPopularMovies(page = 1) {
  const data = await tmdbFetch<Paged<MediaItem>>("/movie/popular", { page });
  const items = data.results.map((i) => ({ ...i, media_type: "movie" }));
  const results = await enrichWithTitleBackdrops(items, "movie");
  return {
    ...data,
    results,
  };
}

export async function getPopularTV(page = 1) {
  const data = await tmdbFetch<Paged<MediaItem>>("/tv/popular", { page });
  const items = data.results.map((i) => ({ ...i, media_type: "tv" }));
  const results = await enrichWithTitleBackdrops(items, "tv");
  return {
    ...data,
    results,
  };
}

export async function getAnimeMedia(page = 1) {
  const data = await tmdbFetch<Paged<MediaItem>>("/discover/tv", {
    with_genres: "16",
    with_original_language: "ja",
    sort_by: "popularity.desc",
    page,
  });
  const items = data.results.map((i) => ({ ...i, media_type: "tv" }));
  const results = await enrichWithTitleBackdrops(items, "tv");
  return {
    ...data,
    results,
  };
}

export async function get4KMedia(page = 1) {
  const data = await tmdbFetch<Paged<MediaItem>>("/discover/movie", {
    sort_by: "popularity.desc",
    "vote_count.gte": "1000",
    "vote_average.gte": "6.5",
    page,
  });
  const items = data.results.map((i) => ({ ...i, media_type: "movie" }));
  const results = await enrichWithTitleBackdrops(items, "movie");
  return {
    ...data,
    results,
  };
}

interface DiscoverOptions {
  type?: MediaType;
  genreId?: number;
  providerId?: number;
  page?: number;
  sortBy?: string;
  region?: string;
}

export async function discoverMedia({
  type = "movie",
  genreId,
  providerId,
  page = 1,
  sortBy = "popularity.desc",
  region,
}: DiscoverOptions) {
  const watchRegion = region || (providerId ? WATCH_REGION : undefined);
  const data = await tmdbFetch<Paged<MediaItem>>(`/discover/${type}`, {
    with_genres: genreId,
    with_watch_providers: providerId,
    watch_region: watchRegion,
    region: region,
    sort_by: sortBy,
    page,
    include_adult: false,
  });
  const items = data.results.map((i) => ({ ...i, media_type: type }));
  const results = await enrichWithTitleBackdrops(items, type);
  return {
    ...data,
    results,
  };
}



export async function getMovieDetails(id: number) {
  const data = await tmdbFetch<MediaDetails>(`/movie/${id}`, {
    append_to_response: "credits,videos,similar,recommendations,images,external_ids",
    include_image_language: "en,null",
  });
  const logo_path = pickBestLogo(data.images?.logos);

  let videos = data.videos?.results || [];
  const hasTrailer = videos.some(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );
  if (!hasTrailer) {
    try {
      const movieVideos = await tmdbFetch<{ results: typeof videos }>(`/movie/${id}/videos`, {
        include_video_language: "en,null",
      }).catch(() => null);
      if (movieVideos?.results?.length) {
        videos = [...videos, ...movieVideos.results];
      }
    } catch {}
  }

  const [recommendationsResults, similarResults] = await Promise.all([
    data.recommendations?.results?.length
      ? enrichWithTitleBackdrops(data.recommendations.results, "movie")
      : Promise.resolve([]),
    data.similar?.results?.length
      ? enrichWithTitleBackdrops(data.similar.results, "movie")
      : Promise.resolve([]),
  ]);

  return {
    ...data,
    videos: { results: videos },
    logo_path,
    recommendations: data.recommendations
      ? { ...data.recommendations, results: recommendationsResults }
      : undefined,
    similar: data.similar
      ? { ...data.similar, results: similarResults }
      : undefined,
  };
}

export async function getTVDetails(id: number) {
  const data = await tmdbFetch<MediaDetails>(`/tv/${id}`, {
    append_to_response: "credits,videos,similar,recommendations,images,external_ids",
    include_image_language: "en,null",
  });
  const logo_path = pickBestLogo(data.images?.logos);

  let videos = data.videos?.results || [];
  const hasTrailer = videos.some(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );
  if (!hasTrailer) {
    try {
      const s1Videos = await tmdbFetch<{ results: typeof videos }>(`/tv/${id}/season/1/videos`, {
        include_video_language: "en,null",
      }).catch(() => null);
      if (s1Videos?.results?.length) {
        videos = [...videos, ...s1Videos.results];
      }
    } catch {}
    if (!videos.some((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))) {
      try {
        const tvVideos = await tmdbFetch<{ results: typeof videos }>(`/tv/${id}/videos`, {
          include_video_language: "en,null",
        }).catch(() => null);
        if (tvVideos?.results?.length) {
          videos = [...videos, ...tvVideos.results];
        }
      } catch {}
    }
  }

  const [recommendationsResults, similarResults] = await Promise.all([
    data.recommendations?.results?.length
      ? enrichWithTitleBackdrops(data.recommendations.results, "tv")
      : Promise.resolve([]),
    data.similar?.results?.length
      ? enrichWithTitleBackdrops(data.similar.results, "tv")
      : Promise.resolve([]),
  ]);

  return {
    ...data,
    videos: { results: videos },
    logo_path,
    recommendations: data.recommendations
      ? { ...data.recommendations, results: recommendationsResults }
      : undefined,
    similar: data.similar
      ? { ...data.similar, results: similarResults }
      : undefined,
  };
}

export async function getDetails(type: MediaType, id: number) {
  return type === "tv" ? getTVDetails(id) : getMovieDetails(id);
}


const NETFLIX_PROVIDER_ID = 8;

export async function getNetflixTrending(mediaType: "movie" | "tv" | "all" = "all", page = 1, region?: string, genreId?: number) {
  if (mediaType === "all") {
    const [movies, tv] = await Promise.all([
      discoverMedia({ type: "movie", providerId: NETFLIX_PROVIDER_ID, page, sortBy: "popularity.desc", region, genreId }),
      discoverMedia({ type: "tv", providerId: NETFLIX_PROVIDER_ID, page, sortBy: "popularity.desc", region, genreId }),
    ]);
    const merged = [...movies.results, ...tv.results].sort(
      (a, b) => b.vote_average - a.vote_average
    );
    return { ...movies, results: merged };
  }
  return discoverMedia({ type: mediaType, providerId: NETFLIX_PROVIDER_ID, page, sortBy: "popularity.desc", region, genreId });
}

export async function getNetflixTopRated(mediaType: "movie" | "tv" | "all" = "tv", page = 1, region?: string, genreId?: number) {
  if (mediaType === "all") {
    const [movies, tv] = await Promise.all([
      discoverMedia({ type: "movie", providerId: NETFLIX_PROVIDER_ID, page, sortBy: "vote_average.desc", region, genreId }),
      discoverMedia({ type: "tv", providerId: NETFLIX_PROVIDER_ID, page, sortBy: "vote_average.desc", region, genreId }),
    ]);
    const merged = [...movies.results, ...tv.results].sort(
      (a, b) => b.vote_average - a.vote_average
    );
    return { ...movies, results: merged };
  }
  return discoverMedia({ type: mediaType, providerId: NETFLIX_PROVIDER_ID, page, sortBy: "vote_average.desc", region, genreId });
}

export async function getNetflixNew(mediaType: "movie" | "tv" | "all" = "all", page = 1, region?: string, genreId?: number) {
  if (mediaType === "all") {
    const [movies, tv] = await Promise.all([
      discoverMedia({ type: "movie", providerId: NETFLIX_PROVIDER_ID, page, sortBy: "primary_release_date.desc", region, genreId }),
      discoverMedia({ type: "tv", providerId: NETFLIX_PROVIDER_ID, page, sortBy: "first_air_date.desc", region, genreId }),
    ]);
    const merged = [...movies.results, ...tv.results];
    return { ...movies, results: merged };
  }
  const sortBy = mediaType === "tv" ? "first_air_date.desc" : "primary_release_date.desc";
  return discoverMedia({ type: mediaType, providerId: NETFLIX_PROVIDER_ID, page, sortBy, region, genreId });
}

export async function searchMulti(query: string, page = 1) {
  const data = await tmdbFetch<Paged<MediaItem>>("/search/multi", {
    query,
    page,
    include_adult: false,
  });
  return data.results.filter(
    (r) => r.media_type === "movie" || r.media_type === "tv"
  );
}

export async function searchByType(
  query: string,
  type: "movie" | "tv",
  page = 1
) {
  const data = await tmdbFetch<Paged<MediaItem>>(`/search/${type}`, {
    query,
    page,
    include_adult: false,
  });
  return {
    ...data,
    results: data.results.map((i) => ({ ...i, media_type: type })),
  };
}

export async function getSeasonDetails(tvId: number, seasonNumber: number) {
  return tmdbFetch<SeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`);
}

export async function getPersonDetails(id: number): Promise<PersonDetails> {
  const data = await tmdbFetch<PersonDetails>(`/person/${id}`, {
    append_to_response: "combined_credits,external_ids,images",
  });

  if (data.combined_credits?.cast) {
    const seen = new Set<string>();
    const filteredCast = data.combined_credits.cast.filter((item) => {
      const key = `${item.media_type || "movie"}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return Boolean(item.poster_path || item.backdrop_path || item.title || item.name);
    });

    filteredCast.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    data.combined_credits.cast = filteredCast;
  }

  return data;
}

