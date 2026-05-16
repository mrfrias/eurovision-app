import { sql } from "@vercel/postgres";

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS contestants (
      id BIGSERIAL PRIMARY KEY,
      country TEXT NOT NULL,
      artist TEXT NOT NULL,
      song TEXT NOT NULL,
      flag TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contestant_id BIGINT NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
      points INTEGER NOT NULL,
      UNIQUE(user_id, contestant_id),
      UNIQUE(user_id, points)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;

  // Seed admin
  const adminCheck = await sql`SELECT id FROM users WHERE is_admin = 1 LIMIT 1`;
  if (adminCheck.rowCount === 0) {
    await sql`INSERT INTO users (name, is_admin) VALUES ('Admin', 1)`;
  }

  // Seed phase
  await sql`
    INSERT INTO app_state (key, value) VALUES ('phase', 'waiting')
    ON CONFLICT (key) DO NOTHING
  `;

  // Seed contestants
  const countResult = await sql`SELECT COUNT(*) as c FROM contestants`;
  if (parseInt((countResult.rows[0] as { c: string }).c) === 0) {
    const entries = [
      ["Albania", "TBA", "TBA", "🇦🇱"],
      ["Armenia", "TBA", "TBA", "🇦🇲"],
      ["Australia", "TBA", "TBA", "🇦🇺"],
      ["Austria", "TBA", "TBA", "🇦🇹"],
      ["Azerbaijan", "TBA", "TBA", "🇦🇿"],
      ["Belgium", "TBA", "TBA", "🇧🇪"],
      ["Croatia", "TBA", "TBA", "🇭🇷"],
      ["Cyprus", "TBA", "TBA", "🇨🇾"],
      ["Czech Republic", "TBA", "TBA", "🇨🇿"],
      ["Denmark", "TBA", "TBA", "🇩🇰"],
      ["Estonia", "TBA", "TBA", "🇪🇪"],
      ["Finland", "TBA", "TBA", "🇫🇮"],
      ["France", "TBA", "TBA", "🇫🇷"],
      ["Georgia", "TBA", "TBA", "🇬🇪"],
      ["Germany", "TBA", "TBA", "🇩🇪"],
      ["Greece", "TBA", "TBA", "🇬🇷"],
      ["Iceland", "TBA", "TBA", "🇮🇸"],
      ["Ireland", "TBA", "TBA", "🇮🇪"],
      ["Israel", "TBA", "TBA", "🇮🇱"],
      ["Italy", "TBA", "TBA", "🇮🇹"],
      ["Latvia", "TBA", "TBA", "🇱🇻"],
      ["Lithuania", "TBA", "TBA", "🇱🇹"],
      ["Luxembourg", "TBA", "TBA", "🇱🇺"],
      ["Malta", "TBA", "TBA", "🇲🇹"],
      ["Moldova", "TBA", "TBA", "🇲🇩"],
      ["Netherlands", "TBA", "TBA", "🇳🇱"],
      ["Norway", "TBA", "TBA", "🇳🇴"],
      ["Poland", "TBA", "TBA", "🇵🇱"],
      ["Portugal", "TBA", "TBA", "🇵🇹"],
      ["San Marino", "TBA", "TBA", "🇸🇲"],
      ["Serbia", "TBA", "TBA", "🇷🇸"],
      ["Slovenia", "TBA", "TBA", "🇸🇮"],
      ["Spain", "TBA", "TBA", "🇪🇸"],
      ["Sweden", "TBA", "TBA", "🇸🇪"],
      ["Switzerland", "TBA", "TBA", "🇨🇭"],
      ["Ukraine", "TBA", "TBA", "🇺🇦"],
      ["United Kingdom", "TBA", "TBA", "🇬🇧"],
    ];
    for (let i = 0; i < entries.length; i++) {
      const [country, artist, song, flag] = entries[i];
      await sql`
        INSERT INTO contestants (country, artist, song, flag, "order")
        VALUES (${country}, ${artist}, ${song}, ${flag}, ${i + 1})
      `;
    }
  }
}

export { sql };
