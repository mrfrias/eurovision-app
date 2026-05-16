import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { sql, initDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  await initDb();
  const result = await sql`SELECT value FROM app_state WHERE key = 'phase'`;
  const row = result.rows[0] as { value: string } | undefined;
  return NextResponse.json({ phase: row?.value ?? "waiting" });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { phase } = await req.json();
  const valid = ["waiting", "live_show", "voting", "closed", "results"];
  if (!valid.includes(phase)) return NextResponse.json({ error: "Invalid phase" }, { status: 400 });

  await sql`UPDATE app_state SET value = ${phase} WHERE key = 'phase'`;
  return NextResponse.json({ phase });
}
