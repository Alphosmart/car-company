"use client";

import { FormEvent, useMemo, useState } from "react";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type NetworkRequestClientProps = {
  title: string;
  description: string;
  requestType: string;
  dashboardKey: string;
};

type SavedRequest = {
  id: string;
  title: string;
  date: string;
  name: string;
  phone: string;
  email: string;
  message: string;
};

function readSavedRequests(key: string): SavedRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedRequest[]) : [];
  } catch {
    return [];
  }
}

function saveRequest(key: string, request: SavedRequest) {
  const current = readSavedRequests(key);
  window.localStorage.setItem(key, JSON.stringify([request, ...current].slice(0, 10)));
  window.dispatchEvent(new Event("storage"));
}

export default function NetworkRequestClient({
  title,
  description,
  requestType,
  dashboardKey,
}: NetworkRequestClientProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const summary = useMemo(
    () => `${business || requestType} ${location ? `• ${location}` : ""}`.trim(),
    [business, location, requestType],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus(null);

    const message = [
      `Request type: ${requestType}`,
      `Business / interest: ${summary}`,
      `Name: ${name || "N/A"}`,
      `Phone: ${phone || "N/A"}`,
      email ? `Email: ${email}` : "",
      notes ? `Notes: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const response = await fetch(`${apiBase}/api/public/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          name: name || `${requestType} request`,
          phone: phone || "08000000000",
          email,
          subject: title,
          message,
          metadata: {
            business,
            location,
            notes,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      saveRequest(dashboardKey, {
        id: crypto.randomUUID(),
        title,
        date: new Date().toISOString(),
        name: name || requestType,
        phone: phone || "08000000000",
        email,
        message,
      });

      setStatus("Your request has been sent and saved to your dashboard history.");
      event.currentTarget.reset();
      setName("");
      setPhone("");
      setEmail("");
      setBusiness("");
      setLocation("");
      setNotes("");
    } catch {
      setStatus("Could not send your request right now. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-black/10 bg-surface p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Sarkin Mota Network</p>
          <h2 className="mt-2 text-2xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-ink-muted">{description}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Your Name
            <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Full name" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Phone
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Phone number" />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-semibold">
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Optional" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Business / Service Name
          <input value={business} onChange={(event) => setBusiness(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Your company or interest" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Location
          <input value={location} onChange={(event) => setLocation(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="City, state or region" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Tell us what you need" />
        </label>

        <button type="submit" disabled={sending} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70">
          {sending ? "Sending..." : "Submit Request"}
        </button>
        {status ? <p className="text-sm text-ink-muted">{status}</p> : null}
      </form>

      <aside className="rounded-3xl border border-black/10 bg-surface p-6">
        <h3 className="text-xl font-semibold">Request Preview</h3>
        <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Summary</p>
          <p className="mt-2 text-lg font-semibold">{summary || requestType}</p>
        </div>
        <div className="mt-4 rounded-2xl border border-brand/20 bg-brand-soft/30 p-4 text-sm text-foreground">
          Requests are routed to the team and stored in local dashboard history for follow-up.
        </div>
      </aside>
    </div>
  );
}
