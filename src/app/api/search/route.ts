import { NextResponse } from "next/server";
import { searchMulti, searchByType, enrichWithTitleBackdrops } from "@/lib/api/tmdb";
import { rateLimit, sanitizeString, allowList } from "@/lib/security";

const ALLOWED_TYPES = ["all", "movie", "tv"] as const;

export async function GET(req: Request) {
  // Tighter rate limit for search — prevent brute-force scraping
  const limited = rateLimit(req, 30, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);

  // Sanitize: strip control chars, cap at 100 chars
  const q = sanitizeString(searchParams.get("q"), 100);
  const type = allowList(searchParams.get("type"), ALLOWED_TYPES, "all");

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    if (type === "movie" || type === "tv") {
      const data = await searchByType(q, type);
      const enriched = await enrichWithTitleBackdrops(data.results.slice(0, 10), type);
      return NextResponse.json(
        { results: enriched },
        { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } }
      );
    }

    const results = await searchMulti(q);
    const enriched = await enrichWithTitleBackdrops(results.slice(0, 10));
    return NextResponse.json(
      { results: enriched },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } }
    );
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
