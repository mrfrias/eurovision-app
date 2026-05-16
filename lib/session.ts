import { cookies } from "next/headers";
import getDb from "./db";

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "eurovision2026";
export const COOKIE_NAME = "esc_user";

export interface SessionUser {
  id: number;
  name: string;
  is_admin: boolean;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const { id } = JSON.parse(raw) as { id: number };
    const db = getDb();
    const user = db.prepare("SELECT id, name, is_admin FROM users WHERE id = ?").get(id) as
      | { id: number; name: string; is_admin: number }
      | undefined;
    if (!user) return null;
    return { id: user.id, name: user.name, is_admin: user.is_admin === 1 };
  } catch {
    return null;
  }
}
