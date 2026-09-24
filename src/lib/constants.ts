import type { Genre } from "@/lib/api/tmdb";

export const MOVIE_GENRES: Genre[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export const TV_GENRES: Genre[] = [
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10763, name: "News" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10766, name: "Soap" },
  { id: 10767, name: "Talk" },
  { id: 10768, name: "War & Politics" },
  { id: 37, name: "Western" },
];

export const STREAMING_PROVIDERS = [
  { id: 8, name: "Netflix" },
  { id: 9, name: "Prime Video" },
  { id: 1899, name: "Max" },
  { id: 337, name: "Disney+" },
  { id: 350, name: "Apple TV+" },
  { id: 2303, name: "Paramount+" },
  { id: 15, name: "Hulu" },
] as const;

export interface StreamingNetwork {
  name: string;
  logo?: string;
  keywords?: string;
  genres?: string;
}

export interface StreamingService {
  slug: string;
  name: string;
  providerId: number;
  logo: string;
  color: string;
  colorFaded: string;
  bgPrimary: string;
  bgSecondary: string;
  heroGradient: string;
  filterAccent: string;
  networks: StreamingNetwork[];
  supportedCountries?: readonly string[];
}

export const STREAMING_SERVICES: StreamingService[] = [
  {
    slug: "netflix", name: "Netflix", providerId: 8,
    logo: "/logos/netflix.png", color: "#e50914", colorFaded: "rgba(229,9,20,0.15)",
    bgPrimary: "#0a0a0f", bgSecondary: "#14141c",
    heroGradient: "rgba(229,9,20,0.10)",
    filterAccent: "rgba(229,9,20,0.08)",
    networks: [
      { name: "Netflix Originals", logo: "/logos/netflix.png" },
      { name: "Millarworld", logo: "/logos/netflix.png", keywords: "kick-ass kingsman" },
      { name: "Roald Dahl", logo: "/logos/netflix.png", keywords: "matilda wonka charlie chocolate" },
      { name: "Game Studios", logo: "/logos/netflix.png", keywords: "netflix games" },
    ],
  },
  {
    slug: "prime-video", name: "Prime Video", providerId: 9,
    logo: "/logos/prime-video.png", color: "#00a8e1", colorFaded: "rgba(0,168,225,0.15)",
    bgPrimary: "#0a0e14", bgSecondary: "#0f1923",
    heroGradient: "rgba(0,168,225,0.12)",
    filterAccent: "rgba(0,168,225,0.08)",
    networks: [
      { name: "Amazon MGM Studios", logo: "/logos/networks/amazon-mgm.webp" },
      { name: "MGM+", logo: "/logos/networks/mgm-plus.webp", keywords: "mgm plus" },
      { name: "Freevee", logo: "/logos/networks/freevee.webp", keywords: "freevee imdb tv" },
      { name: "BluTV", logo: "/logos/networks/blutv.webp" },
      { name: "Lionsgate", logo: "/logos/networks/lionsgate.webp" },
      { name: "Epix", logo: "/logos/networks/mgm-plus.webp" },
    ],
  },
  {
    slug: "max", name: "Max", providerId: 1899,
    logo: "/logos/max.png", color: "#b829d7", colorFaded: "rgba(184,41,215,0.15)",
    bgPrimary: "#0c0612", bgSecondary: "#140a1e",
    heroGradient: "rgba(184,41,215,0.10)",
    filterAccent: "rgba(184,41,215,0.08)",
    supportedCountries: ["US", "BR", "MX", "AR", "ES", "NL", "FR"],
    networks: [
      { name: "HBO", logo: "/logos/networks/hbo.png" },
      { name: "Warner Bros.", logo: "/logos/networks/warner-bros.webp", keywords: "warner bros" },
      { name: "DC", logo: "/logos/networks/dc.webp" },
      { name: "Cartoon Network", logo: "/logos/networks/cartoon-network.webp" },
      { name: "Adult Swim", logo: "/logos/networks/adult-swim.webp" },
      { name: "TBS", logo: "/logos/networks/tbs.webp" },
      { name: "TNT", logo: "/logos/networks/tnt.webp" },
      { name: "truTV", logo: "/logos/networks/trutv.webp" },
      { name: "Turner Classic Movies", logo: "/logos/networks/tcm.webp", keywords: "tcm" },
      { name: "Discovery", logo: "/logos/networks/discovery.webp" },
      { name: "HGTV", logo: "/logos/networks/hgtv.webp" },
      { name: "Food Network", logo: "/logos/networks/food-network.webp" },
      { name: "OWN", logo: "/logos/networks/own.webp" },
      { name: "Investigation Discovery", logo: "/logos/networks/investigation-discovery.webp", keywords: "id" },
      { name: "TLC", logo: "/logos/networks/tlc.webp" },
      { name: "Magnolia Network", logo: "/logos/networks/magnolia.webp" },
      { name: "Travel Channel", logo: "/logos/networks/travel-channel.webp" },
      { name: "Animal Planet", logo: "/logos/networks/animal-planet.webp" },
      { name: "Science Channel", logo: "/logos/networks/science-channel.png" },
      { name: "A24", logo: "/logos/networks/a24.webp" },
    ],
  },
  {
    slug: "disney-plus", name: "Disney+", providerId: 337,
    logo: "/logos/disney-plus.png", color: "#113ccf", colorFaded: "rgba(17,60,207,0.15)",
    bgPrimary: "#060a18", bgSecondary: "#0a1028",
    heroGradient: "rgba(17,60,207,0.12)",
    filterAccent: "rgba(17,60,207,0.08)",
    networks: [
      { name: "Disney", logo: "/logos/disney-plus.png" },
      { name: "Pixar", logo: "/logos/networks/pixar.png" },
      { name: "Marvel", logo: "/logos/networks/marvel.svg" },
      { name: "Star Wars", logo: "/logos/networks/star-wars.png", keywords: "lucasfilm" },
      { name: "National Geographic", logo: "/logos/networks/national-geographic.png" },
      { name: "20th Century Studios", logo: "/logos/networks/20th-century.webp", keywords: "20th century fox" },
      { name: "Searchlight Pictures", logo: "/logos/networks/searchlight.webp", keywords: "fox searchlight" },
      { name: "FX", logo: "/logos/networks/fx.webp" },
      { name: "Freeform", logo: "/logos/networks/freeform.webp" },
      { name: "ABC", logo: "/logos/networks/abc.webp" },
      { name: "ESPN", logo: "/logos/networks/espn.png" },
      { name: "Star", logo: "/logos/networks/star.webp" },
      { name: "Onyx Collective", logo: "/logos/networks/onyx-collective.png" },
      { name: "Hulu on Disney+", logo: "/logos/hulu.png" },
    ],
  },
  {
    slug: "apple-tv", name: "Apple TV+", providerId: 350,
    logo: "/logos/apple-tv.png", color: "#a2aaad", colorFaded: "rgba(162,170,173,0.15)",
    bgPrimary: "#000000", bgSecondary: "#0a0a0a",
    heroGradient: "rgba(162,170,173,0.06)",
    filterAccent: "rgba(255,255,255,0.05)",
    networks: [
      { name: "Apple Originals", logo: "/logos/apple-tv.png" },
      { name: "Apple Studios", logo: "/logos/networks/apple-studios.webp" },
      { name: "Snoopy & Friends", logo: "/logos/apple-tv.png" },
    ],
  },
  {
    slug: "hulu", name: "Hulu", providerId: 15,
    logo: "/logos/hulu.png", color: "#1ce783", colorFaded: "rgba(28,231,131,0.15)",
    bgPrimary: "#050e0a", bgSecondary: "#081a12",
    heroGradient: "rgba(28,231,131,0.08)",
    filterAccent: "rgba(28,231,131,0.06)",
    supportedCountries: ["US"],
    networks: [
      { name: "Hulu Originals", logo: "/logos/hulu.png" },
      { name: "ABC", logo: "/logos/networks/abc.webp" },
      { name: "FX", logo: "/logos/networks/fx.webp" },
      { name: "Freeform", logo: "/logos/networks/freeform.webp" },
      { name: "20th Television", logo: "/logos/networks/20th-century.webp", keywords: "20th century fox television" },
      { name: "Searchlight Television", logo: "/logos/networks/searchlight.webp" },
      { name: "Disney Channel", logo: "/logos/networks/disney-channel.webp" },
    ],
  },
  {
    slug: "paramount-plus", name: "Paramount+", providerId: 2303,
    logo: "/logos/paramount-plus.png", color: "#0064ff", colorFaded: "rgba(0,100,255,0.15)",
    bgPrimary: "#040810", bgSecondary: "#081020",
    heroGradient: "rgba(0,100,255,0.12)",
    filterAccent: "rgba(0,100,255,0.08)",
    supportedCountries: ["US", "CA", "GB", "AU", "DE", "FR", "IT", "BR", "MX", "AR", "JP", "KR"],
    networks: [
      { name: "CBS", logo: "/logos/networks/cbs.webp" },
      { name: "Nickelodeon", logo: "/logos/networks/nickelodeon.svg" },
      { name: "MTV", logo: "/logos/networks/mtv.png" },
      { name: "BET", logo: "/logos/networks/bet.webp" },
      { name: "Comedy Central", logo: "/logos/networks/comedy-central.webp" },
      { name: "Showtime", logo: "/logos/networks/showtime.webp" },
      { name: "Paramount Pictures", logo: "/logos/networks/paramount-pictures.webp" },
      { name: "Smithsonian Channel", logo: "/logos/networks/smithsonian.png" },
      { name: "Paramount Network", logo: "/logos/networks/paramount-network.webp" },
      { name: "TV Land", logo: "/logos/networks/tv-land.webp" },
      { name: "VH1", logo: "/logos/networks/vh1.webp" },
      { name: "CMT", logo: "/logos/networks/cmt.webp" },
      { name: "Pop TV", logo: "/logos/networks/pop-tv.webp" },
      { name: "Logo TV", logo: "/logos/networks/logo-tv.webp" },
    ],
  },
];

export function getStreamingService(slug: string): StreamingService | undefined {
  return STREAMING_SERVICES.find((s) => s.slug === slug);
}

export const COUNTRIES = [
  { code: "US", name: "United States", flag: "\uD83C\uDDFA\uD83C\uDDF8" },
  { code: "IN", name: "India", flag: "\uD83C\uDDEE\uD83C\uDDF3" },
  { code: "GB", name: "United Kingdom", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
  { code: "JP", name: "Japan", flag: "\uD83C\uDDEF\uD83C\uDDF5" },
  { code: "KR", name: "South Korea", flag: "\uD83C\uDDF0\uD83C\uDDF7" },
  { code: "CA", name: "Canada", flag: "\uD83C\uDDE8\uD83C\uDDE6" },
  { code: "AU", name: "Australia", flag: "\uD83C\uDDE6\uD83C\uDDFA" },
  { code: "DE", name: "Germany", flag: "\uD83C\uDDE9\uD83C\uDDEA" },
  { code: "FR", name: "France", flag: "\uD83C\uDDEB\uD83C\uDDF7" },
  { code: "BR", name: "Brazil", flag: "\uD83C\uDDE7\uD83C\uDDF7" },
  { code: "MX", name: "Mexico", flag: "\uD83C\uDDF2\uD83C\uDDFD" },
  { code: "ES", name: "Spain", flag: "\uD83C\uDDEA\uD83C\uDDF8" },
  { code: "IT", name: "Italy", flag: "\uD83C\uDDEE\uD83C\uDDF9" },
  { code: "NL", name: "Netherlands", flag: "\uD83C\uDDF3\uD83C\uDDF1" },
  { code: "PH", name: "Philippines", flag: "\uD83C\uDDF5\uD83C\uDDED" },
  { code: "TH", name: "Thailand", flag: "\uD83C\uDDF9\uD83C\uDDED" },
  { code: "ID", name: "Indonesia", flag: "\uD83C\uDDEE\uD83C\uDDE9" },
  { code: "TR", name: "Turkey", flag: "\uD83C\uDDF9\uD83C\uDDF7" },
  { code: "AR", name: "Argentina", flag: "\uD83C\uDDE6\uD83C\uDDF7" },
] as const;

export const SPORTS_CATEGORIES = [
  "All Sports",
  "Football",
  "Basketball",
  "American Football",
  "Hockey",
  "Fight",
  "Motor Sports",
  "Baseball",
] as const;

export const BROWSE_GENRE_TABS = [
  { id: "popular", name: "Most popular" },
  { id: "rating", name: "Most rating" },
  { id: "recent", name: "Most recent" },
  { id: "28", name: "Action" },
  { id: "12", name: "Adventure" },
  { id: "16", name: "Animation" },
  { id: "35", name: "Comedy" },
  { id: "80", name: "Crime" },
  { id: "99", name: "Documentary" },
  { id: "18", name: "Drama" },
  { id: "10751", name: "Family" },
  { id: "14", name: "Fantasy" },
  { id: "36", name: "History" },
  { id: "27", name: "Horror" },
  { id: "9648", name: "Mystery" },
  { id: "878", name: "Sci-Fi" },
  { id: "53", name: "Thriller" },
];

export const VIDEO_SERVERS = [
  {
    id: "vidlink",
    name: "VidLink (Default)",
    desc: "Fast · Multi-Audio · 4K UHD · Multi-language dubbed tracks & subs",
    is4k: true,
    isMultiAudio: true,
  },
  {
    id: "vidking",
    name: "VidKing",
    desc: "Multi-Audio · Videasy engine · 4K UHD alternative",
    is4k: true,
    isMultiAudio: true,
  },
  {
    id: "nexus",
    name: "Nexus (Skyflix)",
    desc: "Multi-Audio · Ad-free · Multi-subs · Fast HD streaming",
    is4k: true,
    isMultiAudio: true,
  },
  {
    id: "cinesrc",
    name: "CineSrc",
    desc: "Fast · 4K UHD · Multi-subtitles · Real-time streaming",
    is4k: true,
  },
  {
    id: "aura",
    name: "Aura (Skyflix)",
    desc: "Ad-free · High speed stream (vidgod engine)",
    is4k: true,
  },
  {
    id: "filix",
    name: "Filix (Skyflix)",
    desc: "Ad-free · Direct player stream (nhdapi engine)",
    is4k: false,
  },
  {
    id: "vidsrcto",
    name: "VidSrc",
    desc: "High speed · HD multi-source player",
    is4k: false,
  },
  {
    id: "vidsrcme",
    name: "VidSrc Me",
    desc: "Alternative multi-source HD stream",
    is4k: false,
  },
  {
    id: "vidsrcpm",
    name: "VidSrc Pro",
    desc: "Fast CDN mirror with subtitles",
    is4k: false,
  },
  {
    id: "2embed",
    name: "2Embed",
    desc: "Secondary backup stream",
    is4k: false,
  },
] as const;

export const WATCH_REGION = "US";

export interface NetflixGenreOption {
  id: string;
  name: string;
  movieGenreId?: number;
  tvGenreId?: number;
}

export const NETFLIX_GENRES: NetflixGenreOption[] = [
  { id: "all", name: "All Genres" },
  { id: "action", name: "Action & Adventure", movieGenreId: 28, tvGenreId: 10759 },
  { id: "animation", name: "Animation", movieGenreId: 16, tvGenreId: 16 },
  { id: "comedy", name: "Comedy", movieGenreId: 35, tvGenreId: 35 },
  { id: "crime", name: "Crime", movieGenreId: 80, tvGenreId: 80 },
  { id: "documentary", name: "Documentary", movieGenreId: 99, tvGenreId: 99 },
  { id: "drama", name: "Drama", movieGenreId: 18, tvGenreId: 18 },
  { id: "family", name: "Family & Kids", movieGenreId: 10751, tvGenreId: 10751 },
  { id: "fantasy", name: "Fantasy", movieGenreId: 14, tvGenreId: 10765 },
  { id: "history", name: "History", movieGenreId: 36, tvGenreId: 36 },
  { id: "horror", name: "Horror", movieGenreId: 27, tvGenreId: 27 },
  { id: "music", name: "Music", movieGenreId: 10402, tvGenreId: 10402 },
  { id: "mystery", name: "Mystery", movieGenreId: 9648, tvGenreId: 9648 },
  { id: "romance", name: "Romance", movieGenreId: 10749, tvGenreId: 10749 },
  { id: "scifi", name: "Sci-Fi & Fantasy", movieGenreId: 878, tvGenreId: 10765 },
  { id: "thriller", name: "Thriller", movieGenreId: 53, tvGenreId: 53 },
  { id: "war", name: "War & Politics", movieGenreId: 10752, tvGenreId: 10768 },
  { id: "western", name: "Western", movieGenreId: 37, tvGenreId: 37 },
];

export interface NetworkTmdbFilter {
  companyId?: string;
  networkId?: string;
  keywordId?: string;
  queryFallback?: string;
}

export function getNetworkTmdbFilter(networkName: string): NetworkTmdbFilter {
  const norm = networkName.toLowerCase().trim();
  if (norm.includes("warner")) return { companyId: "174|6194|1957" };
  if (norm.includes("hbo")) return { networkId: "49|3186", companyId: "3268" };
  if (norm === "dc" || norm.includes("dc comics")) return { companyId: "9993|429|128064" };
  if (norm.includes("cartoon network")) return { networkId: "56", companyId: "2251" };
  if (norm.includes("adult swim")) return { networkId: "80", companyId: "7899" };
  if (norm === "tbs") return { networkId: "68" };
  if (norm === "tnt") return { networkId: "42" };
  if (norm.includes("trutv")) return { networkId: "359" };
  if (norm.includes("turner classic") || norm === "tcm") return { networkId: "258", companyId: "3947" };
  if (norm === "discovery") return { networkId: "64", companyId: "1862" };
  if (norm === "hgtv") return { networkId: "210" };
  if (norm.includes("food network")) return { networkId: "141" };
  if (norm === "own") return { networkId: "481" };
  if (norm.includes("investigation discovery") || norm === "id") return { networkId: "244" };
  if (norm === "tlc") return { networkId: "84" };
  if (norm.includes("magnolia")) return { networkId: "4642" };
  if (norm.includes("travel channel")) return { networkId: "209" };
  if (norm.includes("animal planet")) return { networkId: "91" };
  if (norm.includes("science channel")) return { networkId: "226" };
  if (norm === "a24") return { companyId: "41077" };

  if (norm === "disney" || norm.includes("disney original")) return { companyId: "2|6125" };
  if (norm === "pixar") return { companyId: "3" };
  if (norm === "marvel") return { companyId: "420|7505" };
  if (norm.includes("star wars") || norm.includes("lucasfilm")) return { companyId: "1" };
  if (norm.includes("national geographic")) return { companyId: "7521", networkId: "43" };
  if (norm.includes("20th century") || norm.includes("20th television")) return { companyId: "127928|25" };
  if (norm.includes("searchlight")) return { companyId: "43" };
  if (norm === "fx") return { networkId: "88" };
  if (norm === "freeform") return { networkId: "126" };
  if (norm === "abc") return { networkId: "2", companyId: "275" };
  if (norm === "espn") return { networkId: "29" };
  if (norm === "star") return { companyId: "158300" };
  if (norm.includes("onyx")) return { companyId: "160759" };
  if (norm.includes("hulu on disney") || norm.includes("hulu original")) return { networkId: "453" };

  if (norm.includes("apple original") || norm.includes("apple studio")) return { networkId: "2552", companyId: "153920" };
  if (norm.includes("snoopy")) return { queryFallback: "Peanuts Snoopy Charlie Brown" };

  if (norm === "cbs") return { networkId: "16", companyId: "1081" };
  if (norm === "nickelodeon") return { networkId: "13", companyId: "23255|8244" };
  if (norm === "mtv") return { networkId: "33" };
  if (norm === "bet") return { networkId: "24" };
  if (norm.includes("comedy central")) return { networkId: "47" };
  if (norm === "showtime") return { networkId: "67", companyId: "591" };
  if (norm.includes("paramount picture")) return { companyId: "4" };
  if (norm.includes("smithsonian")) return { networkId: "409" };
  if (norm.includes("paramount network")) return { networkId: "2072" };
  if (norm.includes("tv land")) return { networkId: "397" };
  if (norm === "vh1") return { networkId: "158" };
  if (norm === "cmt") return { networkId: "65" };
  if (norm.includes("pop tv")) return { networkId: "338" };
  if (norm.includes("logo tv")) return { networkId: "160" };

  if (norm.includes("amazon mgm")) return { companyId: "20580|21" };
  if (norm.includes("mgm+") || norm === "epix") return { networkId: "670" };
  if (norm.includes("freevee")) return { networkId: "5056" };
  if (norm.includes("blutv")) return { networkId: "2467" };
  if (norm.includes("lionsgate")) return { companyId: "1632" };

  if (norm.includes("netflix original") || norm === "netflix") return { networkId: "213" };
  if (norm.includes("millarworld")) return { queryFallback: "Kingsman Kick-Ass Jupiter's Legacy" };
  if (norm.includes("roald dahl")) return { queryFallback: "Matilda Willy Wonka Charlie Chocolate" };

  return { queryFallback: networkName };
}


