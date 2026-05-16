import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await sql`DELETE FROM votes`;
  await sql`DELETE FROM predictions`;
  await sql`DELETE FROM comments`;
  await sql`DELETE FROM users WHERE is_admin = 0`;
  await sql`UPDATE world_results SET top5 = '[]', bottom5 = '[]', winner_id = NULL WHERE id = 1`;
  await sql`UPDATE app_state SET value = 'waiting' WHERE key = 'phase'`;
  await sql`UPDATE app_state SET value = '0'       WHERE key = 'reveal_stage'`;

  return NextResponse.json({ ok: true });
}
