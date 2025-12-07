import { useState } from "react";
import "./Login.css";
import { API_URLS, fetchWithTimeout } from "./config";

interface LoginProps {
  onLogin: () => void;
}

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetchWithTimeout<{ message: string }>(
        API_URLS.register,
        {
          method: "POST",
          body: JSON.stringify({ email, username, password }),
        }
      );
      console.log("✅ Registro exitoso:", response);
      onLogin();
    } catch (err: any) {
      console.error("❌ Error en registro:", err);
      setError(err.message);
    }
  };

  return (
    <div className="login_root">
      <h2 className="login_title">Registrarse</h2>
      <form className="login_form" onSubmit={handleSubmit}>
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
          Registrarse
        </button>
      </form>
      {error && <p className="login_error">{error}</p>}
    </div>
  );
}

export default Login;