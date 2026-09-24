import { getPopularMovies, withFallback, EMPTY_PAGED } from "@/lib/api/tmdb";
import { MOVIE_GENRES } from "@/lib/constants";
import { CategoryBrowseView, type CategoryTab } from "@/components/media/CategoryBrowseView";

export const revalidate = 3600;

export default async function MoviePage() {
  const data = await withFallback(() => getPopularMovies(1), EMPTY_PAGED);

  const tabs: CategoryTab[] = [
    { id: "popular", name: "Most popular", sortBy: "popularity.desc" },
    { id: "rating", name: "Most rating", sortBy: "vote_average.desc" },
    { id: "recent", name: "Most recent", sortBy: "primary_release_date.desc" },
    ...MOVIE_GENRES.map((g) => ({
      id: String(g.id),
      name: g.name,
      genreId: g.id,
    })),
  ];

  return (
    <CategoryBrowseView
      type="movie"
      initialItems={data.results}
      tabs={tabs}
    />
  );
}
