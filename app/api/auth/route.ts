import { NextRequest, NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";
import { ADMIN_PASSWORD, COOKIE_NAME } from "@/lib/session";

export async function POST(req: NextRequest) {
  await initDb();
  const { name, adminPassword } = await req.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (adminPassword === ADMIN_PASSWORD) {
    const result = await sql`SELECT id, name FROM users WHERE is_admin = 1 LIMIT 1`;
    const admin = result.rows[0] as { id: number; name: string } | undefined;
    if (!admin) return NextResponse.json({ error: "No admin found" }, { status: 500 });
    const res = NextResponse.json({ id: admin.id, name: admin.name, is_admin: true });
    res.cookies.set(COOKIE_NAME, JSON.stringify({ id: admin.id }), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  }

  const trimmed = name.trim();
  let existing = await sql`SELECT id, name FROM users WHERE name = ${trimmed} AND is_admin = 0 LIMIT 1`;
  let user = existing.rows[0] as { id: number; name: string } | undefined;

  if (!user) {
    const inserted = await sql`INSERT INTO users (name, is_admin) VALUES (${trimmed}, 0) RETURNING id, name`;
    user = inserted.rows[0] as { id: number; name: string };
  }

  const res = NextResponse.json({ id: user.id, name: user.name, is_admin: false });
  res.cookies.set(COOKIE_NAME, JSON.stringify({ id: user.id }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
