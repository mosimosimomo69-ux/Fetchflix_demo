"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Lock, X } from "lucide-react";

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalTab,
    authReason,
    closeAuthModal,
    setAuthModalTab,
    login,
    signup,
  } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authModalTab === "signup") {
        if (!username.trim() || !email.trim() || !password.trim()) {
          setError("Please fill in all fields.");
          setLoading(false);
          return;
        }
        await signup(username, email, password);
      } else {
        if (!email.trim() || !password.trim()) {
          setError("Please enter your email and password.");
          setLoading(false);
          return;
        }
        await login(email, password);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#0d0d12] p-6 shadow-2xl">
        {/* Header Tabs & Close button */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                setAuthModalTab("login");
                setError(null);
              }}
              className={`relative pb-2 text-sm font-semibold transition-colors ${
                authModalTab === "login"
                  ? "text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Login
              {authModalTab === "login" && (
                <span className="absolute inset-x-0 -bottom-[13px] h-[3px] rounded-full bg-[#e50914]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalTab("signup");
                setError(null);
              }}
              className={`relative pb-2 text-sm font-semibold transition-colors ${
                authModalTab === "signup"
                  ? "text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Sign up
              {authModalTab === "signup" && (
                <span className="absolute inset-x-0 -bottom-[13px] h-[3px] rounded-full bg-[#e50914]" />
              )}
            </button>
          </div>

          <button
            onClick={closeAuthModal}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Reason Message */}
        {authReason && (
          <div className="mt-4 text-center">
            <p className="text-xs font-medium text-[#e50914]">{authReason}</p>
          </div>
        )}

        {error && (
          <div className="mt-3 text-center">
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {authModalTab === "signup" && (
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-white/10 bg-[#16161f] pl-10 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#e50914]"
              />
            </div>
          )}

          <div className="relative flex items-center">
            {authModalTab === "signup" ? (
              <Mail className="absolute left-3.5 h-4 w-4 text-white/40" />
            ) : (
              <User className="absolute left-3.5 h-4 w-4 text-white/40" />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 w-full rounded-xl border border-white/10 bg-[#16161f] pl-10 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#e50914]"
            />
          </div>

          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-white/40" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 w-full rounded-xl border border-white/10 bg-[#16161f] pl-10 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#e50914]"
            />
          </div>

          {authModalTab === "login" && (
            <div className="pt-1 text-center">
              <button
                type="button"
                className="text-xs text-white/50 transition-colors hover:text-white/80"
                onClick={() => alert("Password reset link sent to your email.")}
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-[#e50914] py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition-all hover:bg-[#ff1a26] active:scale-[0.98] disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : authModalTab === "signup"
                ? "Sign up"
                : "Login"}
            </button>
            <button
              type="button"
              onClick={closeAuthModal}
              className="flex-1 rounded-xl border border-white/10 bg-[#16161f] py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
