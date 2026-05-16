"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────
interface Contestant {
  id: number;
  country: string;
  artist: string;
  song: string;
  flag: string;
}

interface PlayerStat {
  name: string;
  top5Matches: number;
  bottom5Matches: number;
  guessedWinner: boolean;
  pTop5: number[];
  pBottom5: number[];
}

interface WorldResults {
  top5: number[];
  bottom5: number[];
  winner_id: number | null;
}

interface ScoreRow {
  id: number;
  country: string;
  artist: string;
  song: string;
  flag: string;
  total_points: number;
}

interface RevealData {
  phase: string;
  stage: number;
  worldResults: WorldResults;
  contestants: Contestant[];
  playerStats: PlayerStat[];
  scores: ScoreRow[];
}

// ── Helper ───────────────────────────────────────────────────────────────────
function byId(contestants: Contestant[], id: number) {
  return contestants.find((c) => c.id === id);
}

function medal(n: number) {
  return n === 0 ? "🥇" : n === 1 ? "🥈" : n === 2 ? "🥉" : null;
}

// ── Stage 0: Waiting ─────────────────────────────────────────────────────────
function WaitingScreen() {
  const drinks = ["🍹", "🥂", "🍸", "🍺", "🍾", "🎉"];
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      <div className="relative mb-8">
        <div className="text-8xl animate-float" style={{ animationDuration: "2.5s" }}>🍾</div>
        <div className="absolute -top-4 -right-8 text-4xl animate-sparkle">✨</div>
        <div className="absolute -bottom-2 -left-8 text-3xl animate-sparkle" style={{ animationDelay: "0.7s" }}>⭐</div>
      </div>

      <h1 className="text-4xl font-black text-white mb-3">
        Sit back &amp; relax!
      </h1>
      <p className="text-xl text-white/70 mb-2">The host is preparing the results…</p>
      <p className="text-white/50 text-lg mb-10">Now&apos;s the perfect time to pour yourself a drink 🥂</p>

      <div className="flex gap-4 justify-center mb-10">
        {drinks.map((d, i) => (
          <span
            key={i}
            className="text-3xl animate-float"
            style={{ animationDelay: `${i * 0.4}s`, animationDuration: `${2.5 + i * 0.2}s` }}
          >
            {d}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 text-white/30">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0s" }} />
        <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}

// ── Shared: Prediction group card ────────────────────────────────────────────
function PredictionGroupCard({
  worldList,
  contestants,
  playerStats,
  field,
  label,
  color,
}: {
  worldList: number[];
  contestants: Contestant[];
  playerStats: PlayerStat[];
  field: "top5Matches" | "bottom5Matches";
  label: string;
  color: string;
}) {
  const sorted = [...playerStats].sort((a, b) => b[field] - a[field]);
  const maxScore = 5;

  return (
    <div className="animate-fade-in-up space-y-6 max-w-2xl mx-auto px-4 pb-12">
      {/* World list */}
      <div className={`rounded-2xl border p-5 ${color}`}>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-3">{label}</p>
        <div className="space-y-2">
          {worldList.map((id, i) => {
            const c = byId(contestants, id);
            if (!c) return null;
            return (
              <div
                key={id}
                className="flex items-center gap-3 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <span className="text-white/40 text-sm w-5 text-right">{i + 1}</span>
                <span className="text-3xl">{c.flag}</span>
                <div>
                  <div className="font-bold text-white">{c.country}</div>
                  <div className="text-xs text-white/50">{c.artist}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Player scores */}
      <div>
        <p className="text-white/50 text-sm mb-3 text-center">Who guessed correctly?</p>
        <div className="space-y-2">
          {sorted.map((p, i) => {
            const score = p[field];
            const pct = (score / maxScore) * 100;
            return (
              <div
                key={p.name}
                className="bg-white/5 border border-white/10 rounded-xl p-3 animate-fade-in-up"
                style={{ animationDelay: `${0.6 + i * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-xl w-7">{medal(i) ?? <span className="text-white/30 text-sm font-bold">#{i + 1}</span>}</span>
                  <span className="font-semibold text-white flex-1">{p.name}</span>
                  <span className="text-sm font-black text-white">{score}<span className="text-white/40 font-normal">/5</span></span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden ml-10">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <p className="text-white/30 text-center text-sm">No predictions submitted</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stage 1: Bottom 5 ────────────────────────────────────────────────────────
function BottomFiveReveal({ data }: { data: RevealData }) {
  return (
    <div className="min-h-screen pt-8">
      <div className="text-center mb-8 animate-fade-in">
        <div className="text-5xl mb-3">🔻</div>
        <h1 className="text-3xl font-black text-white">World&apos;s Bottom 5</h1>
        <p className="text-white/50 mt-1">The countries the world voted lowest</p>
      </div>
      <PredictionGroupCard
        worldList={data.worldResults.bottom5}
        contestants={data.contestants}
        playerStats={data.playerStats}
        field="bottom5Matches"
        label="World Bottom 5"
        color="bg-red-900/30 border-red-500/30"
      />
    </div>
  );
}

// ── Stage 2: Top 5 ───────────────────────────────────────────────────────────
function TopFiveReveal({ data }: { data: RevealData }) {
  return (
    <div className="min-h-screen pt-8">
      <div className="text-center mb-8 animate-fade-in">
        <div className="text-5xl mb-3">🔝</div>
        <h1 className="text-3xl font-black text-white">World&apos;s Top 5</h1>
        <p className="text-white/50 mt-1">The countries the world voted highest</p>
      </div>
      <PredictionGroupCard
        worldList={data.worldResults.top5}
        contestants={data.contestants}
        playerStats={data.playerStats}
        field="top5Matches"
        label="World Top 5"
        color="bg-purple-900/30 border-purple-500/30"
      />
    </div>
  );
}

// ── Stage 3: Winner ──────────────────────────────────────────────────────────
function WinnerReveal({ data }: { data: RevealData }) {
  const winner = data.worldResults.winner_id ? byId(data.contestants, data.worldResults.winner_id) : null;
  const correctGuessers = data.playerStats.filter((p) => p.guessedWinner);
  const wrongGuessers = data.playerStats.filter((p) => !p.guessedWinner);

  return (
    <div className="min-h-screen flex flex-col items-center pt-10 pb-16 px-4 text-center">
      <div className="animate-fade-in mb-6">
        <p className="text-white/50 text-lg mb-2">And the winner of</p>
        <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Eurovision 2026
        </h1>
        <p className="text-white/50 text-lg mt-2">is…</p>
      </div>

      {winner ? (
        <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="text-9xl mb-4 animate-float">{winner.flag}</div>
          <div className="text-5xl font-black text-white mb-1">{winner.country}</div>
          <div className="text-white/60 text-lg mb-2">{winner.artist}</div>
          <div className="text-white/40 italic mb-8">&ldquo;{winner.song}&rdquo;</div>

          <div className="relative inline-block mb-10">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-2xl blur opacity-40" />
            <div className="relative bg-black/40 border border-yellow-400/40 rounded-2xl px-8 py-4">
              <div className="text-4xl">🏆</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-white/30 my-10">World winner not set yet</div>
      )}

      <div className="w-full max-w-sm space-y-4 animate-fade-in" style={{ animationDelay: "1s" }}>
        {correctGuessers.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 text-left">
            <p className="text-yellow-300 text-xs font-semibold uppercase tracking-wider mb-3">🎯 Predicted the winner</p>
            {correctGuessers.map((p) => (
              <div key={p.name} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                <span className="text-yellow-400">★</span>
                <span className="font-semibold text-white">{p.name}</span>
              </div>
            ))}
          </div>
        )}
        {wrongGuessers.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Better luck next year</p>
            {wrongGuessers.map((p) => (
              <div key={p.name} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                <span className="text-white/20">✗</span>
                <span className="text-white/60">{p.name}</span>
              </div>
            ))}
          </div>
        )}
        {data.playerStats.length === 0 && (
          <p className="text-white/30 text-sm">No predictions were submitted</p>
        )}
      </div>
    </div>
  );
}

// ── Stage 4: Score Reveal ────────────────────────────────────────────────────
function ScoreReveal({ scores }: { scores: ScoreRow[] }) {
  const [revealed, setRevealed] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Short intro then start revealing
    timerRef.current = setTimeout(() => setShowIntro(false), 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  useEffect(() => {
    if (showIntro || revealed >= scores.length) return;
    timerRef.current = setTimeout(() => setRevealed((r) => r + 1), 2500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [revealed, scores.length, showIntro]);

  const maxPoints = scores[scores.length - 1]?.total_points || 1;
  const visibleScores = scores.slice(0, revealed);
  const totalCountries = scores.length;

  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-7xl mb-5 animate-sparkle">🎤</div>
        <h1 className="text-4xl font-black text-white mb-3">Player Scores!</h1>
        <p className="text-white/60 text-lg">Countries revealed from lowest to highest…</p>
        <div className="flex gap-2 mt-8">
          {[0,1,2].map((i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-white">🎤 Player Votes</h1>
          <p className="text-white/40 text-sm mt-1">
            {revealed < totalCountries
              ? `Revealing… ${revealed} / ${totalCountries}`
              : "All countries revealed!"}
          </p>
        </div>

        {/* Suspense counter */}
        {revealed < totalCountries && (
          <div className="text-center mb-6 animate-pulse">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/20 rounded-xl px-5 py-3">
              <span className="text-white/60 text-sm">Next up: #{totalCountries - revealed} from bottom</span>
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" />
            </div>
          </div>
        )}

        <div className="space-y-2">
          {/* Show in reverse so highest appears at top as it's revealed */}
          {[...visibleScores].reverse().map((row, i) => {
            const rank = totalCountries - i; // rank from bottom (1 = lowest)
            const isLast = rank === totalCountries; // the top scorer
            const pct = maxPoints > 0 ? (row.total_points / maxPoints) * 100 : 0;
            const isNewest = i === 0; // just revealed

            return (
              <div
                key={row.id}
                className={`rounded-xl border p-4 ${
                  isLast
                    ? "bg-yellow-500/15 border-yellow-400/40"
                    : "bg-white/5 border-white/10"
                } ${isNewest ? "animate-fade-in-up" : ""}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-8 text-center text-sm font-bold ${isLast ? "text-yellow-400" : "text-white/30"}`}>
                    {isLast ? "🏅" : `#${rank}`}
                  </span>
                  <span className="text-2xl">{row.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm">{row.country}</div>
                    <div className="text-xs text-white/40 truncate">{row.artist}</div>
                  </div>
                  <div className={`text-right ${isNewest ? "animate-count-up" : ""}`}>
                    <div className={`text-xl font-black ${isLast ? "text-yellow-300" : "text-white"}`}>
                      {row.total_points}
                    </div>
                    <div className="text-xs text-white/30">pts</div>
                  </div>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden ml-11">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isLast
                        ? "bg-gradient-to-r from-yellow-400 to-pink-400"
                        : "bg-gradient-to-r from-purple-500 to-pink-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {revealed === totalCountries && (
          <div className="mt-8 text-center animate-fade-in">
            <p className="text-white/40 text-sm">That&apos;s all the player votes! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main results page ────────────────────────────────────────────────────────
export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<RevealData | null>(null);
  const [currentStage, setCurrentStage] = useState(-1);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/reveal");
    if (res.status === 401) { router.push("/"); return; }
    if (res.status === 403) { setError("Results not available yet."); return; }
    if (!res.ok) return;
    const d: RevealData = await res.json();
    setData(d);
    setCurrentStage((prev) => (prev !== d.stage ? d.stage : prev));
  }, [router]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-white/60 text-lg">{error}</p>
        <button onClick={() => router.push("/vote")} className="mt-6 text-purple-400 hover:text-purple-300 text-sm transition">
          ← Back
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40 animate-pulse text-lg">Loading…</div>
      </div>
    );
  }

  // Stage-keyed so React remounts child on stage change (resets animations)
  const stageKey = `stage-${currentStage}`;

  return (
    <div key={stageKey}>
      {currentStage === 0 && <WaitingScreen />}
      {currentStage === 1 && <BottomFiveReveal data={data} />}
      {currentStage === 2 && <TopFiveReveal data={data} />}
      {currentStage === 3 && <WinnerReveal data={data} />}
      {currentStage === 4 && <ScoreReveal scores={data.scores} />}
    </div>
  );
}
