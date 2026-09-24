import type { MediaType } from "@/lib/api/tmdb";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getTitle(item: { title?: string; name?: string }) {
  return item.title || item.name || "Untitled";
}

export function getYear(item: {
  release_date?: string;
  first_air_date?: string;
}) {
  return (item.release_date || item.first_air_date || "").slice(0, 4);
}

export function resolveMediaType(item: {
  media_type?: string;
  first_air_date?: string;
  release_date?: string;
  name?: string;
}): MediaType {
  if (item.media_type === "tv") return "tv";
  if (item.media_type === "movie") return "movie";
  if (item.first_air_date && !item.release_date) return "tv";
  return "movie";
}

export function formatRuntime(minutes?: number | null) {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatRating(vote: number) {
  return vote > 0 ? vote.toFixed(1) : "N/A";
}

export function isCameoCredit(credit?: { character?: string | null } | string | null): boolean {
  if (!credit) return false;
  const character = typeof credit === "string" ? credit : credit.character;
  if (!character) return false;
  const lower = character.toLowerCase();
  return (
    lower.includes("cameo") ||
    lower.includes("uncredited") ||
    lower.includes("special appearance") ||
    lower.includes("guest appearance") ||
    lower.includes("self - cameo") ||
    lower.includes("(self)") ||
    lower.includes("himself (cameo)") ||
    lower.includes("herself (cameo)") ||
    lower.includes("himself (uncredited)") ||
    lower.includes("herself (uncredited)")
  );
}

export function calculateAge(birthday: string, deathday?: string | null): number | null {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const endDate = deathday ? new Date(deathday) : new Date();
  let age = endDate.getFullYear() - birthDate.getFullYear();
  const m = endDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return isNaN(age) || age < 0 ? null : age;
}
