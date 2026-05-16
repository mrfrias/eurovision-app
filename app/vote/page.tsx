"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  8:  "bg-pink-400 text-pink-900",
  7:  "bg-purple-400 text-purple-900",
  6:  "bg-blue-400 text-blue-900",
  5:  "bg-cyan-400 text-cyan-900",
  4:  "bg-green-400 text-green-900",
  3:  "bg-lime-400 text-lime-900",
  2:  "bg-teal-400 text-teal-900",
  1:  "bg-slate-400 text-slate-900",
};

type Step = "voting" | "top5" | "bottom5" | "winner" | "done";

interface Predictions {
  top5: number[];
  bottom5: number[];
  winner_id: number | null;
}

// ─── Prediction step ──────────────────────────────────────────────────────────
function PredictionStep({
  step, contestants, predictions,
  onToggleTop5, onToggleBottom5, onSetWinner,
  onNext, onBack, saving, error,
}: {
  step: "top5" | "bottom5" | "winner";
  contestants: Contestant[];
  predictions: Predictions;
  onToggleTop5: (id: number) => void;
  onToggleBottom5: (id: number) => void;
  onSetWinner: (id: number) => void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
  error: string;
}) {
  const stepIndex = step === "top5" ? 1 : step === "bottom5" ? 2 : 3;
  const title    = step === "top5" ? "Top 5 Countries" : step === "bottom5" ? "Bottom 5 Countries" : "The Winner";
  const subtitle = step === "top5"
    ? "Which 5 countries do you think the world will vote highest? (any order)"
    : step === "bottom5"
    ? "Which 5 countries do you think will finish at the bottom of the world vote?"
    : "Who do you think will win Eurovision 2026?";
  const isReady = step === "top5" ? predictions.top5.length === 5 : step === "bottom5" ? predictions.bottom5.length === 5 : predictions.winner_id !== null;

  return (
    <div className="min-h-screen pb-32">
      <div className="sticky top-0 z-20 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/40">Predictions</span>
            <span className="text-xs text-white/40">Step {stepIndex} of 3</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= stepIndex ? "bg-purple-400" : "bg-white/20"}`} />
            ))}
          </div>
          <div className="mt-2">
            <h1 className="text-lg font-bold text-white">{title}</h1>
            <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      {step !== "winner" && (
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-2">
          <span className={`text-sm font-bold px-3 py-1 rounded-full border ${isReady ? "bg-green-500/20 border-green-500/40 text-green-300" : "bg-white/5 border-white/20 text-white/60"}`}>
            {step === "top5" ? predictions.top5.length : predictions.bottom5.length} / 5 selected
          </span>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 space-y-2 pt-2">
        {contestants.map((c) => {
          let selected = false, disabled = false, badge = "";
          if (step === "top5") {
            selected = predictions.top5.includes(c.id);
            disabled = !selected && predictions.top5.length >= 5;
          } else if (step === "bottom5") {
            selected = predictions.bottom5.includes(c.id);
            const inTop5 = predictions.top5.includes(c.id);
            disabled = inTop5 || (!selected && predictions.bottom5.length >= 5);
            if (inTop5) badge = "Top 5";
          } else {
            selected = predictions.winner_id === c.id;
          }

          function handleClick() {
            if (disabled) return;
            if (step === "top5") onToggleTop5(c.id);
            else if (step === "bottom5") onToggleBottom5(c.id);
            else onSetWinner(c.id);
          }

          return (
            <button key={c.id} onClick={handleClick} disabled={disabled}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
                selected ? (step === "winner" ? "bg-yellow-500/20 border-yellow-400/60" : "bg-purple-500/20 border-purple-400/60")
                : disabled ? "bg-white/3 border-white/5 opacity-40 cursor-not-allowed"
                : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? (step === "winner" ? "border-yellow-400 bg-yellow-400" : "border-purple-400 bg-purple-400") : "border-white/30"}`}>
                {selected && <span className="text-[10px] font-bold text-white">{step === "winner" ? "★" : "✓"}</span>}
              </div>
              <span className="text-2xl flex-shrink-0">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm">{c.country}</div>
                <div className="text-xs text-white/40 truncate">{c.artist}</div>
              </div>
              {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-500/30">{badge}</span>}
              {selected && step === "winner" && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/30 text-yellow-300 border border-yellow-500/30">Winner</span>}
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onBack} className="px-5 py-3 rounded-xl border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition text-sm">← Back</button>
            <button onClick={onNext} disabled={!isReady || saving} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition">
              {saving ? "Saving…" : step === "winner" ? "Submit predictions 🎤" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Done screen ──────────────────────────────────────────────────────────────
function DoneScreen({ savedVotes, predictions, contestants, onLogout }: {
  savedVotes: Record<number, PointValue>;
  predictions: Predictions;
  contestants: Contestant[];
  onLogout: () => void;
}) {
  const winner = predictions.winner_id ? contestants.find((c) => c.id === predictions.winner_id) : null;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-10">
      <div className="text-6xl mb-3">✅</div>
      <h2 className="text-3xl font-bold text-white mb-1">All done!</h2>
      <p className="text-white/50 mb-8 text-sm">Votes and predictions saved. Good luck!</p>
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">My votes</h3>
          {POINT_VALUES.map((p) => {
            const entry = Object.entries(savedVotes).find(([, pts]) => pts === p);
            if (!entry) return null;
            const c = contestants.find((c) => c.id === Number(entry[0]));
            if (!c) return null;
            return (
              <div key={p} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${POINT_COLORS[p]}`}>{p}</span>
                <span className="text-white text-sm">{c.flag} {c.country}</span>
              </div>
            );
          })}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">My predictions</h3>
          <p className="text-white/40 text-xs mb-1">World Top 5</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {predictions.top5.map((id) => { const c = contestants.find((x) => x.id === id); return c ? <span key={id} className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">{c.flag} {c.country}</span> : null; })}
          </div>
          <p className="text-white/40 text-xs mb-1">World Bottom 5</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {predictions.bottom5.map((id) => { const c = contestants.find((x) => x.id === id); return c ? <span key={id} className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">{c.flag} {c.country}</span> : null; })}
          </div>
          <p className="text-white/40 text-xs mb-1">My winner pick</p>
          {winner && <span className="text-sm px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 inline-flex items-center gap-1.5">{winner.flag} {winner.country} ★</span>}
        </div>
      </div>
      <button onClick={onLogout} className="mt-8 text-white/30 hover:text-white/60 text-sm transition">Logout</button>
    </div>
  );
}

// ─── Live Show — comment card ─────────────────────────────────────────────────
function CommentCard({ contestant, comment, onChange, onSave, saving, saved }: {
  contestant: Contestant;
  comment: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const MAX = 255;
  const remaining = MAX - comment.length;
  const isDirty = true; // always show save (server handles no-ops)

  return (
    <div className="px-4 pb-3">
      <textarea
        value={comment}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        placeholder={`Your thoughts on ${contestant.country}…`}
        rows={2}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
      />
      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-xs ${remaining < 30 ? "text-orange-400" : "text-white/30"}`}>
          {remaining} chars left
        </span>
        <button
          onClick={onSave}
          disabled={saving || !isDirty}
          className={`text-xs px-3 py-1 rounded-lg transition font-medium ${
            saved ? "bg-green-500/20 text-green-300 border border-green-500/30"
            : "bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40"
          }`}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VotePage() {
  const router = useRouter();
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [phase, setPhase] = useState<string>("waiting");
  const [votes, setVotes] = useState<Record<number, PointValue>>({});
  const [savedVotes, setSavedVotes] = useState<Record<number, PointValue>>({});
  const [predictions, setPredictions] = useState<Predictions>({ top5: [], bottom5: [], winner_id: null });
  const [step, setStep] = useState<Step>("voting");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedContestant, setSelectedContestant] = useState<number | null>(null);
  const [userName, setUserName] = useState("");

  // Comments state
  const [myComments, setMyComments] = useState<Record<number, string>>({});
  const [savedComments, setSavedComments] = useState<Record<number, string>>({});
  const [savingComment, setSavingComment] = useState<number | null>(null);
  const [savedCommentId, setSavedCommentId] = useState<number | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    const [contRes, stateRes, votesRes, predsRes, commentsRes, meRes] = await Promise.all([
      fetch("/api/contestants"),
      fetch("/api/state"),
      fetch("/api/votes"),
      fetch("/api/predictions"),
      fetch("/api/comments"),
      fetch("/api/me"),
    ]);
    if (contRes.status === 401) { router.push("/"); return; }

    const [contData, stateData, votesData, predsData, commentsData, meData] = await Promise.all([
      contRes.json(), stateRes.json(), votesRes.json(), predsRes.json(), commentsRes.json(), meRes.json(),
    ]);

    if (meData?.name) setUserName(meData.name);

    setContestants(contData);
    setPhase(stateData.phase);

    if (votesData.votes?.length > 0) {
      const saved: Record<number, PointValue> = {};
      for (const v of votesData.votes) saved[v.contestant_id] = v.points as PointValue;
      setSavedVotes(saved);
      setVotes(saved);
    }

    if (predsData.predictions) {
      setPredictions(predsData.predictions);
      if (votesData.votes?.length > 0) setStep("done");
    } else if (votesData.votes?.length > 0) {
      setStep("top5");
    }

    if (commentsData.comments?.length > 0) {
      const map: Record<number, string> = {};
      for (const c of commentsData.comments) map[c.contestant_id] = c.content;
      setMyComments(map);
      setSavedComments(map);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      fetch("/api/state").then((r) => r.json()).then((d) => setPhase(d.phase));
    }, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (phase === "results") router.push("/results");
  }, [phase, router]);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  }

  // ── Voting handlers ──────────────────────────────────────────────────────
  function assignPoint(contestantId: number, point: PointValue) {
    setVotes((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(next)) { if (v === point) delete next[Number(k)]; }
      if (prev[contestantId] === point) delete next[contestantId];
      else next[contestantId] = point;
      return next;
    });
    setSelectedContestant(null);
  }

  async function handleSubmitVotes() {
    const assigned = Object.entries(votes).map(([id, pts]) => ({ contestant_id: Number(id), points: pts }));
    if (assigned.length !== 10) { setError(`Assign all 10 point values first. (${assigned.length}/10)`); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ votes: assigned }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to save"); setSaving(false); return; }
    setSavedVotes(votes);
    setSaving(false);
    setStep("top5");
  }

  // ── Comment handlers ─────────────────────────────────────────────────────
  async function saveComment(contestantId: number) {
    setSavingComment(contestantId);
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contestant_id: contestantId, content: myComments[contestantId] ?? "" }),
    });
    setSavedComments((prev) => ({ ...prev, [contestantId]: myComments[contestantId] ?? "" }));
    setSavingComment(null);
    setSavedCommentId(contestantId);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedCommentId(null), 2000);
  }

  // ── Prediction handlers ──────────────────────────────────────────────────
  function toggleTop5(id: number) {
    setPredictions((p) => ({ ...p, top5: p.top5.includes(id) ? p.top5.filter((x) => x !== id) : p.top5.length < 5 ? [...p.top5, id] : p.top5 }));
  }
  function toggleBottom5(id: number) {
    setPredictions((p) => ({ ...p, bottom5: p.bottom5.includes(id) ? p.bottom5.filter((x) => x !== id) : p.bottom5.length < 5 ? [...p.bottom5, id] : p.bottom5 }));
  }
  function setWinner(id: number) {
    setPredictions((p) => ({ ...p, winner_id: p.winner_id === id ? null : id }));
  }

  async function handleSubmitPredictions() {
    if (!predictions.winner_id) { setError("Pick a winner first"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/predictions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(predictions) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to save predictions"); setSaving(false); return; }
    setSaving(false);
    setStep("done");
  }

  // ── Loading / phase gates ────────────────────────────────────────────────
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-white/60 text-xl animate-pulse">Loading…</div></div>;
  }

  if (phase === "waiting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-12">
        <div className="text-6xl mb-6 animate-float" style={{ animationDuration: "3s" }}>🎉</div>

        <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Welcome!
        </h1>
        <p className="text-white/70 text-lg font-semibold mb-8">
          Eurovision 2026 Viewing Party
        </p>

        <div className="max-w-sm w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4 mb-8">
          <p className="text-white leading-relaxed">
            Welcome to the Eurovision 2026 Viewing Party hosted by{" "}
            <span className="text-yellow-300 font-semibold">Mauricio</span> and{" "}
            <span className="text-pink-300 font-semibold">Hendrik</span>! 🥂
          </p>
          <p className="text-white/70 leading-relaxed">
            Please enjoy the evening with drinks and themed food prepared by the
            loving hands of the Eurovision n.º&nbsp;1 fan in Gallus —{" "}
            <span className="text-pink-300 font-semibold">Hendrik</span>. 🍽️
          </p>
          <p className="text-white/70 leading-relaxed">
            Keep your votes a secret and don&apos;t tell anyone what you picked
            — there will be a{" "}
            <span className="text-purple-300 font-semibold">big final reveal!</span> 🤫✨
          </p>
        </div>

        <div className="flex gap-3 text-3xl mb-8">
          {["🎤","🇪🇺","⭐","🎶","🏆"].map((e, i) => (
            <span key={i} className="animate-float" style={{ animationDelay: `${i * 0.35}s`, animationDuration: "2.8s" }}>{e}</span>
          ))}
        </div>

        <p className="text-white/30 text-sm">The voting will open soon. Hang tight!</p>
        {userName && <p className="text-white/20 text-xs mt-4">Logged in as {userName}</p>}
        <button onClick={handleLogout} className="mt-2 text-white/20 hover:text-white/50 text-xs transition">Logout</button>
      </div>
    );
  }

  if (phase === "closed" && step === "voting" && Object.keys(savedVotes).length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-3xl font-bold text-white mb-2">Voting is closed</h2>
        <p className="text-white/50">You didn&apos;t submit your votes in time.</p>
        <button onClick={handleLogout} className="mt-8 text-white/40 hover:text-white/70 text-sm transition">Logout</button>
      </div>
    );
  }

  if (phase === "closed" && step === "done") {
    const drinks = ["🍷", "🥂", "🍸", "🍺", "🍹", "🫧"];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-12">
        <div className="text-7xl mb-6 animate-float" style={{ animationDuration: "2.8s" }}>🤫</div>

        <h1 className="text-4xl font-black text-white mb-2">Votes locked in!</h1>
        <p className="text-white/60 text-lg mb-8">The results will be revealed soon…</p>

        <div className="max-w-sm w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4 mb-8">
          <p className="text-white leading-relaxed">
            🤐 <span className="font-semibold">Keep your votes to yourself!</span> Don&apos;t share
            what you picked — not a single hint. The suspense is part of the fun!
          </p>
          <p className="text-white/70 leading-relaxed">
            No whispers, no hints, no peeking at anyone else&apos;s screen. The big
            reveal is coming and it&apos;s going to be{" "}
            <span className="text-yellow-300 font-semibold">spectacular</span>. ✨
          </p>
          <p className="text-white/70 leading-relaxed">
            In the meantime — your glass looks suspiciously empty. 👀
            Hendrik&apos;s food table is calling your name too. Go enjoy! 🍽️
          </p>
        </div>

        <div className="flex gap-3 text-3xl mb-8">
          {drinks.map((d, i) => (
            <span key={i} className="animate-float" style={{ animationDelay: `${i * 0.3}s`, animationDuration: `${2.5 + i * 0.15}s` }}>
              {d}
            </span>
          ))}
        </div>

        <p className="text-white/30 text-sm">Sit tight — the host is preparing the reveal 🎤</p>
        {userName && <p className="text-white/20 text-xs mt-4">Logged in as {userName}</p>}
        <button onClick={handleLogout} className="mt-2 text-white/20 hover:text-white/50 text-xs transition">Logout</button>
      </div>
    );
  }

  // ── Prediction steps ─────────────────────────────────────────────────────
  if (step === "top5") return <PredictionStep step="top5" contestants={contestants} predictions={predictions} onToggleTop5={toggleTop5} onToggleBottom5={toggleBottom5} onSetWinner={setWinner} onNext={() => setStep("bottom5")} onBack={() => setStep("voting")} saving={saving} error={error} />;
  if (step === "bottom5") return <PredictionStep step="bottom5" contestants={contestants} predictions={predictions} onToggleTop5={toggleTop5} onToggleBottom5={toggleBottom5} onSetWinner={setWinner} onNext={() => setStep("winner")} onBack={() => setStep("top5")} saving={saving} error={error} />;
  if (step === "winner") return <PredictionStep step="winner" contestants={contestants} predictions={predictions} onToggleTop5={toggleTop5} onToggleBottom5={toggleBottom5} onSetWinner={setWinner} onNext={handleSubmitPredictions} onBack={() => setStep("bottom5")} saving={saving} error={error} />;
  if (step === "done") return <DoneScreen savedVotes={savedVotes} predictions={predictions} contestants={contestants} onLogout={handleLogout} />;

  // ── Live Show ────────────────────────────────────────────────────────────
  if (phase === "live_show") {
    return (
      <div className="min-h-screen pb-10">
        <div className="sticky top-0 z-20 bg-black/40 backdrop-blur-md border-b border-white/10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">🎬 Live Show</h1>
              <p className="text-xs text-white/50">Leave a comment for each country as you watch!</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {userName && <span className="text-xs text-white/50">👤 {userName}</span>}
              <button onClick={handleLogout} className="text-white/30 hover:text-white/60 text-xs transition">Logout</button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-4 space-y-2">
          {contestants.map((c) => {
            const isOpen = selectedContestant === c.id;
            const hasComment = (savedComments[c.id] ?? "").trim().length > 0;

            return (
              <div key={c.id} className={`rounded-xl border transition ${isOpen ? "bg-white/10 border-purple-400/40" : hasComment ? "bg-white/8 border-white/20" : "bg-white/5 border-white/10"}`}>
                <button className="w-full text-left px-4 py-3 flex items-center gap-3" onClick={() => setSelectedContestant(isOpen ? null : c.id)}>
                  <span className="text-3xl">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white">{c.country}</div>
                    <div className="text-xs text-white/50 truncate">{c.artist} — {c.song}</div>
                  </div>
                  {hasComment && !isOpen && (
                    <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30 flex-shrink-0">💬</span>
                  )}
                  <span className="text-white/30 text-xs flex-shrink-0">{isOpen ? "▲" : "▼"}</span>
                </button>

                {/* Read-only preview when collapsed */}
                {!isOpen && hasComment && (
                  <div className="px-4 pb-3">
                    <p className="text-sm text-white/60 italic">&ldquo;{savedComments[c.id]}&rdquo;</p>
                  </div>
                )}

                {isOpen && (
                  <CommentCard
                    contestant={c}
                    comment={myComments[c.id] ?? ""}
                    onChange={(v) => setMyComments((prev) => ({ ...prev, [c.id]: v }))}
                    onSave={() => saveComment(c.id)}
                    saving={savingComment === c.id}
                    saved={savedCommentId === c.id}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Voting UI ────────────────────────────────────────────────────────────
  const assignedCount = Object.keys(votes).length;
  const usedPoints = new Set(Object.values(votes));
  const remainingPoints = POINT_VALUES.filter((p) => !usedPoints.has(p));
  const alreadyVoted = Object.keys(savedVotes).length > 0;
  const isVotingOpen = phase === "voting";

  return (
    <div className="min-h-screen pb-32">
      <div className="sticky top-0 z-20 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">🎤 Eurovision 2026</h1>
            <p className="text-xs text-white/50">Assign 10 point values to your favourite acts</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/60"><span className="text-white font-semibold">{assignedCount}</span>/10</span>
              <button onClick={handleLogout} className="text-white/30 hover:text-white/60 text-xs transition">Logout</button>
            </div>
            {userName && <span className="text-xs text-white/40">👤 {userName}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {POINT_VALUES.map((p) => {
            const used = usedPoints.has(p);
            return <span key={p} className={`text-xs font-bold px-2.5 py-1 rounded-full transition ${used ? `${POINT_COLORS[p]} opacity-40 line-through` : POINT_COLORS[p]}`}>{p} pts</span>;
          })}
        </div>
        {alreadyVoted && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
            <span>✅</span>
            <span className="text-green-300 text-sm">Votes saved! You can update them and re-submit.</span>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-2">
        {contestants.map((c) => {
          const assigned = votes[c.id];
          const isSelected = selectedContestant === c.id;
          const myComment = savedComments[c.id];

          return (
            <div key={c.id} className={`rounded-xl border transition ${assigned ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10"}`}>
              <button className="w-full text-left px-4 py-3 flex items-center gap-3" onClick={() => setSelectedContestant(isSelected ? null : c.id)}>
                <span className="text-3xl">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">{c.country}</div>
                  <div className="text-xs text-white/50 truncate">{c.artist} — {c.song}</div>
                </div>
                {assigned
                  ? <span className={`text-sm font-black px-3 py-1.5 rounded-full flex-shrink-0 ${POINT_COLORS[assigned]}`}>{assigned}</span>
                  : <span className="text-white/20 text-sm flex-shrink-0">tap to vote</span>}
              </button>

              {/* Read-only comment strip in voting phase */}
              {isVotingOpen && myComment && !isSelected && (
                <div className="px-4 pb-3 flex items-start gap-2">
                  <span className="text-purple-400 text-xs mt-0.5 flex-shrink-0">💬</span>
                  <p className="text-xs text-white/50 italic">&ldquo;{myComment}&rdquo;</p>
                </div>
              )}

              {isSelected && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {POINT_VALUES.map((p) => {
                    const takenBy = Object.entries(votes).find(([id, pts]) => pts === p && Number(id) !== c.id);
                    const takenCountry = takenBy ? contestants.find((x) => x.id === Number(takenBy[0])) : null;
                    return (
                      <button key={p} onClick={() => assignPoint(c.id, p)}
                        title={takenCountry ? `Currently assigned to ${takenCountry.country}` : ""}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-full transition border-2 ${
                          votes[c.id] === p ? `${POINT_COLORS[p]} border-white scale-110`
                          : takenCountry ? `${POINT_COLORS[p]} opacity-50 border-transparent`
                          : `${POINT_COLORS[p]} border-transparent hover:border-white hover:scale-105`
                        }`}
                      >
                        {p}{takenCountry && votes[c.id] !== p && <span className="ml-1 opacity-70">({takenCountry.flag})</span>}
                      </button>
                    );
                  })}

                  {/* Read-only comment in expanded state */}
                  {isVotingOpen && myComment && (
                    <div className="w-full mt-2 pt-2 border-t border-white/10 flex items-start gap-2">
                      <span className="text-purple-400 text-xs flex-shrink-0">💬</span>
                      <p className="text-xs text-white/50 italic">&ldquo;{myComment}&rdquo;</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto">
          {error && <p className="text-red-400 text-sm mb-2 text-center">{error}</p>}
          {assignedCount < 10 && <p className="text-white/50 text-xs mb-2 text-center">Remaining: {remainingPoints.join(", ")} pts</p>}
          <button
            onClick={handleSubmitVotes}
            disabled={assignedCount !== 10 || saving}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl transition text-lg"
          >
            {saving ? "Saving…" : alreadyVoted ? "Update votes & continue →" : `Submit votes (${assignedCount}/10) & continue →`}
          </button>
        </div>
      </div>
    </div>
  );
}
