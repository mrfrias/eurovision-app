import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const phaseResult = await sql`SELECT value FROM app_state WHERE key='phase'`;
  const phase = (phaseResult.rows[0] as { value: string } | undefined)?.value;

  if (phase !== "results" && !session.is_admin)
    return NextResponse.json({ error: "Results not available yet" }, { status: 403 });

  const results = await sql`
    SELECT c.id, c.country, c.artist, c.song, c.flag,
           COALESCE(SUM(v.points), 0) as total_points,
           COUNT(v.id) as vote_count
    FROM contestants c
    LEFT JOIN votes v ON v.contestant_id = c.id
    GROUP BY c.id, c.country, c.artist, c.song, c.flag
    ORDER BY total_points DESC
  `;

  const voterResult = await sql`SELECT COUNT(DISTINCT user_id) as c FROM votes`;
  const voterCount = parseInt((voterResult.rows[0] as { c: string }).c);

  return NextResponse.json({ results: results.rows, voterCount, phase });
}
