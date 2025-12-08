import { useState, useEffect } from "react";
import { API_URLS, fetchWithTimeout } from "./config";
import "./Offers.css";

interface Game {
  id: string;
  title: string;
  on_sale: boolean;
  price_playstation: number | null;
  currency_playstation?: string | null;
  price_xbox: number | null;
  currency_xbox?: string | null;
  price_steam: number | null;
  currency_steam?: string | null;
  price_epic: number | null;
  currency_epic?: string | null;
  historical_retail: number | null;
}

export default function Offers() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc"|"desc"|"none">("none");

  useEffect(() => {
    fetchGames();
  }, []);

  const sortGames = (gamesToSort: Game[]): Game[] => {
    return [...gamesToSort].sort((a, b) => {
      if (a.on_sale === b.on_sale) {
        return a.title.localeCompare(b.title);
      }
      return a.on_sale ? -1 : 1;
    });
  };

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithTimeout<Game[]>(API_URLS.games);
      setGames(sortGames(data));
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

  // Filtro y ordenamiento local
  let filtered = games.filter(g => g.title.toLowerCase().includes(search.toLowerCase()));
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
    <div className="offers_container">
      <h2>Ofertas principales</h2>
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
      <div className="offers_grid">
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
            <div key={game.id} className="offers_card">
              <h3>{game.title}</h3>
              {steam && (
                <div className="offers_prices">
                  <p>Steam: {steam}</p>
                </div>
              )}
              {game.on_sale && <span className="offers_badge">En oferta</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
