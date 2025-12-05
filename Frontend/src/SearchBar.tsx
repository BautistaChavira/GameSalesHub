import { useState, useEffect } from "react";

interface Game {
  id: string;
  title: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Game[]>([]);

  useEffect(() => {
    if (query.length < 2) return;

    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data: Game[]) => setResults(data));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="usuario_root">
      <h2 className="usuario_title">Busca juegos</h2>
      <div className="usuario_form">
        <input
          type="text"
          className="usuario_input"
          placeholder="Buscar juegos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ul className="usuario_list">
        {results.map((game) => (
          <li key={game.id} className="usuario_item">
            {game.title}
          </li>
        ))}
      </ul>
    </div>
  );
}