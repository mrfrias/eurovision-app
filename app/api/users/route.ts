import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  const users = db
    .prepare(
      `SELECT u.id, u.name, u.is_admin, u.created_at,
              COUNT(v.id) as vote_count
       FROM users u
       LEFT JOIN votes v ON v.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at`
    )
    .all();
  return NextResponse.json(users);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const db = getDb();
  const user = db.prepare("SELECT is_admin FROM users WHERE id=?").get(id) as { is_admin: number } | undefined;
  if (user?.is_admin) return NextResponse.json({ error: "Cannot delete admin" }, { status: 400 });

  db.prepare("DELETE FROM users WHERE id=?").run(id);
  return NextResponse.json({ ok: true });
}
