import { NextRequest, NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  await initDb();
  const result = await sql`SELECT * FROM contestants ORDER BY "order", country`;
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { country, artist, song, flag } = await req.json();
  if (!country || !artist || !song || !flag)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const maxResult = await sql`SELECT MAX("order") as m FROM contestants`;
  const max = (maxResult.rows[0] as { m: number | null }).m ?? 0;
  const result = await sql`
    INSERT INTO contestants (country, artist, song, flag, "order")
    VALUES (${country}, ${artist}, ${song}, ${flag}, ${max + 1})
    RETURNING id
  `;
  return NextResponse.json({ id: result.rows[0].id, country, artist, song, flag });
}
