import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { country, artist, song, flag } = await req.json();
  if (!country || !artist || !song || !flag)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  await sql`
    UPDATE contestants SET country=${country}, artist=${artist}, song=${song}, flag=${flag}
    WHERE id=${id}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await sql`DELETE FROM contestants WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
