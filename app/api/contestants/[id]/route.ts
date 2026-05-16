import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { country, artist, song, flag } = await req.json();
  if (!country || !artist || !song || !flag)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const db = getDb();
  db.prepare("UPDATE contestants SET country=?, artist=?, song=?, flag=? WHERE id=?").run(
    country,
    artist,
    song,
    flag,
    id
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM contestants WHERE id=?").run(id);
  return NextResponse.json({ ok: true });
}
