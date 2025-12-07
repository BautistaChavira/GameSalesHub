import { useState, useEffect } from "react";
import { API_URLS, fetchWithTimeout } from "./config";
import "./YourOffers.css";

interface Game {
  id: string;
  title: string;
  on_sale: boolean;
  price_steam: number | null;
  price_epic: number | null;
  price_playstation: number | null;
  price_xbox: number | null;
}

interface YourOffersProps {
  userId: string;
}

export default function YourOffers({ userId }: YourOffersProps) {
  const [personalizedGames, setPersonalizedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonalizedOffers();
  }, [userId]);

  const fetchPersonalizedOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithTimeout<Game[]>(API_URLS.personalizedOffers, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      setPersonalizedGames(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar ofertas personalizadas");
      console.error("Error fetching personalized offers:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="yourOffers_container">Cargando ofertas personalizadas...</div>;
  if (error) return <div className="yourOffers_container">Error: {error}</div>;
  if (personalizedGames.length === 0) return <div className="yourOffers_container">No hay ofertas para ti en este momento. Añade más géneros favoritos.</div>;

  return (
    <div className="yourOffers_container">
      <h2 className="yourOffers_title">Ofertas para ti</h2>
      <p className="yourOffers_subtitle">Basadas en tus géneros favoritos</p>
      <div className="yourOffers_grid">
        {personalizedGames.map((game) => (
          <div key={game.id} className="yourOffers_card">
            <h3 className="yourOffers_game_title">{game.title}</h3>
            <div className="yourOffers_prices">
              {game.price_steam && (
                <p className="yourOffers_price">Steam: ${game.price_steam}</p>
              )}
              {game.price_epic && (
                <p className="yourOffers_price">Epic: ${game.price_epic}</p>
              )}
              {game.price_playstation && (
                <p className="yourOffers_price">PlayStation: ${game.price_playstation}</p>
              )}
              {game.price_xbox && (
                <p className="yourOffers_price">Xbox: ${game.price_xbox}</p>
              )}
            </div>
            {game.on_sale && (
              <span className="yourOffers_badge">En oferta</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
