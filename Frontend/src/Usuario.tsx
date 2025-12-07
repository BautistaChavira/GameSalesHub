import { useState, useEffect } from "react";
import "./Usuario.css";
import { API_URLS, fetchWithTimeout, buildUserURL } from "./config";

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

  // Cargar favoritos al montar el componente
  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    try {
      const gamesUrl = buildUserURL(userId, "favorite-games");
      const genresUrl = buildUserURL(userId, "favorite-genres");

      const [games, genres] = await Promise.all([
        fetchWithTimeout<Game[]>(gamesUrl),
        fetchWithTimeout<Genre[]>(genresUrl),
      ]);

      setFavoriteGames(games);
      setFavoriteGenres(genres);
    } catch (err) {
      console.error("Error cargando favoritos:", err);
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
      const allGenres = await fetchWithTimeout<Genre[]>(
        `${API_URLS.games.replace("/games", "")}/genres`
      );
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
      {/* Sección de géneros favoritos */}
      <div className="usuario_section">
        <h2 className="usuario_title">Tus géneros favoritos</h2>
        <div className="usuario_form">
          <input
            type="text"
            className="usuario_input"
            placeholder="Buscar género..."
            value={genreSearchQuery}
            onChange={handleGenreSearch}
          />
        </div>
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
      </div>

      {/* Sección de juegos favoritos */}
      <div className="usuario_section">
        <h2 className="usuario_title">Tus juegos favoritos</h2>
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
      </div>
    </div>
  );
}

export default Usuario;