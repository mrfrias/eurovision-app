import { NextRequest, NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET — return the current user's own comments (all phases),
//        or all comments with player names (results phase / admin)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await initDb();

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  const phaseResult = await sql`SELECT value FROM app_state WHERE key = 'phase'`;
  const phase = (phaseResult.rows[0] as { value: string } | undefined)?.value ?? "waiting";

  if (all && phase === "results") {
    // All comments for the results reveal carousel
    const result = await sql`
      SELECT co.id, co.content, co.contestant_id,
             u.name  AS user_name,
             c.country, c.flag
      FROM comments co
      JOIN users u ON u.id = co.user_id
      JOIN contestants c ON c.id = co.contestant_id
      WHERE u.is_admin = 0 AND TRIM(co.content) <> ''
      ORDER BY RANDOM()
    `;
    return NextResponse.json({ comments: result.rows });
  }

  // Own comments only
  const result = await sql`
    SELECT co.id, co.content, co.contestant_id
    FROM comments co
    WHERE co.user_id = ${session.id}
  `;
  return NextResponse.json({ comments: result.rows });
}

// POST — upsert a comment; only allowed during live_show phase
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.is_admin) return NextResponse.json({ error: "Admin cannot comment" }, { status: 403 });

  const phaseResult = await sql`SELECT value FROM app_state WHERE key = 'phase'`;
  const phase = (phaseResult.rows[0] as { value: string } | undefined)?.value;
  if (phase !== "live_show")
    return NextResponse.json({ error: "Comments can only be written during the Live Show phase" }, { status: 403 });

  const { contestant_id, content } = await req.json() as { contestant_id: number; content: string };
  if (!contestant_id) return NextResponse.json({ error: "contestant_id required" }, { status: 400 });

  const trimmed = (content ?? "").trim().slice(0, 255);

  if (trimmed === "") {
    // Delete comment if blank
    await sql`DELETE FROM comments WHERE user_id = ${session.id} AND contestant_id = ${contestant_id}`;
  } else {
    await sql`
      INSERT INTO comments (user_id, contestant_id, content)
      VALUES (${session.id}, ${contestant_id}, ${trimmed})
      ON CONFLICT (user_id, contestant_id) DO UPDATE SET content = ${trimmed}
    `;
  }

  return NextResponse.json({ ok: true });
}
