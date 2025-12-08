import { useState, useEffect } from "react";
import { API_URLS, fetchWithTimeout } from "./config";
import "./YourOffers.css";

interface Game {
  id: string;
  title: string;
  on_sale: boolean;
  price_steam: number | null;
  currency_steam?: string | null;
  price_epic: number | null;
  currency_epic?: string | null;
  price_playstation: number | null;
  currency_playstation?: string | null;
  price_xbox: number | null;
  currency_xbox?: string | null;
}

interface YourOffersProps {
  userId: string;
}

export default function YourOffers({ userId }: YourOffersProps) {
  const [personalizedGames, setPersonalizedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc"|"desc"|"none">("none");

  useEffect(() => {
    fetchPersonalizedOffers();
  }, [userId]);

  const sortGames = (gamesToSort: Game[]): Game[] => {
    return [...gamesToSort].sort((a, b) => {
      if (a.on_sale === b.on_sale) {
        return a.title.localeCompare(b.title);
      }
      return a.on_sale ? -1 : 1;
    });
  };

  const fetchPersonalizedOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithTimeout<Game[]>(API_URLS.personalizedOffers, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      setPersonalizedGames(sortGames(data));
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

  // Filtro y ordenamiento local
  let filtered = personalizedGames.filter(g => g.title.toLowerCase().includes(search.toLowerCase()));
  if (sortOrder !== "none") {
    filtered = [...filtered].sort((a, b) => {
      // Usar el precio "desplegado" (prioridad: steam -> epic -> playstation -> xbox)
      const getDisplayed = (game: Game) => {
        const order = [game.price_steam, game.price_epic, game.price_playstation, game.price_xbox];
        for (const p of order) {
          const n = Number(p);
          if (Number.isFinite(n)) return n;
        }
        return Infinity; // sin precio disponible
      };
      const pa = getDisplayed(a);
      const pb = getDisplayed(b);
      if (pa === pb) return a.title.localeCompare(b.title);
      return sortOrder === "asc" ? pa - pb : pb - pa;
    });
  }

  return (
    <div className="yourOffers_container">
      <h2 className="yourOffers_title">Ofertas para ti</h2>
      <p className="yourOffers_subtitle">Basadas en tus géneros favoritos</p>
      <div style={{display:'flex',gap:'1rem',marginBottom:'1rem',alignItems:'center'}}>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{padding:'0.5rem',borderRadius:'4px',border:'1px solid #ccc'}}
        />
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} style={{padding:'0.5rem',borderRadius:'4px'}}>
          <option value="none">Ordenar por...</option>
          <option value="asc">Precio más bajo</option>
          <option value="desc">Precio más alto</option>
        </select>
      </div>
      <div className="yourOffers_grid">
        {filtered.map((game) => {
          const formatPrice = (p: number | null | undefined, curr?: string | null) => {
            const n = Number(p);
            if (!Number.isFinite(n)) return null;
            const display = `$${n.toFixed(2)}`;
            if (curr && curr.toUpperCase() !== "MXN") return `${display} ${curr}`;
            return display;
          };

          const steam = formatPrice(game.price_steam, game.currency_steam);

          return (
            <div key={game.id} className="yourOffers_card">
              <h3 className="yourOffers_game_title">{game.title}</h3>
              {steam && (
                <div className="yourOffers_prices">
                  <p className="yourOffers_price">Steam: {steam}</p>
                </div>
              )}
              {game.on_sale && <span className="yourOffers_badge">En oferta</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
