import { NextResponse } from "next/server";
import { tmdbFetch, pickBestLogo } from "@/lib/api/tmdb";
import { rateLimit, parsePositiveInt, allowList } from "@/lib/security";

export async function GET(req: Request) {
  const limited = rateLimit(req, 120);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const type = allowList(searchParams.get("type"), ["tv", "movie"] as const, "movie");
  const id = parsePositiveInt(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ logo_path: null, backdrop_path: null }, { status: 400 });
  }

  try {
    const data = await tmdbFetch<{
      logos?: Array<{ file_path: string; iso_639_1?: string | null }>;
      backdrops?: Array<{ file_path: string; iso_639_1?: string | null; vote_average?: number }>;
    }>(`/${type}/${id}/images`, { include_image_language: "en,null" });

    // Clean textless backdrop without text (iso_639_1 === null or "")
    const textlessBackdrop =
      data.backdrops?.find((b) => b.iso_639_1 === null || b.iso_639_1 === "")?.file_path ||
      data.backdrops?.[0]?.file_path ||
      null;

    return NextResponse.json(
      { logo_path: pickBestLogo(data.logos), backdrop_path: textlessBackdrop },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } }
    );
  } catch {
    return NextResponse.json({ logo_path: null, backdrop_path: null });
  }
}
