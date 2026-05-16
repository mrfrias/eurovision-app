import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

const POINT_VALUES = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.is_admin) {
    const result = await sql`
      SELECT c.id, c.country, c.artist, c.song, c.flag,
             COALESCE(SUM(v.points), 0) as total_points,
             COUNT(v.id) as vote_count
      FROM contestants c
      LEFT JOIN votes v ON v.contestant_id = c.id
      GROUP BY c.id, c.country, c.artist, c.song, c.flag
      ORDER BY total_points DESC
    `;
    return NextResponse.json({ results: result.rows });
  }

  const result = await sql`SELECT contestant_id, points FROM votes WHERE user_id = ${session.id}`;
  return NextResponse.json({ votes: result.rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.is_admin) return NextResponse.json({ error: "Admin cannot vote" }, { status: 403 });

  const phaseResult = await sql`SELECT value FROM app_state WHERE key='phase'`;
  const phase = (phaseResult.rows[0] as { value: string } | undefined)?.value;
  if (phase !== "voting") return NextResponse.json({ error: "Voting is not open" }, { status: 403 });

  const { votes } = await req.json() as { votes: { contestant_id: number; points: number }[] };
  if (!Array.isArray(votes) || votes.length !== 10)
    return NextResponse.json({ error: "Must assign exactly 10 votes" }, { status: 400 });

  const points = votes.map((v) => v.points);
  const ids = votes.map((v) => v.contestant_id);
  const validPoints = POINT_VALUES.every((p) => points.includes(p));
  const uniquePoints = new Set(points).size === 10;
  const uniqueIds = new Set(ids).size === 10;

  if (!validPoints || !uniquePoints || !uniqueIds)
    return NextResponse.json({ error: "Invalid point distribution" }, { status: 400 });

  await sql`DELETE FROM votes WHERE user_id = ${session.id}`;
  for (const v of votes) {
    await sql`INSERT INTO votes (user_id, contestant_id, points) VALUES (${session.id}, ${v.contestant_id}, ${v.points})`;
  }

  return NextResponse.json({ ok: true });
}
