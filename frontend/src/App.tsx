import { useState } from "react";
import AuthForm from "./components/AuthForm";
import TodoApp from "./TodoApp";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  function handleAuth(newToken: string) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  if (!token) return <AuthForm onAuth={handleAuth} />;
  return <TodoApp onLogout={handleLogout} />;
}