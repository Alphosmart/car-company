"use client";

import { FormEvent, useMemo, useState } from "react";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ValueEstimatorClient() {
  const [make, setMake] = useState("Toyota");
  const [model, setModel] = useState("Camry");
  const [year, setYear] = useState("2021");
  const [mileage, setMileage] = useState("45000");
  const [condition, setCondition] = useState("used");
  const [fuelType, setFuelType] = useState("petrol");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const estimate = useMemo(() => {
    const baseValue = Math.max(0, 52000000 - (2026 - Number(year || 2026)) * 2500000);
    const mileagePenalty = Math.min(Number(mileage || 0) / 1000 * 15000, 12000000);
    const conditionBoost = condition === "new" ? 8000000 : 0;
    const fuelBoost = fuelType === "electric" ? 2500000 : fuelType === "hybrid" ? 1200000 : 0;
    const value = Math.max(baseValue - mileagePenalty + conditionBoost + fuelBoost, 2500000);

    return {
      low: value * 0.92,
      mid: value,
      high: value * 1.08,
    };
  }, [condition, fuelType, mileage, year]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus(null);

    try {
      const response = await fetch(`${apiBase}/api/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName || `${make} ${model} owner`,
          phone: contactPhone || "08000000000",
          email: contactEmail,
          subject: "Instant Valuation Request",
          message:
            note ||
            `I need a manual valuation review for a ${year} ${make} ${model}. Estimated range: ${formatCurrency(estimate.low)} - ${formatCurrency(estimate.high)}.`,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus("Your valuation request has been sent to the team.");
      event.currentTarget.reset();
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Sell or Swap</p>
          <h2 className="mt-2 text-2xl font-bold">Instant Valuation</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Get a rough selling range and send the details to the team for manual review.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Make
            <input value={make} onChange={(event) => setMake(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Model
            <input value={model} onChange={(event) => setModel(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Year
            <input type="number" value={year} onChange={(event) => setYear(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Mileage
            <input type="number" value={mileage} onChange={(event) => setMileage(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Condition
            <select value={condition} onChange={(event) => setCondition(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal">
              <option value="used">Used</option>
              <option value="new">New</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Fuel Type
            <select value={fuelType} onChange={(event) => setFuelType(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal">
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
            </select>
          </label>
        </div>

        <label className="grid gap-1 text-sm font-semibold">
          Your Name
          <input value={contactName} onChange={(event) => setContactName(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Optional" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Phone
            <input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Optional" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Email
            <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Optional" />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-semibold">
          Extra Notes
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="rounded-lg border border-black/15 px-3 py-2 font-normal" placeholder="Condition, service history, modifications, etc." />
        </label>

        <button type="submit" disabled={sending} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70">
          {sending ? "Sending..." : "Request Manual Review"}
        </button>
        {status ? <p className="text-sm text-ink-muted">{status}</p> : null}
      </form>

      <aside className="rounded-3xl border border-black/10 bg-surface p-6">
        <h3 className="text-xl font-semibold">Estimated Range</h3>
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Low</p>
            <p className="mt-2 text-xl font-bold text-brand">{formatCurrency(estimate.low)}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Mid</p>
            <p className="mt-2 text-xl font-bold text-brand">{formatCurrency(estimate.mid)}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">High</p>
            <p className="mt-2 text-xl font-bold text-brand">{formatCurrency(estimate.high)}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          This is a quick market estimate. Final pricing depends on inspection, trim level and demand.
        </p>
      </aside>
    </div>
  );
}
