/**
 * Security utilities for API routes.
 * - Input sanitisation (strip non-printable chars, limit length)
 * - Strict allow-lists for enum params
 * - Lightweight in-memory rate limiter (per IP, per minute)
 */

import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Input sanitisation
// ---------------------------------------------------------------------------

/** Strip control characters, trim, and cap length. */
export function sanitizeString(value: string | null | undefined, maxLen = 128): string {
  if (!value) return "";
  // Remove all non-printable ASCII / Unicode control chars
  return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim().slice(0, maxLen);
}

/** Parse a strictly positive integer from a string param. Returns null on failure. */
export function parsePositiveInt(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0 || String(n) !== value.trim()) return null;
  return n;
}

/** Validate that a value is one of the allowed strings. */
export function allowList<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  if (value && (allowed as readonly string[]).includes(value)) return value as T;
  return fallback;
}

/** Safe sort-by value: only allow known TMDB sort fields. */
const ALLOWED_SORT_FIELDS = [
  "popularity.desc",
  "popularity.asc",
  "vote_average.desc",
  "vote_average.asc",
  "primary_release_date.desc",
  "primary_release_date.asc",
  "first_air_date.desc",
  "first_air_date.asc",
  "revenue.desc",
  "revenue.asc",
] as const;

export type AllowedSortBy = (typeof ALLOWED_SORT_FIELDS)[number];

export function sanitizeSortBy(value: string | null | undefined): AllowedSortBy {
  return allowList(value, ALLOWED_SORT_FIELDS, "popularity.desc");
}

/** Validate a genre/provider ID string: digits and commas only. */
export function sanitizeIdList(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[^0-9,]/g, "").slice(0, 64);
  return cleaned || undefined;
}

/** Validate a 2-letter ISO 3166-1 country code. */
export function sanitizeCountry(value: string | null | undefined): string {
  if (!value) return "US";
  const code = value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2);
  return code.length === 2 ? code : "US";
}

// ---------------------------------------------------------------------------
// Lightweight rate limiter (in-process, resets on restart — good for dev/hobby)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/** Periodically purge expired entries to avoid memory leaks. */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) rateLimitMap.delete(key);
  }
}, 60_000);

/**
 * Returns a 429 response if the IP has exceeded `limit` requests in `windowMs`.
 * Returns null if the request is allowed.
 */
export function rateLimit(
  req: Request,
  limit = 60,
  windowMs = 60_000
): NextResponse | null {
  // Try to get the real IP from common proxy headers
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count += 1;

  if (entry.count > limit) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
