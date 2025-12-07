import pool from "./db";

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS games (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      on_sale BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),

      price_playstation NUMERIC(10,2),
      currency_playstation CHAR(3),

      price_xbox NUMERIC(10,2),
      currency_xbox CHAR(3),

      price_steam NUMERIC(10,2),
      currency_steam CHAR(3),

      price_epic NUMERIC(10,2),
      currency_epic CHAR(3),

      historical_retail NUMERIC(10,2),

      CONSTRAINT games_title_unique UNIQUE (title)
    );

    CREATE TABLE IF NOT EXISTS genres (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_genres (
      game_id UUID REFERENCES games(id) ON DELETE CASCADE,
      genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
      PRIMARY KEY (game_id, genre_id)
    );

    CREATE TABLE IF NOT EXISTS user_saved_games (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      game_id UUID REFERENCES games(id) ON DELETE CASCADE,
      saved_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (user_id, game_id)
    );
  `);

  console.log("✅ Tablas creadas o ya existentes");
}