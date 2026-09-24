import { NextResponse } from "next/server";
import {
  getNetflixTrending,
  getNetflixTopRated,
  getNetflixNew,
} from "@/lib/api/tmdb";
import { NETFLIX_GENRES } from "@/lib/constants";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "trending";
  const type = (searchParams.get("type") as "movie" | "tv" | "all") || "all";
  const country = searchParams.get("country") || undefined;
  const genre = searchParams.get("genre") || undefined;
  let genreId = searchParams.get("genreId")
    ? Number(searchParams.get("genreId"))
    : undefined;

  if (!genreId && genre && genre !== "all") {
    const found = NETFLIX_GENRES.find((g) => g.id === genre);
    if (found) {
      genreId = type === "tv" ? found.tvGenreId : found.movieGenreId;
    }
  }
  const page = Number(searchParams.get("page")) || 1;

  try {
    let data;
    switch (sort) {
      case "top_rated":
        data = await getNetflixTopRated(type === "all" ? "tv" : type, page, country, genreId);
        break;
      case "new":
        data = await getNetflixNew(type, page, country, genreId);
        break;
      case "trending":
      default:
        data = await getNetflixTrending(type, page, country, genreId);
        break;
    }
    return NextResponse.json({ results: data.results || [] });
  } catch (error) {
    console.error("Netflix API error:", error);
    return NextResponse.json(
      { results: [], error: "Failed to fetch Netflix content" },
      { status: 500 }
    );
  }
}

