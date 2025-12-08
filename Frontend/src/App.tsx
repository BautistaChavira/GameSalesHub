import { useState } from "react";
import "./App.css";
import Login from "./Login";
import Usuario from "./Usuario";
import Offers from "./Offers";
import YourOffers from "./YourOffers";
import GameAIRecommender from "./GameAIRecommender";

import { useEffect } from "react";
import { API_URLS, fetchWithTimeout } from "./config";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<string>("offers");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [personalizedGames, setPersonalizedGames] = useState<any[]>([]);

  const userImage = "/userdefault.jpg";

  const handleLogin = (id: string, username: string) => {
    setUserId(id);
    setUserName(username);
    setIsLoggedIn(true);
  };

  // Cargar personalizedGames cuando el usuario está logueado y en la vista "foryou"
  useEffect(() => {
    const fetchPersonalized = async () => {
      if (isLoggedIn && activeView === "foryou" && userId) {
        try {
          const data = await fetchWithTimeout<any[]>(API_URLS.personalizedOffers, {
            method: "POST",
            body: JSON.stringify({ userId }),
          });
          setPersonalizedGames(data);
        } catch (err) {
          setPersonalizedGames([]);
        }
      }
    };
    fetchPersonalized();
  }, [isLoggedIn, activeView, userId]);

  return (
    <div className="app_root">
      <nav className="app_navbar">
        <button className="app_nav_btn" onClick={() => setActiveView("offers")}> 
          Ofertas principales
        </button>
        <button className="app_nav_btn" onClick={() => setActiveView("foryou")}> 
          Para ti
        </button>
        <button
          className="app_nav_btn"
          onClick={() => setActiveView("user")}
        >
          {isLoggedIn ? userName : "Iniciar sesión"}
        </button>
        <div className="app_user_avatar_wrapper">
          <img
            src={userImage}
            alt="Usuario"
            className="app_user_avatar"
            style={{ opacity: isLoggedIn ? 1 : 0.4 }}
          />
        </div>
      </nav>

      <main className="app_content">
        {activeView === "offers" && <Offers />}
        {activeView === "foryou" && (
          isLoggedIn ? (
            <>
              <YourOffers userId={userId} />
              <GameAIRecommender games={personalizedGames} />
            </>
          ) : (
            <p>Inicia sesión para ver ofertas personalizadas</p>
          )
        )}
        {activeView === "user" &&
          (!isLoggedIn ? (
            <Login onLogin={handleLogin} />
          ) : (
            <Usuario userId={userId} username={userName} />
          ))}
      </main>
    </div>
  );
}

export default App;