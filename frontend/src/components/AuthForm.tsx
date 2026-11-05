import { useState } from "react";
import { API_URL } from "../api";

export default function AuthForm({ onAuth }: { onAuth: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(mode: "login" | "signup") {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong");
      onAuth(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <h1 className="mb-6 text-3xl font-bold">Todo List</h1>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit("login"); // pressing Enter logs in
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 8 characters)"
          required
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
          >
            Log in
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => submit("signup")}
            className="flex-1 rounded border border-blue-600 px-3 py-2 text-blue-600 disabled:opacity-50"
          >
            Sign up
          </button>
        </div>
      </form>
    </main>
  );
}