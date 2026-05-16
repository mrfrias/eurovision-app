import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { ADMIN_PASSWORD, COOKIE_NAME } from "@/lib/session";

// POST /api/auth — register or login
export async function POST(req: NextRequest) {
  const { name, adminPassword } = await req.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDb();
  const isAdmin = adminPassword === ADMIN_PASSWORD;

  if (isAdmin) {
    const admin = db.prepare("SELECT id, name FROM users WHERE is_admin = 1").get() as
      | { id: number; name: string }
      | undefined;
    if (!admin) return NextResponse.json({ error: "No admin found" }, { status: 500 });
    const res = NextResponse.json({ id: admin.id, name: admin.name, is_admin: true });
    res.cookies.set(COOKIE_NAME, JSON.stringify({ id: admin.id }), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  }

  // Regular user — find or create by name
  let user = db.prepare("SELECT id, name FROM users WHERE name = ? AND is_admin = 0").get(name.trim()) as
    | { id: number; name: string }
    | undefined;

  if (!user) {
    const result = db.prepare("INSERT INTO users (name, is_admin) VALUES (?, 0)").run(name.trim());
    user = { id: result.lastInsertRowid as number, name: name.trim() };
  }

  const res = NextResponse.json({ id: user.id, name: user.name, is_admin: false });
  res.cookies.set(COOKIE_NAME, JSON.stringify({ id: user.id }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}

// DELETE /api/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
