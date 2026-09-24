"use client";

import React, { useState } from "react";
import { Code2, Play, Copy, Check, Terminal, ExternalLink } from "lucide-react";

const ENDPOINTS = [
  {
    name: "Trending Media",
    method: "GET",
    path: "/api/trending/all/day",
    desc: "Fetch today's trending movies and TV series with high quality metadata.",
    sample: {
      page: 1,
      results: [
        {
          id: 1084242,
          title: "Mutiny",
          media_type: "movie",
          vote_average: 7.2,
          release_date: "2026-08-15",
          overview: "After witnessing his billionaire boss' murder...",
        },
      ],
    },
  },
  {
    name: "Search Multi",
    method: "GET",
    path: "/api/search?q={query}&type={movie|tv|all}",
    desc: "Search movies, TV shows, and anime with instant auto-complete.",
    sample: {
      results: [
        {
          id: 119051,
          name: "Widow's Bay",
          media_type: "tv",
          vote_average: 8.1,
          first_air_date: "2026-03-10",
        },
      ],
    },
  },
  {
    name: "Vidking Player Embed",
    method: "EMBED",
    path: "https://www.vidking.net/embed/movie/{tmdbId}?color=e50914&autoPlay=true",
    desc: "Direct iframe embed player with subtitle support and 4K capability.",
    sample: {
      embed: "<iframe src='https://www.vidking.net/embed/movie/1084242' allowfullscreen />",
    },
  },
];

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(ENDPOINTS[0]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"json" | "curl" | "js">("json");

  const copySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCurlCode = () => {
    return `curl -X GET "https://api.cineby.at${selectedEndpoint.path}" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Accept: application/json"`;
  };

  const getJsCode = () => {
    return `const response = await fetch("https://api.cineby.at${selectedEndpoint.path}", {
  headers: {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Accept": "application/json"
  }
});
const data = await response.json();
console.log(data);`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-16 md:px-8 space-y-10">
      {/* Header */}
      <div className="max-w-2xl space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-sm bg-[#e50914]" />
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Fetchflix Developer API
          </h1>
        </div>

        <p className="text-sm md:text-base text-white/60">
          Integrate high-speed movie, TV series, and video streaming metadata
          directly into your applications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Endpoints Sidebar */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/40 px-1">
            Available Endpoints
          </h2>
          {ENDPOINTS.map((ep) => (
            <button
              key={ep.name}
              onClick={() => setSelectedEndpoint(ep)}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${
                selectedEndpoint.name === ep.name
                  ? "border-[#e50914] bg-red-950/20 text-white shadow-lg"
                  : "border-white/5 bg-[#12121a] text-white/70 hover:border-white/20 hover:bg-[#161622]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    ep.method === "GET"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                      : "bg-purple-950 text-purple-400 border border-purple-800/40"
                  }`}
                >
                  {ep.method}
                </span>
                <span className="text-sm font-bold text-white">{ep.name}</span>
              </div>
              <p className="font-mono text-xs text-white/50 truncate">
                {ep.path}
              </p>
            </button>
          ))}
        </div>

        {/* Endpoint Inspector & Code Playground */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 space-y-6 shadow-2xl">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {selectedEndpoint.name}
                </h3>
                <span className="text-xs text-emerald-400 font-mono">200 OK</span>
              </div>
              <p className="mt-1 text-xs text-white/60">
                {selectedEndpoint.desc}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#09090e] p-3 font-mono text-xs text-[#e50914] flex items-center justify-between">
              <span className="truncate">{selectedEndpoint.path}</span>
              <button
                onClick={() => copySnippet(selectedEndpoint.path)}
                className="text-white/40 hover:text-white ml-2"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Code Tabs */}
            <div className="space-y-2">
              <div className="flex items-center gap-4 border-b border-white/10 pb-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("json")}
                  className={`pb-1 transition-colors ${
                    activeTab === "json" ? "text-[#e50914] border-b-2 border-[#e50914]" : "text-white/40 hover:text-white"
                  }`}
                >
                  Response JSON
                </button>
                <button
                  onClick={() => setActiveTab("curl")}
                  className={`pb-1 transition-colors ${
                    activeTab === "curl" ? "text-[#e50914] border-b-2 border-[#e50914]" : "text-white/40 hover:text-white"
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveTab("js")}
                  className={`pb-1 transition-colors ${
                    activeTab === "js" ? "text-[#e50914] border-b-2 border-[#e50914]" : "text-white/40 hover:text-white"
                  }`}
                >
                  JavaScript Fetch
                </button>
              </div>

              <pre className="rounded-xl bg-[#09090e] p-4 text-xs font-mono text-white/80 overflow-x-auto border border-white/5">
                {activeTab === "json" &&
                  JSON.stringify(selectedEndpoint.sample, null, 2)}
                {activeTab === "curl" && getCurlCode()}
                {activeTab === "js" && getJsCode()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
