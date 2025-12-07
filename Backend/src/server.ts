import express from "express";
import bcrypt from "bcrypt";
import pool from "./db";
import fetch from "node-fetch";
import cron from "node-cron";

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

interface GameData {
  title: string;
  url: string;
  prices: GamePrices;
}

interface GGDealsResponse {
  success: boolean;
  data: {
    [id: string]: GamePrices | null;
  };
}

app.use(express.json()); // para parsear JSON en el body

// ----------------------
// Cron job: cada 12 horas consulta GG.deals
// ----------------------
cron.schedule("0 */12 * * *", async () => {
  console.log("⏰ Ejecutando cron para actualizar precios...");

  try {
    const ids = "292030,1091500,400"; // Witcher 3, Cyberpunk, L4D2
    const response = await fetch(
      `https://api.gg.deals/v1/prices/by-steam-app-id/?ids=${ids}&key=${GGDEALS_API_KEY}&region=us`
    );

    const data = await response.json() as GGDealsResponse;

    if (data.success) {
      for (const [steamAppId, game] of Object.entries(data.data)) {
        if (!game) continue;

        const { title, prices } = game;

        await pool.query(
          `INSERT INTO prices (steam_app_id, game_title, current_retail, current_keyshops, historical_retail, historical_keyshops, currency)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            steamAppId,
            title,
            prices.currentRetail,
            prices.currentKeyshops,
            prices.historicalRetail,
            prices.historicalKeyshops,
            prices.currency,
          ]
        );
      }
      console.log("✅ Precios actualizados en BD");
    }
  } catch (err) {
    console.error("❌ Error en cron GG.deals:", err);
  }
});

// ----------------------
// Endpoints: Usuarios
// ----------------------
// Endpoint para registrar usuario
app.post("/api/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Hashear la contraseña
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, created_at`,
      [email, username, password_hash]
    );

    const user = result.rows[0];
    res.status(201).json({ message: "Usuario registrado", user });
  } catch (err: any) {
    console.error("❌ Error al registrar usuario:", err);
    res.status(500).json({ message: "Error interno del servidor" });
    if (err.code === "23505") {
      return res.status(409).json({ message: "Email o username ya registrado" });
    }
  }
});


// ----------------------
// Endpoints: Juegos
// ----------------------

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
// Endpoint: Consulta de juegos a GG deals
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
// Buscar juegos en BD por título
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