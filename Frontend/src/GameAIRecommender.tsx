import { useState } from "react";
import { API_URLS, fetchWithTimeout } from "./config";

interface Game {
  id: string;
  title: string;
  on_sale: boolean;
  price_steam: number | null;
  price_epic: number | null;
  price_playstation: number | null;
  price_xbox: number | null;
}

interface GameAIRecommenderProps {
  games: Game[];
}

export default function GameAIRecommender({ games }: GameAIRecommenderProps) {
  const [recommendation, setRecommendation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = async () => {
    setLoading(true);
    setError(null);
    setRecommendation("");
    try {
      const gamesTitles = games.map(g => g.title);
      const response = await fetchWithTimeout<{ recommendation: string }>(
        `${API_URLS.baseURL}/api/ai-recommend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gamesTitles })
        }
      );
      if (response && response.recommendation) {
        setRecommendation(response.recommendation);
      } else {
        setError("Respuesta inesperada de la IA");
      }
    } catch (err: any) {
      console.error("AI Recommender Error:", err);
      setError(err.message || "Error consultando la IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{marginTop:32, padding:16, border:"1px solid #ccc", borderRadius:8, background:"#fafaff"}}>
      <h3>¿Quieres recomendaciones de la IA?</h3>
      <button onClick={getRecommendation} disabled={loading || games.length === 0} style={{padding:"0.5rem 1rem", borderRadius:4, background:"#6c63ff", color:"white", border:"none", cursor:"pointer"}}>
        {loading ? "Consultando IA..." : "Pedir recomendación IA"}
      </button>
      {error && <p style={{color:"red"}}>{error}</p>}
      {recommendation && (
        <div style={{marginTop:16}}>
          <strong>Recomendación IA:</strong>
          <p>{recommendation}</p>
        </div>
      )}
    </div>
  );
}
