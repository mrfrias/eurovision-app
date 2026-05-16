import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const result = await sql`SELECT value FROM app_state WHERE key = 'reveal_stage'`;
  const stage = parseInt((result.rows[0] as { value: string } | undefined)?.value ?? "0");
  return NextResponse.json({ stage });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { stage } = await req.json();
  if (typeof stage !== "number" || stage < 0 || stage > 4)
    return NextResponse.json({ error: "Stage must be 0–4" }, { status: 400 });

  await sql`UPDATE app_state SET value = ${String(stage)} WHERE key = 'reveal_stage'`;
  return NextResponse.json({ stage });
}
