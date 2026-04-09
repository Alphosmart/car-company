"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type SavedRequest = {
  id: string;
  title: string;
  date: string;
  name: string;
  phone: string;
  email: string;
  message: string;
};

type RemoteRequest = {
  id: string;
  status: string;
  context?: string | null;
  payload?: {
    requestType?: string;
    name?: string;
    phone?: string;
    email?: string | null;
    message?: string;
  } | null;
  createdAt: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

const dashboardKey = "sell-dashboard-requests";

function readSavedRequests(): SavedRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(dashboardKey);
    return raw ? (JSON.parse(raw) as SavedRequest[]) : [];
  } catch {
    return [];
  }
}

export default function SellDashboardClient() {
  const [requests, setRequests] = useState<SavedRequest[]>([]);
  const [remoteRequests, setRemoteRequests] = useState<RemoteRequest[]>([]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const syncLocal = useCallback(() => setRequests(readSavedRequests()), []);

  useEffect(() => {
    syncLocal();
    window.addEventListener("storage", syncLocal);
    window.addEventListener("sell-dashboard-updated", syncLocal);

    return () => {
      window.removeEventListener("storage", syncLocal);
      window.removeEventListener("sell-dashboard-updated", syncLocal);
    };
  }, [syncLocal]);

  async function fetchRemoteHistory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!phone && !email) {
      setFeedback("Enter phone or email to fetch request history.");
      return;
    }

    setLoading(true);

    const query = new URLSearchParams();
    if (phone) query.set("phone", phone);
    if (email) query.set("email", email);

    try {
      const response = await fetch(`${API_BASE}/api/public/request-history?${query.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load request history (${response.status})`);
      }

      const payload = (await response.json()) as { requests?: RemoteRequest[] };
      setRemoteRequests(payload.requests || []);
      setFeedback("Backend request history loaded.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to fetch history";
      setFeedback(text);
    } finally {
      setLoading(false);
    }
  }

  const clearRequests = () => {
    window.localStorage.removeItem(dashboardKey);
    window.dispatchEvent(new Event("sell-dashboard-updated"));
    setRequests([]);
  };

  return (
    <div className="rounded-3xl border border-black/10 bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Sell or Swap</p>
          <h2 className="mt-2 text-2xl font-bold">Seller Dashboard</h2>
          <p className="mt-2 text-sm text-ink-muted">
            View backend request history by phone/email and local browser submissions.
          </p>
        </div>
        <button type="button" onClick={clearRequests} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold">
          Clear History
        </button>
      </div>

      <form onSubmit={fetchRemoteHistory} className="mt-4 grid gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:grid-cols-3">
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone number"
          className="rounded-lg border border-black/15 px-3 py-2"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="Email"
          className="rounded-lg border border-black/15 px-3 py-2"
        />
        <button type="submit" disabled={loading} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70">
          {loading ? "Loading..." : "Load Backend History"}
        </button>
      </form>
      {feedback ? <p className="mt-2 text-sm text-ink-muted">{feedback}</p> : null}

      <div className="mt-6 grid gap-3">
        <h3 className="text-lg font-semibold">Backend History</h3>
        {remoteRequests.length === 0 ? (
          <p className="text-sm text-ink-muted">No backend requests loaded yet.</p>
        ) : (
          remoteRequests.map((request) => {
            const requestType = request.context?.replace(/^request:/, "") || request.payload?.requestType || "Request";

            return (
              <article key={request.id} className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{requestType}</h3>
                  <span className="text-xs uppercase tracking-wide text-brand">
                    {new Date(request.createdAt).toLocaleDateString()} • {request.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-muted">{request.payload?.message || "-"}</p>
                <div className="mt-3 grid gap-1 text-xs text-ink-muted">
                  <p><span className="font-semibold">Name:</span> {request.payload?.name || "-"}</p>
                  <p><span className="font-semibold">Phone:</span> {request.payload?.phone || "-"}</p>
                  <p><span className="font-semibold">Email:</span> {request.payload?.email || "-"}</p>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-6 grid gap-3">
        <h3 className="text-lg font-semibold">Local Browser History</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-ink-muted">No saved requests yet. Submit a sell or swap form to see entries here.</p>
        ) : (
          requests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{request.title}</h3>
                <span className="text-xs uppercase tracking-wide text-brand">{new Date(request.date).toLocaleDateString()}</span>
              </div>
              <p className="mt-2 text-sm text-ink-muted">{request.message}</p>
              <div className="mt-3 grid gap-1 text-xs text-ink-muted">
                <p><span className="font-semibold">Name:</span> {request.name}</p>
                <p><span className="font-semibold">Phone:</span> {request.phone}</p>
                <p><span className="font-semibold">Email:</span> {request.email || "-"}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
