"use client";

import { FormEvent, useMemo, useState } from "react";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

function scoreVin(vin: string): number {
  let score = 0;
  const upperVin = vin.trim().toUpperCase();

  if (upperVin.length >= 17) score += 40;
  if (/^[A-HJ-NPR-Z0-9]+$/.test(upperVin)) score += 20;
  if (/[0-9]{4}/.test(upperVin)) score += 10;
  if (/[A-Z]/.test(upperVin)) score += 10;
  return Math.min(score, 100);
}

export default function HistoryCheckClient() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vin, setVin] = useState("");
  const [carDescription, setCarDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checkScore = useMemo(() => scoreVin(vin), [vin]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`${apiBase}/api/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "History Check Request",
          phone: phone || "08000000000",
          email,
          subject: "Car History Check",
          message:
            notes ||
            `Please verify the history for ${carDescription || "this vehicle"}. VIN/Chassis: ${vin}.`,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus("Your history check request has been sent to the team.");
      event.currentTarget.reset();
    } catch {
      setStatus("Could not send your request right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-black/10 bg-surface p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Ownership Tools</p>
          <h2 className="mt-2 text-2xl font-bold">Car History Check</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Send a verification request to our team and get a structured pre-purchase review.
          </p>
        </div>

        <label className="grid gap-1 text-sm font-semibold">
          Full Name
          <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Optional" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Phone
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Optional" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Optional" />
          </label>
        </div>
        <label className="grid gap-1 text-sm font-semibold">
          VIN or Chassis Number
          <input value={vin} onChange={(event) => setVin(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal uppercase" placeholder="17 characters ideal" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Vehicle Description
          <input value={carDescription} onChange={(event) => setCarDescription(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Year, make, model" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Service history, accident concerns, documents to verify..." />
        </label>

        <button type="submit" disabled={submitting} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70">
          {submitting ? "Sending..." : "Request History Review"}
        </button>
        {status ? <p className="text-sm text-ink-muted">{status}</p> : null}
      </form>

      <aside className="rounded-3xl border border-black/10 bg-surface p-6">
        <h3 className="text-xl font-semibold">VIN Readiness</h3>
        <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Format Confidence</p>
          <p className="mt-2 text-3xl font-bold text-brand">{checkScore}%</p>
        </div>
        <ul className="mt-4 space-y-3 text-sm text-ink-muted">
          <li>• Check registration and chassis consistency before payment.</li>
          <li>• Request service records, customs papers and ownership proof.</li>
          <li>• Confirm mileage, accident history and previous use.</li>
        </ul>
        <p className="mt-4 text-sm text-ink-muted">
          This page is now functional for requests. A full third-party history integration can be added next.
        </p>
      </aside>
    </div>
  );
}
