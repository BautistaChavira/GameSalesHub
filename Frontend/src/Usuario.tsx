import { useState } from "react";
import "./Usuario.css";

function Usuario() {
  const [genres, setGenres] = useState<string[]>([]);
  const [newGenre, setNewGenre] = useState<string>("");

  const addGenre = () => {
    if (newGenre.trim() && !genres.includes(newGenre.trim())) {
      setGenres([...genres, newGenre.trim()]);
      setNewGenre("");
    }
  };

  return (
    <div className="usuario_root">
      <h2 className="usuario_title">Tus géneros favoritos</h2>
      <div className="usuario_form">
        <input
          type="text"
          className="usuario_input"
          placeholder="Añadir género..."
          value={newGenre}
          onChange={(e) => setNewGenre(e.target.value)}
        />
        <button className="usuario_btn" onClick={addGenre}>
          Añadir
        </button>
      </div>
      <ul className="usuario_list">
        {genres.map((genre, idx) => (
          <li key={idx} className="usuario_item">
            {genre}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Usuario;