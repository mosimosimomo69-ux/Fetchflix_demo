import { getPopularTV, withFallback, EMPTY_PAGED } from "@/lib/api/tmdb";
import { TV_GENRES } from "@/lib/constants";
import { CategoryBrowseView, type CategoryTab } from "@/components/media/CategoryBrowseView";

export const revalidate = 3600;

export default async function TVPage() {
  const data = await withFallback(() => getPopularTV(1), EMPTY_PAGED);

  const tabs: CategoryTab[] = [
    { id: "popular", name: "Most popular", sortBy: "popularity.desc" },
    { id: "rating", name: "Most rating", sortBy: "vote_average.desc" },
    { id: "recent", name: "Most recent", sortBy: "first_air_date.desc" },
    ...TV_GENRES.map((g) => ({
      id: String(g.id),
      name: g.name,
      genreId: g.id,
    })),
  ];

  return (
    <CategoryBrowseView
      type="tv"
      initialItems={data.results}
      tabs={tabs}
    />
  );
}
