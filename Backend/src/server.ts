import express from "express";
import bcrypt from "bcrypt";
import pool from "./db";
import fetch from "node-fetch";

import { initDB } from "./initDB"; // importa tu función

const app = express();
const PORT = process.env.PORT || 3000;
const GGDEALS_API_KEY = process.env.GGDEALS_API_KEY;

app.use(express.json());

(async () => {
  await initDB(); // ejecuta el script de la BD primero
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });
})();


// ----------------------
// Tipado de la respuesta para GG deals
// ----------------------
interface GamePrices {
  title: string;
  url: string;
  prices: {
    currentRetail: string | null;
    currentKeyshops: string | null;
    historicalRetail: string | null;
    historicalKeyshops: string | null;
    currency: string;
  };
}

interface GGDealsResponse {
  success: boolean;
  data: {
    [id: string]: GamePrices | null;
  };
}

// ----------------------
// Endpoints: Usuarios
// ----------------------
// Crear usuario
app.post("/api/users", async (req, res) => {
  const { email, username, password_hash } = req.body;
  const result = await pool.query(
    "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *",
    [email, username, password_hash]
  );
  res.json(result.rows[0]);
});

// Listar usuarios
app.get("/api/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});

// ----------------------
// Endpoints: Juegos
// ----------------------
// Crear juego
app.post("/api/games", async (req, res) => {
  const { title, on_sale } = req.body;
  const result = await pool.query(
    "INSERT INTO games (title, on_sale) VALUES ($1, $2) RETURNING *",
    [title, on_sale]
  );
  res.json(result.rows[0]);
});

// Listar juegos
app.get("/api/games", async (req, res) => {
  const result = await pool.query("SELECT * FROM games");
  res.json(result.rows);
});

// Obtener juego por ID
app.get("/api/games/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM games WHERE id = $1", [req.params.id]);
  res.json(result.rows[0]);
});

// ----------------------
// Endpoints: Generos
// ----------------------
// Crear género
app.post("/api/genres", async (req, res) => {
  const { name } = req.body;
  const result = await pool.query(
    "INSERT INTO genres (name) VALUES ($1) RETURNING *",
    [name]
  );
  res.json(result.rows[0]);
});

// Listar géneros
app.get("/api/genres", async (req, res) => {
  const result = await pool.query("SELECT * FROM genres");
  res.json(result.rows);
});

// ----------------------
// Endpoints: Relacionar Generos a Juegos
// ----------------------
// Asignar género a juego
app.post("/api/game-genres", async (req, res) => {
  const { game_id, genre_id } = req.body;
  const result = await pool.query(
    "INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2) RETURNING *",
    [game_id, genre_id]
  );
  res.json(result.rows[0]);
});

// Listar géneros de un juego
app.get("/api/games/:id/genres", async (req, res) => {
  const result = await pool.query(
    `SELECT g.* FROM genres g
     JOIN game_genres gg ON g.id = gg.genre_id
     WHERE gg.game_id = $1`,
    [req.params.id]
  );
  res.json(result.rows);
});
// ----------------------
// Endpoint: precios de un juego por Steam App ID
// ----------------------
app.get("/api/game/:id", async (req, res) => {
  const steamAppId = req.params.id;
  try {
    const response = await fetch(
      `https://api.gg.deals/v1/prices/by-steam-app-id/?ids=${steamAppId}&key=${GGDEALS_API_KEY}&region=us`
    );

    const data = (await response.json()) as GGDealsResponse;

    if (!data.success || !data.data[steamAppId]) {
      return res.status(404).json({ error: "Juego no encontrado en GG.deals" });
    }

    res.json(data.data[steamAppId]);
  } catch (err) {
    console.error("Error consultando GG.deals:", err);
    res.status(500).json({ error: "Error consultando GG.deals API" });
  }
});

// ----------------------
// Endpoint: precios de varios juegos por Steam App IDs
// Ejemplo: /api/games?ids=400,292030,1091500
// ----------------------
app.get("/api/games", async (req, res) => {
  const ids = req.query.ids as string; // ej: "400,292030,1091500"
  if (!ids) {
    return res.status(400).json({ error: "Debes proporcionar IDs separados por coma" });
  }

  try {
    const response = await fetch(
      `https://api.gg.deals/v1/prices/by-steam-app-id/?ids=${ids}&key=${GGDEALS_API_KEY}&region=us`
    );

    const data = (await response.json()) as GGDealsResponse;

    if (!data.success) {
      return res.status(404).json({ error: "No se encontraron juegos en GG.deals" });
    }

    res.json(data.data);
  } catch (err) {
    console.error("Error consultando GG.deals:", err);
    res.status(500).json({ error: "Error consultando GG.deals API" });
  }
});

// ----------------------
// Buscar juegos por título
// ----------------------
// Para busqueda en tiempo real con feedback
app.get("/api/search", async (req, res) => {
  const q = req.query.q as string;
  if (!q) {
    return res.json([]);
  }

  const result = await pool.query(
    `SELECT id, title 
     FROM games 
     WHERE title ILIKE $1 
     ORDER BY title ASC 
     LIMIT 10`,
    [`%${q}%`]
  );

  res.json(result.rows);
});

// ----------------------
// Endpoint de prueba
// ----------------------
app.get("/", (_req, res) => {
  res.send("Servidor corriendo en Render");
});

// ----------------------
// Mantener el proceso vivo
// ----------------------
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});