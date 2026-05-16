"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: showAdmin ? "Admin" : name.trim(),
          adminPassword: showAdmin ? adminPassword : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      if (data.is_admin) {
        router.push("/admin");
      } else {
        router.push("/vote");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="text-7xl mb-4">🎤</div>
        <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Eurovision 2026
        </h1>
        <p className="text-white/60 text-lg mt-2">Live Voting with Friends</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm"
      >
        {!showAdmin ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maria"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Entering..." : "Join & Vote ✨"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Admin password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Entering..." : "Admin Login 🔐"}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setShowAdmin(!showAdmin);
            setError("");
          }}
          className="w-full mt-4 text-white/40 hover:text-white/70 text-sm transition"
        >
          {showAdmin ? "← Back to voter login" : "Admin login"}
        </button>
      </form>

      <p className="text-white/30 text-xs mt-8">Eurovision Song Contest 2026</p>
    </div>
  );
}
