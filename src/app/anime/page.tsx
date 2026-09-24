import { getAnimeMedia, withFallback, EMPTY_PAGED } from "@/lib/api/tmdb";
import { CategoryBrowseView, type CategoryTab } from "@/components/media/CategoryBrowseView";

export const revalidate = 3600;

export default async function AnimePage() {
  const data = await withFallback(() => getAnimeMedia(1), EMPTY_PAGED);

  const tabs: CategoryTab[] = [
    { id: "popular", name: "Most popular", sortBy: "popularity.desc" },
    { id: "rating", name: "Most rating", sortBy: "vote_average.desc" },
    { id: "recent", name: "Most recent", sortBy: "first_air_date.desc" },
    { id: "10759", name: "Action & Adventure", genreId: 10759 },
    { id: "10765", name: "Sci-Fi & Fantasy", genreId: 10765 },
    { id: "35", name: "Comedy", genreId: 35 },
    { id: "18", name: "Drama", genreId: 18 },
  ];

  return (
    <CategoryBrowseView
      type="tv"
      title="Anime"
      initialItems={data.results}
      tabs={tabs}
    />
  );
}
