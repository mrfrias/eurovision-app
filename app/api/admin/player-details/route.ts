import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await initDb();

  const [votesRes, commentsRes, usersRes] = await Promise.all([
    sql`
      SELECT v.user_id, v.contestant_id, v.points,
             u.name AS user_name,
             c.country, c.flag, c.artist, c.song
      FROM votes v
      JOIN users u ON u.id = v.user_id
      JOIN contestants c ON c.id = v.contestant_id
      ORDER BY u.name, v.points DESC
    `,
    sql`
      SELECT co.user_id, co.contestant_id, co.content,
             u.name AS user_name,
             c.country, c.flag
      FROM comments co
      JOIN users u ON u.id = co.user_id
      JOIN contestants c ON c.id = co.contestant_id
      WHERE u.is_admin = 0 AND TRIM(co.content) <> ''
      ORDER BY u.name, c.country
    `,
    sql`
      SELECT id, name FROM users WHERE is_admin = 0 ORDER BY name
    `,
  ]);

  type VoteRow     = { user_id: number; user_name: string; contestant_id: number; points: number; country: string; flag: string; artist: string; song: string };
  type CommentRow  = { user_id: number; user_name: string; contestant_id: number; content: string; country: string; flag: string };
  type UserRow     = { id: number; name: string };

  const userMap = new Map<number, { id: number; name: string; votes: VoteRow[]; comments: CommentRow[] }>();

  for (const u of usersRes.rows as UserRow[]) {
    userMap.set(u.id, { id: u.id, name: u.name, votes: [], comments: [] });
  }
  for (const v of votesRes.rows as VoteRow[]) {
    userMap.get(v.user_id)?.votes.push(v);
  }
  for (const c of commentsRes.rows as CommentRow[]) {
    userMap.get(c.user_id)?.comments.push(c);
  }

  return NextResponse.json({ players: [...userMap.values()] });
}
