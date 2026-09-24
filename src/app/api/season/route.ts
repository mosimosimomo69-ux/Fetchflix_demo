import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSeasonDetails } from "@/lib/api/tmdb";
import { rateLimit, parsePositiveInt } from "@/lib/security";

export async function GET(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;

  const tvId = parsePositiveInt(request.nextUrl.searchParams.get("tvId"));
  const rawSeason = request.nextUrl.searchParams.get("season");
  const season = rawSeason === "0" ? 0 : parsePositiveInt(rawSeason);

  if (!tvId || season === null) {
    return NextResponse.json(
      { error: "Valid 'tvId' and 'season' query params are required." },
      { status: 400 }
    );
  }

  try {
    const data = await getSeasonDetails(tvId, season);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch season details." },
      { status: 502 }
    );
  }
}
