"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  token: string;
  staff: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

export default function StaffLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ashamsmart.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStoredSession, setHasStoredSession] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!(window.localStorage.getItem("token") || window.localStorage.getItem("authToken"));
  });

  const clearStoredSession = () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("authToken");
    window.localStorage.removeItem("staff");
    setHasStoredSession(false);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as Partial<LoginResponse> & { error?: string };

      if (!response.ok || !payload.token || !payload.staff) {
        setError(payload.error || "Login failed. Check your credentials.");
        return;
      }

      window.localStorage.setItem("token", payload.token);
      window.localStorage.setItem("authToken", payload.token);
      window.localStorage.setItem("staff", JSON.stringify(payload.staff));
      window.dispatchEvent(new Event("auth-changed"));

      router.push("/admin");
    } catch {
      setError("Could not connect to backend. Ensure it is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
      {hasStoredSession ? (
        <div className="rounded-lg border border-black/10 bg-brand-soft/40 p-3 text-sm">
          <p className="font-semibold">You are already signed in on this browser.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="rounded-lg bg-brand px-3 py-1.5 font-semibold text-white"
            >
              Continue to Admin
            </button>
            <button
              type="button"
              onClick={clearStoredSession}
              className="rounded-lg border border-black/15 px-3 py-1.5 font-semibold"
            >
              Sign in as another user
            </button>
          </div>
        </div>
      ) : null}

      <label className="grid gap-1">
        <span className="text-sm font-semibold">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="rounded-lg border border-black/15 bg-white px-3 py-2"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-semibold">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="rounded-lg border border-black/15 bg-white px-3 py-2"
        />
      </label>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}