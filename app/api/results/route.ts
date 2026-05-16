import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const phase = (db.prepare("SELECT value FROM app_state WHERE key='phase'").get() as { value: string })?.value;

  if (phase !== "results" && !session.is_admin)
    return NextResponse.json({ error: "Results not available yet" }, { status: 403 });

  const results = db
    .prepare(
      `SELECT c.id, c.country, c.artist, c.song, c.flag,
              COALESCE(SUM(v.points), 0) as total_points,
              COUNT(v.id) as vote_count
       FROM contestants c
       LEFT JOIN votes v ON v.contestant_id = c.id
       GROUP BY c.id
       ORDER BY total_points DESC`
    )
    .all();

  const voterCount = (
    db
      .prepare("SELECT COUNT(DISTINCT user_id) as c FROM votes")
      .get() as { c: number }
  ).c;

  return NextResponse.json({ results, voterCount, phase });
}
