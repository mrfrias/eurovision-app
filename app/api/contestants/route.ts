import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM contestants ORDER BY "order", country`).all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { country, artist, song, flag } = await req.json();
  if (!country || !artist || !song || !flag)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const db = getDb();
  const max = db.prepare(`SELECT MAX("order") as m FROM contestants`).get() as { m: number | null };
  const result = db
    .prepare(`INSERT INTO contestants (country, artist, song, flag, "order") VALUES (?, ?, ?, ?, ?)`)
    .run(country, artist, song, flag, (max.m ?? 0) + 1);

  return NextResponse.json({ id: result.lastInsertRowid, country, artist, song, flag });
}
