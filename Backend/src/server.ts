import express from "express";
import bcrypt from "bcrypt";
import pool from "./db";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;
const GGDEALS_API_KEY = process.env.GGDEALS_API_KEY;

app.use(express.json());

// Interfaz para tipar la respuesta de búsqueda
interface GGGame {
  id: number;
  title: string;
  steamAppId?: number;
  [key: string]: any; // para campos adicionales que devuelva la API
}

// Endpoint para registrar usuario
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

// Nuevo endpoint: buscar juego por nombre y devolver precios
app.get("/api/game/:title", async (req, res) => {
  const title = req.params.title;
  try {
    // Paso 1: buscar el juego en GG.deals
    const searchRes = await fetch(
      `https://gg.deals/api/game/search/?title=${encodeURIComponent(title)}&key=${GGDEALS_API_KEY}`
    );
    const searchData = (await searchRes.json()) as GGGame[];

    if (!searchData || searchData.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    const gameId = searchData[0].id;

    // Paso 2: obtener precios con el ID interno
    const priceRes = await fetch(
      `https://gg.deals/api/game/prices/?id=${gameId}&key=${GGDEALS_API_KEY}`
    );
    const priceData = await priceRes.json();

    res.json({
      game: searchData[0],
      prices: priceData,
    });
  } catch (err) {
    res.status(500).json({ error: "Error consultando GG.deals API" });
  }
});

// Endpoint de prueba
app.get("/", (_req, res) => {
  res.send("Servidor corriendo en Render 🚀");
});

// Mantener el proceso vivo
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
});