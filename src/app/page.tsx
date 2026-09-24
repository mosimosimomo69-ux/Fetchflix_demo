import { HeroBanner } from "@/components/media/HeroBanner";
import { Top10Row } from "@/components/media/Top10Row";
import { TrendingRow } from "@/components/media/TrendingRow";
import { ProviderRow } from "@/components/media/ProviderRow";
import { TopRatedRow } from "@/components/media/TopRatedRow";
import { GenreRow } from "@/components/media/GenreRow";
import {
  getHeroSlides,
  getTop10Today,
  getTrendingAll,
  getTrendingMovies,
  getTrendingTV,
  getTopRatedMovies,
  getTopRatedTV,
  discoverMedia,
  withFallback,
  EMPTY_PAGED,
} from "@/lib/api/tmdb";
import type { MediaItem } from "@/lib/api/tmdb";

export const revalidate = 3600;

export default async function HomePage() {
  const [
    heroSlides,
    top10,
    trendingAll,
    trendingMovies,
    trendingTV,
    topRatedMovies,
    topRatedTV,
    netflixMovies,
    netflixTV,
    comedyContent,
  ] = await Promise.all([
    withFallback(getHeroSlides, [] as MediaItem[]),
    withFallback(getTop10Today, [] as MediaItem[]),
    withFallback(getTrendingAll, [] as MediaItem[]),
    withFallback(getTrendingMovies, [] as MediaItem[]),
    withFallback(getTrendingTV, [] as MediaItem[]),
    withFallback(() => getTopRatedMovies(1), EMPTY_PAGED),
    withFallback(() => getTopRatedTV(1), EMPTY_PAGED),
    withFallback(() => discoverMedia({ type: "movie", providerId: 8, sortBy: "popularity.desc" }), EMPTY_PAGED),
    withFallback(() => discoverMedia({ type: "tv", providerId: 8, sortBy: "popularity.desc" }), EMPTY_PAGED),
    withFallback(() => discoverMedia({ genreId: 35 }), EMPTY_PAGED),
  ]);


  return (
    <div className="pb-16">
      {/* 1. Hero Showcase Banner */}
      <HeroBanner slides={heroSlides} />

      {/* 2. Content Rows Container */}
      <div className="mt-4 md:mt-6 space-y-12 md:space-y-16">
        {/* 2. TOP 10 Today Section (matching screenshot Home (2).png) */}
        <Top10Row items={top10.length > 0 ? top10 : trendingAll.slice(0, 10)} />

        {/* 3. Trending Today Section with Movies/Series tabs (matching screenshot Home (3).png) */}
        <TrendingRow
          movieItems={trendingMovies.slice(0, 20)}
          tvItems={trendingTV.slice(0, 20)}
        />

        {/* 4. Only on Netflix/Provider Section with Movies/Series tabs */}
        <ProviderRow
          initialMovieItems={netflixMovies.results.slice(0, 20)}
          initialTvItems={netflixTV.results.slice(0, 20)}
          initialProviderId={8}
        />

        {/* 5. Top Rated Section with Movies/Series tabs (matching screenshot Home (4).png) */}
        <TopRatedRow
          movieItems={topRatedMovies.results.slice(0, 20)}
          tvItems={topRatedTV.results.slice(0, 20)}
        />

        {/* 6. Comedy / Genre Section with Movies/Series tabs (matching screenshot Home (5).png) */}
        <GenreRow
          initialItems={comedyContent.results.slice(0, 20)}
          initialGenreId={35}
          initialGenreName="Comedy"
        />
      </div>
    </div>
  );

}
