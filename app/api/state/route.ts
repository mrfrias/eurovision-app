import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const db = getDb();
  const row = db.prepare("SELECT value FROM app_state WHERE key = 'phase'").get() as
    | { value: string }
    | undefined;
  return NextResponse.json({ phase: row?.value ?? "waiting" });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { phase } = await req.json();
  const valid = ["waiting", "voting", "closed", "results"];
  if (!valid.includes(phase)) return NextResponse.json({ error: "Invalid phase" }, { status: 400 });

  const db = getDb();
  db.prepare("UPDATE app_state SET value = ? WHERE key = 'phase'").run(phase);
  return NextResponse.json({ phase });
}
