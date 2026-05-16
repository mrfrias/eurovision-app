"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Contestant {
  id: number;
  country: string;
  artist: string;
  song: string;
  flag: string;
  order: number;
}

interface User {
  id: number;
  name: string;
  is_admin: number;
  created_at: string;
  vote_count: number;
}

interface Result {
  id: number;
  country: string;
  artist: string;
  song: string;
  flag: string;
  total_points: number;
  vote_count: number;
}

interface WorldResults {
  top5: number[];
  bottom5: number[];
  winner_id: number | null;
}

type Phase = "waiting" | "live_show" | "voting" | "closed" | "results";
type Tab = "control" | "contestants" | "users" | "results" | "reveal";

const PHASE_LABELS: Record<Phase, string> = {
  waiting:   "Waiting",
  live_show: "Live Show",
  voting:    "Voting Open",
  closed:    "Voting Closed",
  results:   "Results Shown",
};

const PHASE_COLORS: Record<Phase, string> = {
  waiting:   "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  live_show: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  voting:    "bg-green-500/20 text-green-300 border-green-500/40",
  closed:    "bg-red-500/20 text-red-300 border-red-500/40",
  results:   "bg-purple-500/20 text-purple-300 border-purple-500/40",
};

const REVEAL_STAGES = [
  { stage: 0, label: "⏳ Waiting",       desc: "Players see the drinks animation" },
  { stage: 1, label: "🔻 Bottom 5",      desc: "Reveal world bottom 5 + scores" },
  { stage: 2, label: "🔝 Top 5",         desc: "Reveal world top 5 + scores" },
  { stage: 3, label: "🏆 Winner",        desc: "Dramatic winner reveal" },
  { stage: 4, label: "🎤 Player scores", desc: "Animated country-by-country" },
];

// ── Edit contestant modal ─────────────────────────────────────────────────────
function EditContestantModal({
  contestant,
  onSave,
  onClose,
}: {
  contestant: Partial<Contestant> | null;
  onSave: (data: Omit<Contestant, "id" | "order">) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    country: contestant?.country ?? "",
    artist:  contestant?.artist  ?? "",
    song:    contestant?.song    ?? "",
    flag:    contestant?.flag    ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a2e] border border-white/20 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-white mb-4">
          {contestant?.id ? "Edit Contestant" : "Add Contestant"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: "flag",    label: "Flag emoji", placeholder: "🇵🇹" },
            { key: "country", label: "Country",    placeholder: "Portugal" },
            { key: "artist",  label: "Artist",     placeholder: "Artist name" },
            { key: "song",    label: "Song",        placeholder: "Song title" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-white/50 mb-1">{label}</label>
              <input
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-white/20 text-white/60 py-2 rounded-lg hover:bg-white/5 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg transition disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Country picker (used in reveal tab) ──────────────────────────────────────
function CountryPicker({
  label,
  contestants,
  selected,
  disabled,
  max,
  single,
  onChange,
}: {
  label: string;
  contestants: Contestant[];
  selected: number[];
  disabled?: number[];
  max: number;
  single?: boolean;
  onChange: (ids: number[]) => void;
}) {
  function toggle(id: number) {
    if (single) {
      onChange(selected[0] === id ? [] : [id]);
      return;
    }
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else if (selected.length < max) {
      onChange([...selected, id]);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</p>
        {!single && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${selected.length === max ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50"}`}>
            {selected.length}/{max}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto pr-1">
        {contestants.map((c) => {
          const isSelected  = selected.includes(c.id);
          const isDisabled  = !isSelected && ((disabled ?? []).includes(c.id) || (!single && selected.length >= max));
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              disabled={isDisabled}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition ${
                isSelected
                  ? "bg-purple-500/20 border-purple-400/50"
                  : isDisabled
                  ? "opacity-30 cursor-not-allowed border-transparent"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                isSelected ? "bg-purple-400 border-purple-400" : "border-white/30"
              }`}>
                {isSelected && <span className="text-[8px] text-white font-bold">✓</span>}
              </div>
              <span className="text-xl flex-shrink-0">{c.flag}</span>
              <span className="text-sm text-white font-medium">{c.country}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("control");
  const [phase, setPhase] = useState<Phase>("waiting");
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [voterCount, setVoterCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Partial<Contestant> | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Reveal state
  const [revealStage, setRevealStage] = useState(0);
  const [worldResults, setWorldResults] = useState<WorldResults>({ top5: [], bottom5: [], winner_id: null });
  const [worldSaving, setWorldSaving] = useState(false);
  const [worldSaved, setWorldSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadAll = useCallback(async () => {
    const [stateRes, contRes, usersRes] = await Promise.all([
      fetch("/api/state"),
      fetch("/api/contestants"),
      fetch("/api/users"),
    ]);
    if (usersRes.status === 403) { router.push("/"); return; }
    const [stateData, contData, usersData] = await Promise.all([
      stateRes.json(),
      contRes.json(),
      usersRes.json(),
    ]);
    setPhase(stateData.phase);
    setContestants(contData);
    setUsers(usersData);
    setLoading(false);
  }, [router]);

  const loadReveal = useCallback(async () => {
    const [stageRes, wrRes] = await Promise.all([
      fetch("/api/reveal-stage"),
      fetch("/api/world-results"),
    ]);
    if (stageRes.ok) {
      const d = await stageRes.json();
      setRevealStage(d.stage);
    }
    if (wrRes.ok) {
      const d = await wrRes.json();
      setWorldResults(d);
    }
  }, []);

  const loadResults = useCallback(async () => {
    const res = await fetch("/api/results");
    if (res.ok) {
      const data = await res.json();
      setResults(data.results);
      setVoterCount(data.voterCount);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { if (tab === "results") loadResults(); }, [tab, loadResults]);
  useEffect(() => { if (tab === "reveal") loadReveal(); }, [tab, loadReveal]);

  async function setPhaseAction(newPhase: Phase) {
    const res = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: newPhase }),
    });
    if (res.ok) setPhase(newPhase);
  }

  async function saveContestant(data: Omit<Contestant, "id" | "order">) {
    if (editTarget?.id) {
      await fetch(`/api/contestants/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/contestants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setEditTarget(null);
    setShowAddModal(false);
    const res = await fetch("/api/contestants");
    setContestants(await res.json());
  }

  async function deleteContestant(id: number) {
    if (!confirm("Delete this contestant?")) return;
    await fetch(`/api/contestants/${id}`, { method: "DELETE" });
    setContestants((c) => c.filter((x) => x.id !== id));
  }

  async function deleteUser(id: number, name: string) {
    if (!confirm(`Remove user "${name}"?`)) return;
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setUsers((u) => u.filter((x) => x.id !== id));
  }

  async function saveWorldResults() {
    setWorldSaving(true);
    setWorldSaved(false);
    await fetch("/api/world-results", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(worldResults),
    });
    setWorldSaving(false);
    setWorldSaved(true);
    setTimeout(() => setWorldSaved(false), 2500);
  }

  async function setRevealStageAction(stage: number) {
    const res = await fetch("/api/reveal-stage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (res.ok) setRevealStage(stage);
  }

  async function handleReset() {
    setResetting(true);
    await fetch("/api/admin/reset", { method: "POST" });
    // Reload fresh state
    await loadAll();
    setUsers([]);
    setResults([]);
    setWorldResults({ top5: [], bottom5: [], winner_id: null });
    setRevealStage(0);
    setResetConfirm(false);
    setResetting(false);
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60 animate-pulse">Loading admin panel…</div>
      </div>
    );
  }

  const nonAdminUsers = users.filter((u) => !u.is_admin);
  const votedCount = nonAdminUsers.filter((u) => u.vote_count > 0).length;

  const tabs: { id: Tab; label: string }[] = [
    { id: "control",     label: "⚡ Control" },
    { id: "contestants", label: "🎤 Contestants" },
    { id: "users",       label: "👥 Users" },
    { id: "results",     label: "🏆 Scores" },
    { id: "reveal",      label: "🌍 Reveal" },
  ];

  return (
    <div className="min-h-screen">
      {(editTarget || showAddModal) && (
        <EditContestantModal
          contestant={editTarget ?? {}}
          onSave={saveContestant}
          onClose={() => { setEditTarget(null); setShowAddModal(false); }}
        />
      )}

      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">🎛️ Admin Panel</h1>
            <p className="text-xs text-white/40">Eurovision 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${PHASE_COLORS[phase]}`}>
              {PHASE_LABELS[phase]}
            </span>
            <div className="flex flex-col items-end">
              <span className="text-xs text-white/50">👤 Admin</span>
              <button onClick={handleLogout} className="text-white/30 hover:text-white/60 text-xs transition">
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 flex gap-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                tab === t.id
                  ? "border-purple-400 text-purple-300"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* ── CONTROL ── */}
        {tab === "control" && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1">Voting Phase</h2>
              <p className="text-white/50 text-sm mb-5">Control the voting lifecycle for all participants.</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { phase: "waiting"   as Phase, label: "⏳ Waiting",      desc: "Lobby open, no voting yet",       color: "from-yellow-600 to-amber-600",  span: false },
                  { phase: "live_show" as Phase, label: "🎬 Live Show",    desc: "Players comment on each country", color: "from-blue-600 to-cyan-600",     span: false },
                  { phase: "voting"    as Phase, label: "✅ Open Voting",   desc: "Allow participants to vote",      color: "from-green-600 to-emerald-600", span: false },
                  { phase: "closed"    as Phase, label: "🔒 Close Voting",  desc: "Lock in all votes",               color: "from-red-600 to-rose-600",      span: false },
                  { phase: "results"   as Phase, label: "🏆 Show Results",  desc: "Redirect all to results page",    color: "from-purple-600 to-pink-600",   span: true },
                ] as const).map(({ phase: p, label, desc, color, span }) => (
                  <button
                    key={p}
                    onClick={() => setPhaseAction(p)}
                    className={`text-left p-4 rounded-xl border-2 transition ${span ? "col-span-2" : ""} ${
                      phase === p ? `bg-gradient-to-br ${color} border-white/40` : "bg-white/5 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="font-bold text-white text-sm">{label}</div>
                    <div className="text-white/50 text-xs mt-1">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: nonAdminUsers.length, label: "Registered voters",  color: "text-white" },
                { value: votedCount,            label: "Voted",              color: "text-green-300" },
                { value: contestants.length,    label: "Contestants",        color: "text-purple-300" },
              ].map(({ value, label, color }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className={`text-3xl font-black ${color}`}>{value}</div>
                  <div className="text-white/50 text-xs mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Reset */}
            <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-red-300 mb-1">Danger Zone</h3>
              <p className="text-white/40 text-xs mb-4">
                Deletes all votes, predictions, comments, and registered users. Resets phase and reveal stage. Contestants are kept.
              </p>
              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="w-full border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-semibold py-2.5 rounded-xl transition"
                >
                  🗑️ Reset All Data
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-300 text-xs text-center font-medium">This cannot be undone. Are you sure?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="flex-1 border border-white/20 text-white/50 hover:bg-white/5 text-sm py-2.5 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={resetting}
                      className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition"
                    >
                      {resetting ? "Resetting…" : "Yes, reset everything"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CONTESTANTS ── */}
        {tab === "contestants" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Contestants ({contestants.length})</h2>
              <button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-xl transition">
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {contestants.map((c) => (
                <div key={c.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <span className="text-2xl">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{c.country}</div>
                    <div className="text-xs text-white/40 truncate">{c.artist} — {c.song}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditTarget(c)} className="text-white/40 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition">Edit</button>
                    <button onClick={() => deleteContestant(c.id)} className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-400/10 transition">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Registered Users ({nonAdminUsers.length})</h2>
              <span className="text-white/40 text-sm">{votedCount} voted</span>
            </div>
            {nonAdminUsers.length === 0 ? (
              <div className="text-center py-10 text-white/30">No users registered yet</div>
            ) : (
              <div className="space-y-2">
                {nonAdminUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">{u.name}</div>
                      <div className="text-xs text-white/40">Joined {new Date(u.created_at).toLocaleString()}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${u.vote_count > 0 ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/40"}`}>
                      {u.vote_count > 0 ? "✓ Voted" : "Not voted"}
                    </span>
                    <button onClick={() => deleteUser(u.id, u.name)} className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-400/10 transition">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LIVE SCORES ── */}
        {tab === "results" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Live Player Scores</h2>
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-sm">{voterCount} voters</span>
                <button onClick={loadResults} className="text-purple-400 hover:text-purple-300 text-xs transition">Refresh</button>
              </div>
            </div>
            {results.length === 0 ? (
              <div className="text-center py-10 text-white/30">No votes yet</div>
            ) : (
              <div className="space-y-2">
                {results.map((r, idx) => (
                  <div key={r.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <span className="text-white/40 text-sm w-6 text-right">#{idx + 1}</span>
                    <span className="text-2xl">{r.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">{r.country}</div>
                      <div className="text-xs text-white/40 truncate">{r.artist}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-white">{r.total_points}</div>
                      <div className="text-xs text-white/40">pts</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REVEAL ── */}
        {tab === "reveal" && (
          <div className="space-y-8">

            {/* World Results Input */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">World Voting Results</h2>
                <p className="text-white/40 text-sm">Enter the actual Eurovision world voting results to compare with player predictions.</p>
              </div>

              <CountryPicker
                label="World Bottom 5 (countries voted lowest)"
                contestants={contestants}
                selected={worldResults.bottom5}
                disabled={worldResults.top5}
                max={5}
                onChange={(ids) => setWorldResults((w) => ({ ...w, bottom5: ids }))}
              />

              <CountryPicker
                label="World Top 5 (countries voted highest)"
                contestants={contestants}
                selected={worldResults.top5}
                disabled={worldResults.bottom5}
                max={5}
                onChange={(ids) => setWorldResults((w) => ({ ...w, top5: ids }))}
              />

              <CountryPicker
                label="Eurovision 2026 Winner"
                contestants={contestants}
                selected={worldResults.winner_id ? [worldResults.winner_id] : []}
                max={1}
                single
                onChange={(ids) => setWorldResults((w) => ({ ...w, winner_id: ids[0] ?? null }))}
              />

              <button
                onClick={saveWorldResults}
                disabled={worldSaving}
                className={`w-full py-3 rounded-xl font-bold transition ${
                  worldSaved
                    ? "bg-green-600 text-white"
                    : "bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
                }`}
              >
                {worldSaving ? "Saving…" : worldSaved ? "✓ Saved!" : "Save World Results"}
              </button>
            </div>

            {/* Reveal Stage Controls */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1">Reveal Controls</h2>
              <p className="text-white/40 text-sm mb-5">
                Advance through the reveal stages. Make sure phase is set to <span className="text-purple-300 font-medium">"Show Results"</span> first so players land on the results page.
              </p>

              <div className="space-y-2">
                {REVEAL_STAGES.map(({ stage, label, desc }) => (
                  <button
                    key={stage}
                    onClick={() => setRevealStageAction(stage)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition ${
                      revealStage === stage
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 border-white/30"
                        : revealStage > stage
                        ? "bg-white/5 border-white/5 opacity-50"
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{label}</div>
                        <div className="text-white/40 text-xs mt-0.5">{desc}</div>
                      </div>
                      {revealStage === stage && (
                        <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">LIVE</span>
                      )}
                      {revealStage > stage && (
                        <span className="text-xs text-white/30">Done</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
