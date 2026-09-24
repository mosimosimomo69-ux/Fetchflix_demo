import { NextResponse } from "next/server";
import { discoverMedia } from "@/lib/api/tmdb";
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

  // genreId and providerId must be positive integers
  const genreId = parsePositiveInt(searchParams.get("genreId")) ?? undefined;
  const providerId = parsePositiveInt(searchParams.get("providerId")) ?? undefined;

  try {
    const data = await discoverMedia({ type, genreId, providerId, page, sortBy });
    return NextResponse.json(
      { results: data.results || [] },
      { headers: { "Cache-Control": "public, max-age=1800, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    console.error("Discover API error:", error);
    return NextResponse.json(
      { results: [], error: "Failed to discover media" },
      { status: 500 }
    );
  }
}
