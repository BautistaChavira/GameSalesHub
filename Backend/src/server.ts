import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pool from "./db";
import fetch from "node-fetch";
import cron from "node-cron";

import { initDB } from "./initDB"; // importa tu función

const app = express();
const PORT = process.env.PORT || 3000;
const GGDEALS_API_KEY = process.env.GGDEALS_API_KEY;

// 🔑 Configuración CORS
app.use(cors({
  origin: [
    "https://gamesaleshub-front.onrender.com", // tu frontend en Render
    "http://localhost:5173", // Vite dev server local
    "http://localhost:3000", // Si necesitas desde aquí también
  ],
  credentials: true, // si usas cookies/sesiones
}));


app.use(express.json());

(async () => {
  try {
    await initDB(); // crea tablas
    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error inicializando la BD:", err);
    process.exit(1);
  }
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

// Endpoint para login sin JWT
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body; // 👈 usamos username en vez de email si prefieres
    if (!username || !password) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // 👇 respuesta sencilla, sin token
    res.json({
      message: "Login exitoso",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// ----------------------
// Endpoints: Juegos
// ----------------------

// Listar juegos de la BD
app.get("/api/games", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM games ORDER BY title ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener juegos:", err);
    res.status(500).json({ error: "Error al obtener juegos" });
  }
});

// Obtener juego por ID
app.get("/api/games/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM games WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener juego:", err);
    res.status(500).json({ error: "Error al obtener juego" });
  }
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
// Endpoint: Consulta de juegos a GG deals (para búsquedas específicas)
// Ejemplo: /api/ggdeals?ids=400,292030,1091500
// ----------------------
app.get("/api/ggdeals", async (req, res) => {
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
// Endpoints: Juegos favoritos del usuario
// ----------------------
// Agregar juego favorito
app.post("/api/user/:userId/favorite-games", async (req, res) => {
  try {
    const { userId } = req.params;
    const { gameId } = req.body;

    if (!gameId) {
      return res.status(400).json({ error: "gameId es requerido" });
    }

    const result = await pool.query(
      `INSERT INTO user_saved_games (user_id, game_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, game_id) DO NOTHING
       RETURNING *`,
      [userId, gameId]
    );

    res.status(201).json({
      message: "Juego añadido a favoritos",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error al agregar juego favorito:", err);
    res.status(500).json({ error: "Error al agregar juego favorito" });
  }
});

// Obtener juegos favoritos del usuario
app.get("/api/user/:userId/favorite-games", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT g.* FROM games g
       JOIN user_saved_games usg ON g.id = usg.game_id
       WHERE usg.user_id = $1
       ORDER BY usg.saved_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener juegos favoritos:", err);
    res.status(500).json({ error: "Error al obtener juegos favoritos" });
  }
});

// Eliminar juego favorito
app.delete("/api/user/:userId/favorite-games/:gameId", async (req, res) => {
  try {
    const { userId, gameId } = req.params;

    const result = await pool.query(
      `DELETE FROM user_saved_games 
       WHERE user_id = $1 AND game_id = $2
       RETURNING *`,
      [userId, gameId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado en favoritos" });
    }

    res.json({ message: "Juego removido de favoritos" });
  } catch (err) {
    console.error("Error al eliminar juego favorito:", err);
    res.status(500).json({ error: "Error al eliminar juego favorito" });
  }
});

// ----------------------
// Endpoints: Géneros favoritos del usuario
// ----------------------
// Agregar género favorito
app.post("/api/user/:userId/favorite-genres", async (req, res) => {
  try {
    const { userId } = req.params;
    const { genreId } = req.body;

    if (!genreId) {
      return res.status(400).json({ error: "genreId es requerido" });
    }

    const result = await pool.query(
      `INSERT INTO user_favorite_genres (user_id, genre_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, genre_id) DO NOTHING
       RETURNING *`,
      [userId, genreId]
    );

    res.status(201).json({
      message: "Género añadido a favoritos",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error al agregar género favorito:", err);
    res.status(500).json({ error: "Error al agregar género favorito" });
  }
});

// Obtener géneros favoritos del usuario
app.get("/api/user/:userId/favorite-genres", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT g.* FROM genres g
       JOIN user_favorite_genres ufg ON g.id = ufg.genre_id
       WHERE ufg.user_id = $1
       ORDER BY ufg.added_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener géneros favoritos:", err);
    res.status(500).json({ error: "Error al obtener géneros favoritos" });
  }
});

// Eliminar género favorito
app.delete("/api/user/:userId/favorite-genres/:genreId", async (req, res) => {
  try {
    const { userId, genreId } = req.params;

    const result = await pool.query(
      `DELETE FROM user_favorite_genres 
       WHERE user_id = $1 AND genre_id = $2
       RETURNING *`,
      [userId, genreId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Género no encontrado en favoritos" });
    }

    res.json({ message: "Género removido de favoritos" });
  } catch (err) {
    console.error("Error al eliminar género favorito:", err);
    res.status(500).json({ error: "Error al eliminar género favorito" });
  }
});

// ----------------------
// Endpoint de prueba
// ----------------------
app.get("/", (_req, res) => {
  res.send("Servidor corriendo en Render");
});
