import bcrypt from "bcrypt";
import pool from "./db";

async function registerUser(email: string, username: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3)",
    [email, username, passwordHash]
  );
}