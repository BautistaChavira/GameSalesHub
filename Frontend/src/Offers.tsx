import { useState, useEffect } from "react";
import { API_URLS, fetchWithTimeout } from "./config";
import "./Offers.css";

interface Game {
  id: string;
  title: string;
  on_sale: boolean;
  price_playstation: number | null;
  price_xbox: number | null;
  price_steam: number | null;
  price_epic: number | null;
  historical_retail: number | null;
}

export default function Offers() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithTimeout<Game[]>(API_URLS.games);
      setGames(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar juegos");
      console.error("Error fetching games:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="offers_container">Cargando ofertas...</div>;
  if (error) return <div className="offers_container">Error: {error}</div>;
  if (games.length === 0) return <div className="offers_container">No hay juegos disponibles</div>;

  return (
    <div className="offers_container">
      <h2>Ofertas principales</h2>
      <div className="offers_grid">
        {games.map((game) => (
          <div key={game.id} className="offers_card">
            <h3>{game.title}</h3>
            <div className="offers_prices">
              {game.price_steam && (
                <p>Steam: ${game.price_steam}</p>
              )}
              {game.price_epic && (
                <p>Epic: ${game.price_epic}</p>
              )}
              {game.price_playstation && (
                <p>PlayStation: ${game.price_playstation}</p>
              )}
              {game.price_xbox && (
                <p>Xbox: ${game.price_xbox}</p>
              )}
            </div>
            {game.on_sale && (
              <span className="offers_badge">En oferta</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
