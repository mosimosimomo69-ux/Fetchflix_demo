# Fetchflix 🎬

A modern, high-performance movie & TV series discovery and streaming web application built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and the **TMDB API**.

Designed with rich dark aesthetics, smooth cinematic transitions, and a secure server-side architecture.

---

## ✨ Features

- **Cinematic Hero Showcase**: Auto-rotating hero carousel with textless backdrop crossfades and official title logos.
- **Curated Discovery Rows**: Top 10 Today, Trending Movies & Series, Top Rated, Genre collections, and more.
- **Dedicated Streaming Hubs**:
  - Netflix
  - Amazon Prime Video
  - Max (HBO)
  - Disney+
  - Apple TV+
  - Hulu
  - Paramount+
- **Studio & Network Filtering**: Dedicated cards for Marvel, Pixar, Star Wars, HBO, DC, FX, 20th Century Studios, and National Geographic.
- **4K Ultra HD & Anime Hubs**: Specialized collections for pristine 4K releases and anime series.
- **Rich Media Details**: Full synopsis, runtime, age/maturity ratings, backdrop gallery, official logos, complete cast listing with age calculator, and related recommendations.
- **TV Season & Episode Browser**: Dynamic season selector with episode cards, preview thumbnails, and overviews.
- **Search Experience**: Instant modal search across movies, TV shows, and actors with enriched posters and backdrops.
- **Personal Library**: Local-storage powered Watchlist and History tracking.
- **Smooth & Responsive Design**: Seamless fluid page transitions, glassmorphic UI elements, skeleton loading states, and mobile bottom navigation dock.

---

## 🛡️ Security & Performance Hardening

- **Server-Side API Key Protection**: TMDB tokens stay exclusively on the server (`TMDB_API_KEY`), never leaked into client bundles.
- **Strict Content Security Policy (CSP)**: Fine-tuned directives for scripts, styles, fonts, frames, and images.
- **HTTP Security Headers**: Complete setup with `Strict-Transport-Security` (HSTS), `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`.
- **In-Memory Rate Limiting**: Abuse prevention across API routes (`/api/search`, `/api/discover`, `/api/images`, `/api/season`, `/api/category`, etc.).
- **Input Sanitization**: Strict allowlists for enum fields, positive integer parsers for IDs, and character striping on search queries.
- **Smart Edge & HTTP Caching**: `stale-while-revalidate` headers and React cache deduplication to ensure instantaneous page navigation.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.18+ or v20+
- **npm** or **pnpm** / **yarn**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/FetchJAV/Fetchflix.git
   cd Fetchflix
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Add your TMDB API read access token to `.env.local`:
   ```env
   TMDB_API_KEY=your_tmdb_read_access_token_here
   ```
   *(You can obtain a free API Read Access Token at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api))*

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Visit [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (Header, Footer, MobileDock, Providers)
│   ├── page.tsx                # Home page (Hero, Top 10, Trending, Providers)
│   ├── globals.css             # Tailwind CSS & custom design tokens
│   ├── loading.tsx             # Global skeleton loader
│   ├── not-found.tsx           # Custom 404 page
│   ├── error.tsx               # Error boundary
│   ├── [streaming-routes]/     # /netflix, /prime-video, /disney-plus, /max, etc.
│   ├── movie/
│   │   ├── page.tsx            # Movies discovery
│   │   └── [id]/               # Movie details & player
│   ├── tv/
│   │   ├── page.tsx            # TV shows discovery
│   │   └── [id]/               # TV show details, seasons & player
│   ├── search/                 # Dedicated search page
│   ├── history/ & watchlist/   # User personal library pages
│   └── api/                    # Secure API routes (images, discover, search, seasons)
├── components/
│   ├── layout/                 # Navigation, Modals, Header, Footer, Dock
│   ├── media/                  # MediaCard, HeroBanner, MediaDetailView, Rows
│   └── streaming/              # StreamingServicePage & Studio Cards
├── context/                    # Auth & Search state contexts
└── lib/
    ├── api/tmdb/               # Typed TMDB API client, endpoints, and helpers
    ├── security.ts             # Rate-limiting, sanitization, and allowlists
    ├── constants.ts            # Service definitions, studios, genres
    └── utils.ts                # Formatting, title resolution, classnames
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the Next.js development server with Turbopack |
| `npm run build` | Creates an optimized production build |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint to check for code quality |

---

## ⚖️ Disclaimer

This product uses the TMDB API but is not endorsed or certified by TMDB. All media metadata and images are provided by TMDB.
