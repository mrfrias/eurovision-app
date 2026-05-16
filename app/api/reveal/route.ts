import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await initDb();

  const [stateRes, contestantsRes, worldRes, predsRes, scoresRes] = await Promise.all([
    sql`SELECT key, value FROM app_state WHERE key IN ('phase', 'reveal_stage')`,
    sql`SELECT * FROM contestants ORDER BY "order"`,
    sql`SELECT top5, bottom5, winner_id FROM world_results WHERE id = 1`,
    sql`
      SELECT p.user_id, u.name, p.top5, p.bottom5, p.winner_id as pred_winner_id
      FROM predictions p
      JOIN users u ON u.id = p.user_id
      WHERE u.is_admin = 0
      ORDER BY u.name
    `,
    sql`
      SELECT c.id, c.country, c.artist, c.song, c.flag,
             COALESCE(SUM(v.points), 0) as total_points
      FROM contestants c
      LEFT JOIN votes v ON v.contestant_id = c.id
      GROUP BY c.id, c.country, c.artist, c.song, c.flag
      ORDER BY total_points ASC
    `,
  ]);

  const phase = stateRes.rows.find((r) => (r as { key: string }).key === "phase")
    ?.value as string ?? "waiting";
  const stage = parseInt(
    (stateRes.rows.find((r) => (r as { key: string }).key === "reveal_stage")?.value as string) ?? "0"
  );

  if (phase !== "results" && !session.is_admin)
    return NextResponse.json({ error: "Not available" }, { status: 403 });

  const worldRow = worldRes.rows[0] as
    | { top5: string; bottom5: string; winner_id: number | null }
    | undefined;

  const worldResults = {
    top5: worldRow ? (JSON.parse(worldRow.top5) as number[]) : [],
    bottom5: worldRow ? (JSON.parse(worldRow.bottom5) as number[]) : [],
    winner_id: worldRow?.winner_id ?? null,
  };

  const playerStats = predsRes.rows.map((row) => {
    const r = row as {
      user_id: number;
      name: string;
      top5: string;
      bottom5: string;
      pred_winner_id: number | null;
    };
    const pTop5 = JSON.parse(r.top5) as number[];
    const pBottom5 = JSON.parse(r.bottom5) as number[];
    return {
      name: r.name,
      top5Matches: pTop5.filter((id) => worldResults.top5.includes(id)).length,
      bottom5Matches: pBottom5.filter((id) => worldResults.bottom5.includes(id)).length,
      guessedWinner: r.pred_winner_id !== null && r.pred_winner_id === worldResults.winner_id,
      pTop5,
      pBottom5,
    };
  });

  return NextResponse.json({
    phase,
    stage,
    worldResults,
    contestants: contestantsRes.rows,
    playerStats,
    scores: scoresRes.rows,
  });
}
