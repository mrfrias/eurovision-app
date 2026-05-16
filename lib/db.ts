import { sql } from "@vercel/postgres";

// Eurovision 2026 Grand Final running order — Vienna, 16 May 2026
const FINAL_ENTRIES = [
  ["Denmark",        "Søren Torpegaard Lund",           "Før vi går hjem",   "🇩🇰"],
  ["Germany",        "Sarah Engels",                    "Fire",              "🇩🇪"],
  ["Israel",         "Noam Bettan",                     "Michelle",          "🇮🇱"],
  ["Belgium",        "ESSYLA",                          "Dancing on the Ice","🇧🇪"],
  ["Albania",        "Alis",                            "Nân",               "🇦🇱"],
  ["Greece",         "Akylas",                          "Ferto",             "🇬🇷"],
  ["Ukraine",        "LELÉKA",                          "Ridnym",            "🇺🇦"],
  ["Australia",      "Delta Goodrem",                   "Eclipse",           "🇦🇺"],
  ["Serbia",         "LAVINA",                          "Kraj Mene",         "🇷🇸"],
  ["Malta",          "AIDAN",                           "Bella",             "🇲🇹"],
  ["Czechia",        "Daniel Zizka",                    "CROSSROADS",        "🇨🇿"],
  ["Bulgaria",       "DARA",                            "Bangaranga",        "🇧🇬"],
  ["Croatia",        "LELEK",                           "Andromeda",         "🇭🇷"],
  ["United Kingdom", "LOOK MUM NO COMPUTER",            "Eins, Zwei, Drei",  "🇬🇧"],
  ["France",         "Monroe",                          "Regarde !",         "🇫🇷"],
  ["Moldova",        "Satoshi",                         "Viva, Moldova!",    "🇲🇩"],
  ["Finland",        "Linda Lampenius x Pete Parkkonen","Liekinheitin",      "🇫🇮"],
  ["Poland",         "Alicja",                          "Pray",              "🇵🇱"],
  ["Lithuania",      "Lion Ceccah",                     "Sólo quiero más",   "🇱🇹"],
  ["Sweden",         "Felicia",                         "My System",         "🇸🇪"],
  ["Cyprus",         "Antigoni",                        "Jalla",             "🇨🇾"],
  ["Italy",          "Sal da Vinci",                    "Per sempre sì",     "🇮🇹"],
  ["Norway",         "Jonas Lovv",                      "Ya Ya Ya",          "🇳🇴"],
  ["Romania",        "Alexandra Căpitănescu",           "Choke Me",          "🇷🇴"],
  ["Austria",        "Cosmó",                           "Tanzschein",        "🇦🇹"],
];

async function seedContestants() {
  for (let i = 0; i < FINAL_ENTRIES.length; i++) {
    const [country, artist, song, flag] = FINAL_ENTRIES[i];
    await sql`
      INSERT INTO contestants (country, artist, song, flag, "order")
      VALUES (${country}, ${artist}, ${song}, ${flag}, ${i + 1})
    `;
  }
}

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
  await sql`
    CREATE TABLE IF NOT EXISTS predictions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      top5 TEXT NOT NULL DEFAULT '[]',
      bottom5 TEXT NOT NULL DEFAULT '[]',
      winner_id BIGINT REFERENCES contestants(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contestant_id BIGINT NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
      content VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, contestant_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS world_results (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      top5 TEXT NOT NULL DEFAULT '[]',
      bottom5 TEXT NOT NULL DEFAULT '[]',
      winner_id BIGINT REFERENCES contestants(id) ON DELETE SET NULL
    )
  `;
  await sql`
    INSERT INTO world_results (id, top5, bottom5) VALUES (1, '[]', '[]')
    ON CONFLICT (id) DO NOTHING
  `;

  // Seed admin
  const adminCheck = await sql`SELECT id FROM users WHERE is_admin = 1 LIMIT 1`;
  if (adminCheck.rowCount === 0) {
    await sql`INSERT INTO users (name, is_admin) VALUES ('Admin', 1)`;
  }

  // Seed state keys
  await sql`
    INSERT INTO app_state (key, value) VALUES ('phase', 'waiting')
    ON CONFLICT (key) DO NOTHING
  `;
  await sql`
    INSERT INTO app_state (key, value) VALUES ('reveal_stage', '0')
    ON CONFLICT (key) DO NOTHING
  `;

  // Seed or migrate contestants
  const countResult = await sql`SELECT COUNT(*) as c FROM contestants`;
  const total = parseInt((countResult.rows[0] as { c: string }).c);

  if (total === 0) {
    await seedContestants();
  } else {
    // Replace stale placeholder data (all songs = 'TBA') with real entries
    const tbaResult = await sql`SELECT COUNT(*) as c FROM contestants WHERE song = 'TBA'`;
    const tbaCount = parseInt((tbaResult.rows[0] as { c: string }).c);
    if (tbaCount === total) {
      await sql`DELETE FROM contestants`;
      await seedContestants();
    }
  }
}

export { sql };
