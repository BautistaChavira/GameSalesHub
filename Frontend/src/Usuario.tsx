import { useState, useEffect } from "react";
import "./Usuario.css";
import { API_URLS, fetchWithTimeout, buildUserURL, buildBudgetURL } from "./config";

interface Genre {
  id: number;
  name: string;
}

interface Game {
  id: string;
  title: string;
  on_sale: boolean;
  price_steam: number | null;
  price_epic: number | null;
  price_playstation: number | null;
  price_xbox: number | null;
}

interface UsuarioProps {
  userId: string;
}

function Usuario({ userId }: UsuarioProps) {
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);
  const [favoriteGenres, setFavoriteGenres] = useState<Genre[]>([]);
  const [gameSearchQuery, setGameSearchQuery] = useState("");
  const [gameSearchResults, setGameSearchResults] = useState<Game[]>([]);
  const [genreSearchQuery, setGenreSearchQuery] = useState("");
  const [genreSearchResults, setGenreSearchResults] = useState<Genre[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [budgetInput, setBudgetInput] = useState<string>("");
  const [savingBudget, setSavingBudget] = useState(false);

  // Cargar favoritos al montar el componente
  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    try {
      setLoadingFavorites(true);
      const gamesUrl = buildUserURL(userId, "favorite-games");
      const genresUrl = buildUserURL(userId, "favorite-genres");
      const budgetUrl = buildBudgetURL(userId);

      const [games, genres, budgetData] = await Promise.all([
        fetchWithTimeout<Game[]>(gamesUrl),
        fetchWithTimeout<Genre[]>(genresUrl),
        fetchWithTimeout<{ monthlyBudget: number }>(budgetUrl),
      ]);

      setFavoriteGames(games);
      setFavoriteGenres(genres);
      setMonthlyBudget(budgetData.monthlyBudget);
      setBudgetInput(budgetData.monthlyBudget.toString());
    } catch (err) {
      console.error("Error cargando favoritos:", err);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const saveBudget = async () => {
    try {
      const budgetAmount = parseFloat(budgetInput);
      if (isNaN(budgetAmount) || budgetAmount < 0) {
        alert("Por favor ingresa un monto válido (número >= 0)");
        return;
      }

      setSavingBudget(true);
      const budgetUrl = buildBudgetURL(userId);

      const response = await fetchWithTimeout<{ monthlyBudget: number }>(budgetUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudget: budgetAmount }),
      });

      if (response && typeof response === "object" && "monthlyBudget" in response) {
        setMonthlyBudget(response.monthlyBudget);
        alert("Presupuesto guardado exitosamente");
      }
    } catch (err) {
      console.error("Error guardando presupuesto:", err);
      alert("Error al guardar el presupuesto");
    } finally {
      setSavingBudget(false);
    }
  };

  const handleGameSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setGameSearchQuery(query);

    if (query.trim().length < 2) {
      setGameSearchResults([]);
      return;
    }

    try {
      setLoadingGames(true);
      const results = await fetchWithTimeout<Game[]>(
        `${API_URLS.search}?q=${encodeURIComponent(query)}`
      );
      setGameSearchResults(results);
    } catch (err) {
      console.error("Error buscando juegos:", err);
      setGameSearchResults([]);
    } finally {
      setLoadingGames(false);
    }
  };

  const handleGenreSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setGenreSearchQuery(query);

    if (query.trim().length < 1) {
      setGenreSearchResults([]);
      return;
    }

    try {
      setLoadingGenres(true);
      const allGenres = await fetchWithTimeout<Genre[]>(API_URLS.genres);
      const filtered = allGenres.filter((g) =>
        g.name.toLowerCase().includes(query.toLowerCase())
      );
      setGenreSearchResults(filtered);
    } catch (err) {
      console.error("Error buscando géneros:", err);
      setGenreSearchResults([]);
    } finally {
      setLoadingGenres(false);
    }
  };

  const addFavoriteGame = async (game: Game) => {
    try {
      const url = buildUserURL(userId, "favorite-games");
      await fetchWithTimeout(url, {
        method: "POST",
        body: JSON.stringify({ gameId: game.id }),
      });
      setFavoriteGames([...favoriteGames, game]);
      setGameSearchQuery("");
      setGameSearchResults([]);
    } catch (err) {
      console.error("Error añadiendo juego favorito:", err);
    }
  };

  const removeFavoriteGame = async (gameId: string) => {
    try {
      const url = `${buildUserURL(userId, "favorite-games")}/${gameId}`;
      await fetchWithTimeout(url, { method: "DELETE" });
      setFavoriteGames(favoriteGames.filter((g) => g.id !== gameId));
    } catch (err) {
      console.error("Error removiendo juego favorito:", err);
    }
  };

  const addFavoriteGenre = async (genre: Genre) => {
    try {
      const url = buildUserURL(userId, "favorite-genres");
      await fetchWithTimeout(url, {
        method: "POST",
        body: JSON.stringify({ genreId: genre.id }),
      });
      setFavoriteGenres([...favoriteGenres, genre]);
      setGenreSearchQuery("");
      setGenreSearchResults([]);
    } catch (err) {
      console.error("Error añadiendo género favorito:", err);
    }
  };

  const removeFavoriteGenre = async (genreId: number) => {
    try {
      const url = `${buildUserURL(userId, "favorite-genres")}/${genreId}`;
      await fetchWithTimeout(url, { method: "DELETE" });
      setFavoriteGenres(favoriteGenres.filter((g) => g.id !== genreId));
    } catch (err) {
      console.error("Error removiendo género favorito:", err);
    }
  };

  return (
    <div className="usuario_root">
      {/* Sección de presupuesto mensual */}
      <div className="usuario_budget_section">
        <h2 className="usuario_title">Presupuesto mensual</h2>
        {loadingFavorites ? (
          <p>Cargando presupuesto...</p>
        ) : (
          <div className="usuario_budget_form">
            <div className="usuario_budget_display">
              <label className="usuario_label">Presupuesto actual:</label>
              <p className="usuario_budget_amount">${monthlyBudget.toFixed(2)}</p>
            </div>
            <div className="usuario_budget_input_group">
              <label className="usuario_label">Nuevo presupuesto:</label>
              <div className="usuario_budget_input_wrapper">
                <span className="usuario_currency_symbol">$</span>
                <input
                  type="number"
                  className="usuario_budget_input"
                  placeholder="0.00"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={savingBudget}
                />
              </div>
              <button
                className="usuario_save_budget_btn"
                onClick={saveBudget}
                disabled={savingBudget}
              >
                {savingBudget ? "Guardando..." : "Guardar presupuesto"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sección de géneros favoritos */}
      <div className="usuario_section">
        <h2 className="usuario_title">Tus géneros favoritos</h2>
        
        {loadingFavorites ? (
          <p>Cargando géneros...</p>
        ) : (
          <>
            <div className="usuario_form">
              <input
                type="text"
                className="usuario_input"
                placeholder="Buscar género..."
                value={genreSearchQuery}
                onChange={handleGenreSearch}
              />
            </div>
            {loadingGenres && <p>Buscando...</p>}
            {genreSearchResults.length > 0 && (
              <ul className="usuario_search_results">
                {genreSearchResults.map((genre) => (
                  <li key={genre.id} className="usuario_search_item">
                    <span>{genre.name}</span>
                    {!favoriteGenres.find((g) => g.id === genre.id) && (
                      <button
                        className="usuario_add_btn"
                        onClick={() => addFavoriteGenre(genre)}
                      >
                        +
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {favoriteGenres.length === 0 ? (
              <p className="usuario_empty">No tienes géneros favoritos. ¡Añade algunos!</p>
            ) : (
              <ul className="usuario_list">
                {favoriteGenres.map((genre) => (
                  <li key={genre.id} className="usuario_item">
                    <span>{genre.name}</span>
                    <button
                      className="usuario_remove_btn"
                      onClick={() => removeFavoriteGenre(genre.id)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Sección de juegos favoritos */}
      <div className="usuario_section">
        <h2 className="usuario_title">Tus juegos favoritos</h2>
        
        {loadingFavorites ? (
          <p>Cargando juegos...</p>
        ) : (
          <>
            <div className="usuario_form">
              <input
                type="text"
                className="usuario_input"
                placeholder="Buscar juego..."
                value={gameSearchQuery}
                onChange={handleGameSearch}
              />
            </div>
            {loadingGames && <p>Buscando...</p>}
            {gameSearchResults.length > 0 && (
              <ul className="usuario_search_results">
                {gameSearchResults.map((game) => (
                  <li key={game.id} className="usuario_search_item">
                    <span>{game.title}</span>
                    {!favoriteGames.find((g) => g.id === game.id) && (
                      <button
                        className="usuario_add_btn"
                        onClick={() => addFavoriteGame(game)}
                      >
                        +
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {favoriteGames.length === 0 ? (
              <p className="usuario_empty">No tienes juegos favoritos. ¡Añade algunos!</p>
            ) : (
              <div className="usuario_games_list">
                {favoriteGames.map((game) => (
                  <div key={game.id} className="usuario_game_card">
                    <h4>{game.title}</h4>
                    {game.on_sale && <span className="usuario_sale_badge">En oferta</span>}
                    <button
                      className="usuario_remove_btn"
                      onClick={() => removeFavoriteGame(game.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Usuario;