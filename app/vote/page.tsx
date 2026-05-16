"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Contestant {
  id: number;
  country: string;
  artist: string;
  song: string;
  flag: string;
}

type PointValue = 12 | 10 | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1;
const POINT_VALUES: PointValue[] = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

const POINT_COLORS: Record<number, string> = {
  12: "bg-yellow-400 text-yellow-900",
  10: "bg-orange-400 text-orange-900",
  8: "bg-pink-400 text-pink-900",
  7: "bg-purple-400 text-purple-900",
  6: "bg-blue-400 text-blue-900",
  5: "bg-cyan-400 text-cyan-900",
  4: "bg-green-400 text-green-900",
  3: "bg-lime-400 text-lime-900",
  2: "bg-teal-400 text-teal-900",
  1: "bg-slate-400 text-slate-900",
};

export default function VotePage() {
  const router = useRouter();
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [phase, setPhase] = useState<string>("waiting");
  const [votes, setVotes] = useState<Record<number, PointValue>>({});
  const [savedVotes, setSavedVotes] = useState<Record<number, PointValue>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedContestant, setSelectedContestant] = useState<number | null>(null);
  const [userName, setUserName] = useState("");

  const loadData = useCallback(async () => {
    const [contRes, stateRes, votesRes] = await Promise.all([
      fetch("/api/contestants"),
      fetch("/api/state"),
      fetch("/api/votes"),
    ]);

    if (contRes.status === 401 || stateRes.status === 401) {
      router.push("/");
      return;
    }

    const [contData, stateData, votesData] = await Promise.all([
      contRes.json(),
      stateRes.json(),
      votesRes.json(),
    ]);

    setContestants(contData);
    setPhase(stateData.phase);

    if (votesData.votes?.length > 0) {
      const saved: Record<number, PointValue> = {};
      for (const v of votesData.votes) {
        saved[v.contestant_id] = v.points as PointValue;
      }
      setSavedVotes(saved);
      setVotes(saved);
      setSubmitted(true);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
    // Get user name from a simple profile check
    fetch("/api/votes").then(async (r) => {
      if (r.ok) {
        // Name comes from cookie session — fetch from a dedicated endpoint would be cleaner,
        // but we use the auth check response header or rely on the page state.
      }
    });

    const interval = setInterval(() => {
      fetch("/api/state").then((r) => r.json()).then((d) => setPhase(d.phase));
    }, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  function assignPoint(contestantId: number, point: PointValue) {
    setVotes((prev) => {
      const next = { ...prev };
      // Remove this point from whoever had it
      for (const [k, v] of Object.entries(next)) {
        if (v === point) delete next[Number(k)];
      }
      // Toggle off if same
      if (prev[contestantId] === point) {
        delete next[contestantId];
      } else {
        next[contestantId] = point;
      }
      return next;
    });
    setSelectedContestant(null);
  }

  async function handleSubmit() {
    const assigned = Object.entries(votes).map(([id, pts]) => ({
      contestant_id: Number(id),
      points: pts,
    }));

    if (assigned.length !== 10) {
      setError(`You must assign all 10 point values. Currently assigned: ${assigned.length}/10`);
      return;
    }

    setSaving(true);
    setError("");
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votes: assigned }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to save votes");
    } else {
      setSavedVotes(votes);
      setSubmitted(true);
    }
    setSaving(false);
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  }

  const assignedCount = Object.keys(votes).length;
  const usedPoints = new Set(Object.values(votes));
  const remainingPoints = POINT_VALUES.filter((p) => !usedPoints.has(p));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-3xl font-bold text-white mb-2">Voting hasn&apos;t started yet</h2>
        <p className="text-white/50">The admin will open voting soon. Hang tight!</p>
        <button onClick={handleLogout} className="mt-8 text-white/40 hover:text-white/70 text-sm transition">
          Logout
        </button>
      </div>
    );
  }

  if (phase === "closed" && !submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-3xl font-bold text-white mb-2">Voting is closed</h2>
        <p className="text-white/50">You didn&apos;t submit your votes in time.</p>
        <button onClick={handleLogout} className="mt-8 text-white/40 hover:text-white/70 text-sm transition">
          Logout
        </button>
      </div>
    );
  }

  if (phase === "results") {
    router.push("/results");
    return null;
  }

  if (submitted && (phase === "closed" || phase === "waiting")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-3xl font-bold text-white mb-2">Votes submitted!</h2>
        <p className="text-white/50 mb-6">Waiting for results to be revealed...</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-sm">
          <h3 className="text-white/70 text-sm font-medium mb-4">Your votes</h3>
          {POINT_VALUES.map((p) => {
            const entry = Object.entries(savedVotes).find(([, pts]) => pts === p);
            if (!entry) return null;
            const c = contestants.find((c) => c.id === Number(entry[0]));
            if (!c) return null;
            return (
              <div key={p} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${POINT_COLORS[p]}`}>{p}</span>
                <span className="text-white">{c.flag} {c.country}</span>
              </div>
            );
          })}
        </div>
        <button onClick={handleLogout} className="mt-8 text-white/40 hover:text-white/70 text-sm transition">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">🎤 Eurovision 2026</h1>
            <p className="text-xs text-white/50">Assign 10 point values to your favourite acts</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/60">
              <span className="text-white font-semibold">{assignedCount}</span>/10
            </span>
            <button onClick={handleLogout} className="text-white/30 hover:text-white/60 text-xs transition">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Points legend */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {POINT_VALUES.map((p) => {
            const used = usedPoints.has(p);
            return (
              <span
                key={p}
                className={`text-xs font-bold px-2.5 py-1 rounded-full transition ${
                  used ? `${POINT_COLORS[p]} opacity-40 line-through` : `${POINT_COLORS[p]}`
                }`}
              >
                {p} pts
              </span>
            );
          })}
        </div>

        {submitted && phase === "voting" && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
            <span>✅</span>
            <span className="text-green-300 text-sm">Votes saved! You can still update them until voting closes.</span>
          </div>
        )}
      </div>

      {/* Contestants */}
      <div className="max-w-2xl mx-auto px-4 space-y-2">
        {contestants.map((c) => {
          const assigned = votes[c.id];
          const isSelected = selectedContestant === c.id;

          return (
            <div
              key={c.id}
              className={`rounded-xl border transition ${
                assigned
                  ? "bg-white/10 border-white/20"
                  : "bg-white/5 border-white/10 hover:bg-white/8"
              }`}
            >
              <button
                className="w-full text-left px-4 py-3 flex items-center gap-3"
                onClick={() => setSelectedContestant(isSelected ? null : c.id)}
              >
                <span className="text-3xl">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">{c.country}</div>
                  <div className="text-xs text-white/50 truncate">
                    {c.artist} — {c.song}
                  </div>
                </div>
                {assigned ? (
                  <span className={`text-sm font-black px-3 py-1.5 rounded-full ${POINT_COLORS[assigned]}`}>
                    {assigned}
                  </span>
                ) : (
                  <span className="text-white/20 text-sm">tap to vote</span>
                )}
              </button>

              {isSelected && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {POINT_VALUES.map((p) => {
                    const takenBy = Object.entries(votes).find(
                      ([id, pts]) => pts === p && Number(id) !== c.id
                    );
                    const takenCountry = takenBy
                      ? contestants.find((x) => x.id === Number(takenBy[0]))
                      : null;
                    return (
                      <button
                        key={p}
                        onClick={() => assignPoint(c.id, p)}
                        title={takenCountry ? `Currently assigned to ${takenCountry.country}` : ""}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-full transition border-2 ${
                          votes[c.id] === p
                            ? `${POINT_COLORS[p]} border-white scale-110`
                            : takenCountry
                            ? `${POINT_COLORS[p]} opacity-50 border-transparent`
                            : `${POINT_COLORS[p]} border-transparent hover:border-white hover:scale-105`
                        }`}
                      >
                        {p}
                        {takenCountry && votes[c.id] !== p && (
                          <span className="ml-1 opacity-70">({takenCountry.flag})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto">
          {error && <p className="text-red-400 text-sm mb-2 text-center">{error}</p>}
          {assignedCount < 10 && (
            <p className="text-white/50 text-xs mb-2 text-center">
              Remaining: {remainingPoints.join(", ")} pts
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={assignedCount !== 10 || saving}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition text-lg"
          >
            {saving ? "Saving..." : submitted ? "Update Votes 🔄" : `Submit Votes (${assignedCount}/10) 🎤`}
          </button>
        </div>
      </div>
    </div>
  );
}
