import { NextRequest, NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  await initDb();
  const result = await sql`SELECT top5, bottom5, winner_id FROM world_results WHERE id = 1`;
  const row = result.rows[0] as { top5: string; bottom5: string; winner_id: number | null } | undefined;
  if (!row) return NextResponse.json({ top5: [], bottom5: [], winner_id: null });
  return NextResponse.json({
    top5: JSON.parse(row.top5) as number[],
    bottom5: JSON.parse(row.bottom5) as number[],
    winner_id: row.winner_id,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { top5, bottom5, winner_id } = await req.json() as {
    top5: number[];
    bottom5: number[];
    winner_id: number | null;
  };

  if (!Array.isArray(top5) || !Array.isArray(bottom5))
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const top5Json = JSON.stringify(top5);
  const bottom5Json = JSON.stringify(bottom5);

  await sql`
    UPDATE world_results SET top5 = ${top5Json}, bottom5 = ${bottom5Json}, winner_id = ${winner_id}
    WHERE id = 1
  `;
  return NextResponse.json({ ok: true });
}
