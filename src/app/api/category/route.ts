import { NextResponse } from "next/server";
import {
  discoverMedia,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getTopRatedTV,
} from "@/lib/api/tmdb";
import type { MediaType } from "@/lib/api/tmdb";
import { rateLimit, allowList, parsePositiveInt, sanitizeSortBy } from "@/lib/security";

const ALLOWED_TYPES = ["movie", "tv"] as const;

export async function GET(req: Request) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);

  const type = allowList(searchParams.get("type"), ALLOWED_TYPES, "movie") as MediaType;
  const sortBy = sanitizeSortBy(searchParams.get("sortBy"));
  const page = Math.min(parsePositiveInt(searchParams.get("page")) ?? 1, 500);
  const genreId = parsePositiveInt(searchParams.get("genreId")) ?? undefined;

  try {
    let data;
    if (!genreId && sortBy === "popularity.desc") {
      data = type === "tv" ? await getPopularTV(page) : await getPopularMovies(page);
    } else if (!genreId && sortBy === "vote_average.desc") {
      data = type === "tv" ? await getTopRatedTV(page) : await getTopRatedMovies(page);
    } else {
      data = await discoverMedia({ type, genreId, sortBy, page });
    }

    // Note: getPopularMovies/TV, getTopRatedMovies/TV, discoverMedia already call
    // enrichWithTitleBackdrops internally — no need to call it again here
    return NextResponse.json(
      { ...data },
      { headers: { "Cache-Control": "public, max-age=1800, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json(
      { results: [], error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}
