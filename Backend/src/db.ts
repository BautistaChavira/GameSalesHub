import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render te da esta variable
  ssl: { rejectUnauthorized: false },         // necesario en Render
});

export default pool;