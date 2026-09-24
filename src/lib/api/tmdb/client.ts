const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// IMPORTANT: Use TMDB_API_KEY (no NEXT_PUBLIC_ prefix) so this secret stays
// server-side only and is never bundled into the client JavaScript.
const API_KEY = process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "";

export class TmdbError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
  }
}

type TmdbParams = Record<string, string | number | boolean | undefined>;

export async function tmdbFetch<T>(
  endpoint: string,
  params: TmdbParams = {}
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const isJwt = API_KEY.startsWith("eyJ");
  if (!isJwt && API_KEY) {
    url.searchParams.set("api_key", API_KEY);
  }

  const headers: Record<string, string> = {
    accept: "application/json",
  };

  if (isJwt) {
    headers.Authorization = `Bearer ${API_KEY}`;
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new TmdbError(
      `TMDB request failed for ${endpoint}: ${res.status} ${res.statusText}`,
      res.status
    );
  }

  return (await res.json()) as T;
}

export async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[tmdb] request failed, using fallback:", error);
    return fallback;
  }
}

function tmdbImage(path: string | null, size: string, fallback: string) {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : fallback;
}

export function posterUrl(path: string | null, size = "w500") {
  return tmdbImage(path, size, "/placeholder-poster.svg");
}

export function backdropUrl(path: string | null, size = "original") {
  return tmdbImage(path, size, "/placeholder-backdrop.svg");
}

export function profileUrl(path: string | null, size = "w185") {
  return tmdbImage(path, size, "/placeholder-profile.svg");
}

export function stillUrl(path: string | null, size = "w500") {
  return tmdbImage(path, size, "/placeholder-backdrop.svg");
}

export function logoUrl(path: string | null, size = "w500") {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : "";
}

export function pickBestLogo(logos?: Array<{ file_path: string; iso_639_1?: string | null }>): string | null {
  if (!logos || logos.length === 0) return null;
  const enLogo = logos.find(
    (l) => (l.iso_639_1 === "en" || !l.iso_639_1) && l.file_path.endsWith(".png")
  );
  if (enLogo) return enLogo.file_path;
  const anyPng = logos.find((l) => l.file_path.endsWith(".png"));
  if (anyPng) return anyPng.file_path;
  return logos[0]?.file_path || null;
}

export function wsrvUrl(url: string, quality = 80) {
  if (url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=webp&q=${quality}&n=-1`;
}


