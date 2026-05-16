import { NextRequest, NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await initDb();
  const result = await sql`
    SELECT top5, bottom5, winner_id FROM predictions WHERE user_id = ${session.id} LIMIT 1
  `;
  if (result.rowCount === 0) return NextResponse.json({ predictions: null });

  const row = result.rows[0] as { top5: string; bottom5: string; winner_id: number | null };
  return NextResponse.json({
    predictions: {
      top5: JSON.parse(row.top5) as number[],
      bottom5: JSON.parse(row.bottom5) as number[],
      winner_id: row.winner_id,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { top5, bottom5, winner_id } = await req.json() as {
    top5: number[];
    bottom5: number[];
    winner_id: number;
  };

  if (!Array.isArray(top5) || top5.length !== 5)
    return NextResponse.json({ error: "Pick exactly 5 for top 5" }, { status: 400 });
  if (!Array.isArray(bottom5) || bottom5.length !== 5)
    return NextResponse.json({ error: "Pick exactly 5 for bottom 5" }, { status: 400 });
  if (!winner_id)
    return NextResponse.json({ error: "Pick a winner" }, { status: 400 });

  const overlap = top5.filter((id) => bottom5.includes(id));
  if (overlap.length > 0)
    return NextResponse.json({ error: "Top 5 and bottom 5 cannot overlap" }, { status: 400 });

  const top5Json = JSON.stringify(top5);
  const bottom5Json = JSON.stringify(bottom5);

  await sql`
    INSERT INTO predictions (user_id, top5, bottom5, winner_id)
    VALUES (${session.id}, ${top5Json}, ${bottom5Json}, ${winner_id})
    ON CONFLICT (user_id) DO UPDATE
      SET top5 = ${top5Json}, bottom5 = ${bottom5Json}, winner_id = ${winner_id}
  `;

  return NextResponse.json({ ok: true });
}
