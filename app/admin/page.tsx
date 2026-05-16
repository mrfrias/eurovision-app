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

type Phase = "waiting" | "voting" | "closed" | "results";
type Tab = "control" | "contestants" | "users" | "results";

const PHASE_LABELS: Record<Phase, string> = {
  waiting: "Waiting",
  voting: "Voting Open",
  closed: "Voting Closed",
  results: "Results Shown",
};

const PHASE_COLORS: Record<Phase, string> = {
  waiting: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  voting: "bg-green-500/20 text-green-300 border-green-500/40",
  closed: "bg-red-500/20 text-red-300 border-red-500/40",
  results: "bg-purple-500/20 text-purple-300 border-purple-500/40",
};

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
    artist: contestant?.artist ?? "",
    song: contestant?.song ?? "",
    flag: contestant?.flag ?? "",
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
            { key: "flag", label: "Flag emoji", placeholder: "🇵🇹" },
            { key: "country", label: "Country", placeholder: "Portugal" },
            { key: "artist", label: "Artist", placeholder: "Artist name" },
            { key: "song", label: "Song", placeholder: "Song title" },
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
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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

  const loadResults = useCallback(async () => {
    const res = await fetch("/api/results");
    if (res.ok) {
      const data = await res.json();
      setResults(data.results);
      setVoterCount(data.voterCount);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (tab === "results") loadResults();
  }, [tab, loadResults]);

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

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60 animate-pulse">Loading admin panel...</div>
      </div>
    );
  }

  const nonAdminUsers = users.filter((u) => !u.is_admin);
  const votedCount = nonAdminUsers.filter((u) => u.vote_count > 0).length;

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
            <button onClick={handleLogout} className="text-white/30 hover:text-white/60 text-xs transition">
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4 flex gap-0">
          {(["control", "contestants", "users", "results"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition capitalize ${
                tab === t
                  ? "border-purple-400 text-purple-300"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {t === "control" ? "⚡ Control" : t === "contestants" ? "🎤 Contestants" : t === "users" ? "👥 Users" : "🏆 Results"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* ── CONTROL TAB ── */}
        {tab === "control" && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1">Voting Phase</h2>
              <p className="text-white/50 text-sm mb-5">Control the voting lifecycle for all participants.</p>

              <div className="grid grid-cols-2 gap-3">
                {([
                  { phase: "waiting" as Phase, label: "⏳ Waiting", desc: "Lobby open, no voting yet", color: "from-yellow-600 to-amber-600" },
                  { phase: "voting" as Phase, label: "✅ Open Voting", desc: "Allow participants to vote", color: "from-green-600 to-emerald-600" },
                  { phase: "closed" as Phase, label: "🔒 Close Voting", desc: "Lock in all votes", color: "from-red-600 to-rose-600" },
                  { phase: "results" as Phase, label: "🏆 Show Results", desc: "Reveal results to all", color: "from-purple-600 to-pink-600" },
                ] as const).map(({ phase: p, label, desc, color }) => (
                  <button
                    key={p}
                    onClick={() => setPhaseAction(p)}
                    className={`text-left p-4 rounded-xl border-2 transition ${
                      phase === p
                        ? `bg-gradient-to-br ${color} border-white/40`
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="font-bold text-white text-sm">{label}</div>
                    <div className="text-white/50 text-xs mt-1">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-white">{nonAdminUsers.length}</div>
                <div className="text-white/50 text-xs mt-1">Registered voters</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-green-300">{votedCount}</div>
                <div className="text-white/50 text-xs mt-1">Voted</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-purple-300">{contestants.length}</div>
                <div className="text-white/50 text-xs mt-1">Contestants</div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTESTANTS TAB ── */}
        {tab === "contestants" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Contestants ({contestants.length})</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-xl transition"
              >
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
                    <button
                      onClick={() => setEditTarget(c)}
                      className="text-white/40 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteContestant(c.id)}
                      className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-400/10 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
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
                    <button
                      onClick={() => deleteUser(u.id, u.name)}
                      className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-400/10 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RESULTS TAB ── */}
        {tab === "results" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Live Results</h2>
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-sm">{voterCount} voters</span>
                <button onClick={loadResults} className="text-purple-400 hover:text-purple-300 text-xs transition">
                  Refresh
                </button>
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
      </div>
    </div>
  );
}
