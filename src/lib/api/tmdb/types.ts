export type MediaType = "movie" | "tv";

export interface LogoItem {
  aspect_ratio: number;
  file_path: string;
  height: number;
  width: number;
  iso_639_1?: string | null;
  vote_average?: number;
}

export interface MediaImages {
  backdrops?: Array<{ file_path: string; aspect_ratio?: number }>;
  logos?: LogoItem[];
  posters?: Array<{ file_path: string; aspect_ratio?: number }>;
}

export interface MediaItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  logo_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count?: number;
  genre_ids?: number[];
  popularity?: number;
  original_language?: string;
  origin_country?: string[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job?: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface Paged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
}

export interface MediaDetails extends MediaItem {
  tagline?: string;
  status?: string;
  runtime?: number;
  genres: Genre[];
  homepage?: string;
  budget?: number;
  revenue?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  seasons?: SeasonSummary[];
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
  images?: MediaImages;
  similar?: Paged<MediaItem>;
  recommendations?: Paged<MediaItem>;
  production_companies?: ProductionCompany[];
  external_ids?: {
    imdb_id?: string;
    wikidata_id?: string;
    facebook_id?: string;
    instagram_id?: string;
    twitter_id?: string;
  };
}

export interface SeasonSummary {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date?: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date?: string;
  runtime?: number;
}

export interface SeasonDetails {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episodes: Episode[];
  poster_path: string | null;
}

export interface PersonCreditItem extends MediaItem {
  character?: string;
  job?: string;
  department?: string;
  episode_count?: number;
  credit_id?: string;
  order?: number;
}

export interface PersonCrewItem extends MediaItem {
  job?: string;
  department?: string;
  credit_id?: string;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  gender: number;
  popularity: number;
  also_known_as?: string[];
  homepage?: string | null;
  imdb_id?: string | null;
  external_ids?: {
    imdb_id?: string | null;
    facebook_id?: string | null;
    instagram_id?: string | null;
    twitter_id?: string | null;
    tiktok_id?: string | null;
    youtube_id?: string | null;
  };
  images?: {
    profiles?: Array<{
      file_path: string;
      aspect_ratio: number;
      width: number;
      height: number;
      vote_average?: number;
    }>;
  };
  combined_credits?: {
    cast: PersonCreditItem[];
    crew: PersonCrewItem[];
  };
}

