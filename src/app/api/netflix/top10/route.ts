import { NextResponse } from "next/server";
import { NETFLIX_GENRES } from "@/lib/constants";

const COUNTRY_SLUGS: Record<string, string> = {
  US: "united-states", IN: "india", GB: "united-kingdom", JP: "japan",
  KR: "south-korea", CA: "canada", AU: "australia", DE: "germany",
  FR: "france", BR: "brazil", MX: "mexico", ES: "spain", IT: "italy",
  NL: "netherlands", PH: "philippines", TH: "thailand", ID: "indonesia",
  TR: "türkiye", AR: "argentina", PK: "pakistan", BD: "bangladesh",
  LK: "sri-lanka", NG: "nigeria", EG: "egypt", SA: "saudi-arabia",
  AE: "united-arab-emirates", CO: "colombia", CL: "chile", PE: "peru",
  PL: "poland", SE: "sweden", NO: "norway", DK: "denmark", FI: "finland",
  PT: "portugal", GR: "greece", CZ: "czech-republic", RO: "romania",
  HU: "hungary", UA: "ukraine", VN: "vietnam", MY: "malaysia", SG: "singapore",
  NZ: "new-zealand", IE: "ireland", IL: "israel", KE: "kenya", ZA: "south-africa",
};

interface Top10Entry {
  rank: number;
  title: string;
  weeks: number;
}

interface ParsedPage {
  entries: Top10Entry[];
  dateRange: string | null;
}

const cache = new Map<string, { data: ParsedPage; ts: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000;

function parseNetflixTop10(html: string): ParsedPage {
  const entries: Top10Entry[] = [];
  const rowRegex = /<tr>\s*<td[^>]*data-uia="top10-table-row-title"[^>]*>[\s\S]*?<span[^>]*class="rank"[^>]*>(\d{2})<\/span>[\s\S]*?<button>([^<]+)<\/button>[\s\S]*?<\/td>\s*<td[^>]*data-uia="top10-table-row-weeks"[^>]*>(\d+)<\/td>\s*<\/tr>/g;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    entries.push({
      rank: parseInt(match[1], 10),
      title: match[2].trim(),
      weeks: parseInt(match[3], 10),
    });
  }

  let dateRange: string | null = null;
  const dateMatch = html.match(/(\d{1,2}\/\d{1,2}\/\d{2})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{2})/);
  if (dateMatch) dateRange = `${dateMatch[1]} - ${dateMatch[2]}`;

  return { entries, dateRange };
}

async function fetchNetflixTop10(country: string, type: string): Promise<ParsedPage> {
  const cacheKey = `${country}-${type}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const slug = COUNTRY_SLUGS[country.toUpperCase()];
  if (!slug) return { entries: [], dateRange: null };

  const url = `https://www.netflix.com/tudum/top10/${slug}/${type}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    next: { revalidate: 21600 },
  });

  if (!res.ok) return { entries: [], dateRange: null };
  const html = await res.text();
  const result = parseNetflixTop10(html);

  if (result.entries.length > 0) {
    cache.set(cacheKey, { data: result, ts: Date.now() });
  }
  return result;
}

function cleanTitleForSearch(title: string): string {
  return title
    .replace(/:\s*(Season \d+|Limited Series|Part \d+)$/i, "")
    .replace(/:\s*\d{4}\s*-\s*\w+ \d{1,2},\s*\d{4}$/i, "")
    .replace(/\s*\(\d{4}\)$/i, "")
    .trim();
}

async function enrichEntries(entries: Top10Entry[]) {
  const { searchMulti } = await import("@/lib/api/tmdb/endpoints");

  const enriched = await Promise.allSettled(
    entries.map(async (entry) => {
      const clean = cleanTitleForSearch(entry.title);
      const results = await searchMulti(clean);
      const item = results[0] || null;
      return { rank: entry.rank, weeks: entry.weeks, title: entry.title, item };
    })
  );

  return enriched
    .filter((r): r is PromiseFulfilledResult<{ rank: number; weeks: number; title: string; item: any }> =>
      r.status === "fulfilled" && r.value.item !== null
    )
    .map((r) => r.value);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") || "IN";
  const type = searchParams.get("type") || "all";
  const genre = searchParams.get("genre") || "all";

  const targetGenre = NETFLIX_GENRES.find((g) => g.id === genre);
  const matchesGenre = (item: any) => {
    if (!targetGenre || targetGenre.id === "all") return true;
    if (!item || !Array.isArray(item.genre_ids)) return false;
    const movieGId = targetGenre.movieGenreId;
    const tvGId = targetGenre.tvGenreId;
    return (
      (movieGId ? item.genre_ids.includes(movieGId) : false) ||
      (tvGId ? item.genre_ids.includes(tvGId) : false)
    );
  };

  try {
    if (type === "all") {
      const [tvResult, movieResult] = await Promise.all([
        fetchNetflixTop10(country, "tv"),
        fetchNetflixTop10(country, "movies"),
      ]);

      const [tvResults, movieResults] = await Promise.all([
        enrichEntries(tvResult.entries),
        enrichEntries(movieResult.entries),
      ]);

      const filteredTv = tvResults.filter((r) => matchesGenre(r.item));
      const filteredMovies = movieResults.filter((r) => matchesGenre(r.item));

      const merged: typeof tvResults = [];
      const maxLen = Math.max(filteredTv.length, filteredMovies.length);
      for (let i = 0; i < maxLen; i++) {
        if (filteredTv[i]) merged.push(filteredTv[i]);
        if (filteredMovies[i]) merged.push(filteredMovies[i]);
      }

      return NextResponse.json({
        results: merged.slice(0, 10),
        tv: { results: filteredTv, dateRange: tvResult.dateRange },
        movies: { results: filteredMovies, dateRange: movieResult.dateRange },
        dateRange: tvResult.dateRange || movieResult.dateRange,
      });
    }

    const netflixType = type === "movie" ? "movies" : type;
    const result = await fetchNetflixTop10(country, netflixType);
    const results = await enrichEntries(result.entries);
    const filteredResults = results.filter((r) => matchesGenre(r.item));

    return NextResponse.json({
      results: filteredResults,
      dateRange: result.dateRange,
      tv: type === "tv" ? { results: filteredResults, dateRange: result.dateRange } : null,
      movies: type === "movie" ? { results: filteredResults, dateRange: result.dateRange } : null,
    });
  } catch (error) {
    console.error("Netflix Top 10 API error:", error);
    return NextResponse.json(
      { results: [], dateRange: null, tv: { results: [], dateRange: null }, movies: { results: [], dateRange: null } },
      { status: 500 }
    );
  }
}

