import { useState } from "react";
import "./App.css";
import Login from "./Login";
import Usuario from "./Usuario";
import Offers from "./Offers";
import YourOffers from "./YourOffers";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<string>("offers");
  const [userId, setUserId] = useState<string>("");

  const userName = "Alan";
  const userImage = "/userdefault.jpg";

  const handleLogin = (id: string) => {
    setUserId(id);
    setIsLoggedIn(true);
  };

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
            <YourOffers userId={userId} />
          ) : (
            <p>Inicia sesión para ver ofertas personalizadas</p>
          )
        )}
        {activeView === "user" &&
          (!isLoggedIn ? (
            <Login onLogin={handleLogin} />
          ) : (
            <Usuario userId={userId} />
          ))}
      </main>
    </div>
  );
}

export default App;