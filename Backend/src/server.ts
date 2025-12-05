import express from "express";
import bcrypt from "bcrypt";
import pool from "./db";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;
const GGDEALS_API_KEY = process.env.GGDEALS_API_KEY;

app.use(express.json());

// ----------------------
// Tipado de la respuesta
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
// Endpoint: registrar usuario
// ----------------------
app.post("/api/users/register", async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3)",
      [email, username, passwordHash]
    );
    res.status(201).json({ message: "Usuario registrado" });
  } catch (err) {
    res.status(400).json({ error: "Error al registrar usuario" });
  }
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
    console.error("❌ Error consultando GG.deals:", err);
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
    console.error("❌ Error consultando GG.deals:", err);
    res.status(500).json({ error: "Error consultando GG.deals API" });
  }
});

// ----------------------
// Endpoint de prueba
// ----------------------
app.get("/", (_req, res) => {
  res.send("Servidor corriendo en Render 🚀");
});

// ----------------------
// Mantener el proceso vivo
// ----------------------
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
});