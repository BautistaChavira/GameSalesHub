import { useState } from "react";
import "./Login.css";
import { API_URLS, fetchWithTimeout } from "./config";

interface LoginProps {
  onLogin: (userId: string, username: string) => void;
}

function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<"login" | "register">("login"); // 👈 alterna entre login y registro
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "register") {
        const response = await fetchWithTimeout<{ message: string; user: { id: string; username: string } }>(
          API_URLS.register,
          {
            method: "POST",
            body: JSON.stringify({ email, username, password }),
          }
        );
        console.log("✅ Registro exitoso:", response);
        onLogin(response.user.id, response.user.username);
      } else {
        const response = await fetchWithTimeout<{ message: string; user: { id: string; username: string } }>(
          API_URLS.login,
          {
            method: "POST",
            body: JSON.stringify({ username, password }),
          }
        );
        console.log("✅ Login exitoso:", response);
        onLogin(response.user.id, response.user.username);
      }
    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="login_root">
      <h2 className="login_title">
        {mode === "register" ? "Registrarse" : "Iniciar sesión"}
      </h2>

      <form className="login_form" onSubmit={handleSubmit}>
        {mode === "register" && (
          <label className="login_label">
            Email
            <input
              type="email"
              className="login_input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        )}

        <label className="login_label">
          Nombre de usuario
          <input
            type="text"
            className="login_input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>

        <label className="login_label">
          Contraseña
          <input
            type="password"
            className="login_input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="login_btn">
          {mode === "register" ? "Registrarse" : "Entrar"}
        </button>
      </form>

      {error && <p className="login_error">{error}</p>}

      <div className="login_toggle">
        {mode === "register" ? (
          <p>
            ¿Ya tienes cuenta?{" "}
            <button
              type="button"
              className="login_link"
              onClick={() => setMode("login")}
            >
              Inicia sesión
            </button>
          </p>
        ) : (
          <p>
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              className="login_link"
              onClick={() => setMode("register")}
            >
              Regístrate
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;