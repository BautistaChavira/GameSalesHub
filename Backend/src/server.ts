import express from "express";
import bcrypt from "bcrypt";
import pool from "./db";
import fetch from "node-fetch"; // instala con: npm install node-fetch

const app = express();
const PORT = process.env.PORT || 3000;

// Guarda tu API key en variables de entorno (Render → Settings → Environment)
const GGDEALS_API_KEY = process.env.GGDEALS_API_KEY;

app.use(express.json());

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

// Nuevo endpoint: consultar precios de juegos por Steam App ID
app.get("/api/game/:id", async (req, res) => {
  const steamAppId = req.params.id;
  try {
    const response = await fetch(
      `https://api.gg.deals/v1/game/prices/by-steam-app-id/?key=${GGDEALS_API_KEY}&ids=${steamAppId}`
    );
    const data = await response.json();
    res.json(data);
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