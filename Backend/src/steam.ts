import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Render usa certificados válidos, pero esto evita problemas locales
  },
});

export async function updateSteamTopGames(limit = 500) {
  console.log("🚀 Iniciando actualización de juegos populares de Steam...");

  const steamspyUrl = "https://steamspy.com/api.php?request=top100in2weeks";
  const popularGames: Record<string, any> =
    await fetch(steamspyUrl).then(res => res.json() as Promise<Record<string, any>>);

  console.log(`📊 Recibidos ${Object.keys(popularGames).length} juegos de SteamSpy`);

  let count = 0;
  for (const [appId, game] of Object.entries(popularGames)) {
    if (count >= limit) break;

    console.log(`➡️ Procesando juego ${count + 1}: appId=${appId}, nombre=${game.name}`);

    const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
    try {
      const resp: Record<string, any> =
        await fetch(detailsUrl, {
          headers: {
            "Accept-Language": "es-MX",   // fuerza idioma/región México
            "User-Agent": "Mozilla/5.0",  // simula navegador
            "Cookie": "steamCountry=MX%7C..."
          }
        }).then(res => res.json() as Promise<Record<string, any>>);

      if (!resp[appId]?.success) {
        console.warn(`⚠️ No se pudo obtener detalles para appId=${appId}`);
        continue;
      }

      const data = resp[appId].data;
      const title = data?.name || "";
      const genres = data?.genres?.map((g: any) => g.description) || [];
      const price = data?.price_overview || {};
      const isFree = data?.is_free || false;

      // Saltar juegos Free to Play
      if (isFree || !price.final || price.final === 0) {
        console.log(`⏭️ Juego ${title} omitido por ser Free to Play`);
        continue;
      }

      console.log(
        `🎮 Insertando juego: ${title}, géneros=${genres.join(", ")}, precio=${price.final}, moneda=${price.currency}`
      );

      // Simulación de datos de GG.deals (debes reemplazar con llamada real a su API)
      const ggDealsPrices = {
        historicalRetail: null // 👈 aquí asignas el valor real de lowestPriceRetail
      };

      // Insertar juego con precio actual y histórico retail
      const gameResult = await pool.query(
        `INSERT INTO games (title, price_steam, currency_steam, on_sale, historical_retail)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (title) DO UPDATE 
         SET price_steam = EXCLUDED.price_steam,
             currency_steam = EXCLUDED.currency_steam,
             on_sale = EXCLUDED.on_sale,
             historical_retail = EXCLUDED.historical_retail
         RETURNING id`,
        [
          title,
          price.final ? price.final / 100 : null,
          price.currency || null,
          price.discount_percent > 0,
          ggDealsPrices.historicalRetail, // 👈 valor histórico retail
        ]
      );

      const gameId = gameResult.rows[0].id;
      console.log(`✅ Juego insertado con id=${gameId}`);

      // Insertar géneros y relación
      for (const g of genres) {
        console.log(`   ➕ Insertando género: ${g}`);
        const genreResult = await pool.query(
          `INSERT INTO genres (name)
           VALUES ($1)
           ON CONFLICT (name) DO NOTHING
           RETURNING id`,
          [g]
        );

        const genreId =
          genreResult.rows[0]?.id ||
          (await pool.query(`SELECT id FROM genres WHERE name=$1`, [g])).rows[0].id;

        await pool.query(
          `INSERT INTO game_genres (game_id, genre_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [gameId, genreId]
        );
      }

      count++;
      console.log(`✔️ Juego ${title} procesado (${count}/${limit})`);
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`❌ Error con app ${appId}:`, err);
    }
  }

  console.log("🏁 Proceso terminado. Juegos insertados:", count);
}

updateSteamTopGames()
  .then(() => {
    console.log("✅ Script finalizado correctamente");
  })
  .catch(err => {
    console.error("❌ Error en la ejecución:", err);
  });