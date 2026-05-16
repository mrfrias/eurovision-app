import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await sql`
    SELECT u.id, u.name, u.is_admin, u.created_at,
           COUNT(v.id) as vote_count
    FROM users u
    LEFT JOIN votes v ON v.user_id = u.id
    GROUP BY u.id, u.name, u.is_admin, u.created_at
    ORDER BY u.created_at
  `;
  return NextResponse.json(result.rows);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const userResult = await sql`SELECT is_admin FROM users WHERE id=${id}`;
  const user = userResult.rows[0] as { is_admin: number } | undefined;
  if (user?.is_admin) return NextResponse.json({ error: "Cannot delete admin" }, { status: 400 });

  await sql`DELETE FROM users WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
