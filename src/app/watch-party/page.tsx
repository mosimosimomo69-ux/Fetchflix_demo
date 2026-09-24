"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PartyPopper, Users, Send, Play, Copy, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function WatchPartyPage() {
  const { user, openLogin } = useAuth();
  const [roomId, setRoomId] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: string; text: string; time: string }>
  >([
    {
      sender: "System",
      text: "Welcome to Cineby Watch Party! Share your code with friends to stream together in sync.",
      time: "12:00",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = () => {
    if (!user) {
      openLogin("You need to log in to create a Watch Party");
      return;
    }
    const code = "CINE-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    setCurrentRoom(code);
    setInRoom(true);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    if (!user) {
      openLogin("You need to log in to join a Watch Party");
      return;
    }
    setCurrentRoom(roomId.toUpperCase());
    setInRoom(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        sender: user?.name || "You",
        text: inputMessage,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInputMessage("");
  };

  const copyRoomCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      {!inRoom ? (
        /* Create or Join Lobby */
        <div className="max-w-xl mx-auto text-center space-y-8">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-amber-950/40 text-amber-400 border border-amber-500/20 shadow-xl">
            <PartyPopper className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Watch Party
            </h1>
            <p className="text-sm text-white/60">
              Stream movies & series together in real-time sync with live audio-video chat.
            </p>
          </div>

          {/* Actions Container */}
          <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl space-y-6">
            <div>
              <button
                onClick={handleCreateRoom}
                className="w-full rounded-xl bg-[#e50914] py-3.5 text-sm font-bold text-white shadow-lg shadow-red-900/30 transition-all hover:bg-red-700 active:scale-98"
              >
                Create New Party
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-[#12121a] px-3 text-xs uppercase text-white/40 font-semibold">
                Or Join Room
              </span>
            </div>

            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter party code (e.g. CINE-8X92)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="h-11 flex-1 rounded-xl border border-white/10 bg-[#161622] px-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#e50914]"
              />
              <button
                type="submit"
                className="rounded-xl border border-white/10 bg-[#181824] px-5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Active Watch Party Room */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Stage */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-lg font-bold text-white">
                  Party: <span className="font-mono text-[#e50914]">{currentRoom}</span>
                </h2>
              </div>

              <button
                onClick={copyRoomCode}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#14141c] px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            {/* Video Player Embed */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
              <iframe
                src="https://player.videasy.to/movie/533535"
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Live Chat & Members Sidebar */}
          <div className="rounded-2xl border border-white/10 bg-[#12121a] flex flex-col h-[520px]">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-white/60" />
                <h3 className="text-sm font-bold text-white">Party Chat</h3>
              </div>
              <span className="text-xs text-white/40">2 Online</span>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-xs space-y-1">
                  <div className="flex items-center justify-between text-white/40 text-[10px]">
                    <span className="font-semibold text-white/70">{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="rounded-xl bg-[#181824] p-2.5 text-white/90 leading-relaxed border border-white/5">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="h-9 flex-1 rounded-xl border border-white/10 bg-[#161622] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-[#e50914]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#e50914] px-3 text-white hover:bg-red-700"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
