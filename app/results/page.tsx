"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Result {
  id: number;
  country: string;
  artist: string;
  song: string;
  flag: string;
  total_points: number;
  vote_count: number;
}

const MEDAL: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [voterCount, setVoterCount] = useState(0);
  const [phase, setPhase] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/results")
      .then(async (r) => {
        if (r.status === 401) { router.push("/"); return; }
        if (r.status === 403) { setError("Results not available yet"); setLoading(false); return; }
        const data = await r.json();
        setResults(data.results);
        setVoterCount(data.voterCount);
        setPhase(data.phase);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60 text-xl animate-pulse">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">Results not ready yet</h2>
        <p className="text-white/50">The admin hasn&apos;t revealed the results.</p>
        <button onClick={() => router.push("/vote")} className="mt-6 text-purple-400 hover:text-purple-300 transition">
          ← Back to voting
        </button>
      </div>
    );
  }

  const maxPoints = results[0]?.total_points || 1;

  return (
    <div className="min-h-screen pb-10">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Final Results
          </h1>
          <p className="text-white/50 mt-2">{voterCount} voter{voterCount !== 1 ? "s" : ""} participated</p>
        </div>

        <div className="space-y-3">
          {results.map((r, idx) => (
            <div
              key={r.id}
              className={`rounded-xl p-4 border transition ${
                idx === 0
                  ? "bg-yellow-500/20 border-yellow-500/40"
                  : idx === 1
                  ? "bg-slate-400/10 border-slate-400/30"
                  : idx === 2
                  ? "bg-orange-700/10 border-orange-700/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl w-8 text-center">
                  {MEDAL[idx] ?? <span className="text-white/40 font-bold text-sm">#{idx + 1}</span>}
                </span>
                <span className="text-3xl">{r.flag}</span>
                <div className="flex-1">
                  <div className="font-bold text-white">{r.country}</div>
                  <div className="text-xs text-white/50">{r.artist} — {r.song}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-white">{r.total_points}</div>
                  <div className="text-xs text-white/40">points</div>
                </div>
              </div>
              {/* Points bar */}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden ml-11">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${(r.total_points / maxPoints) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-white/40 hover:text-white/70 text-sm transition"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
