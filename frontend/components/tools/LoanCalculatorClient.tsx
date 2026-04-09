"use client";

import { useMemo, useState } from "react";
import { calculateMonthlyPayment } from "@/lib/loanCalculator.mjs";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function LoanCalculatorClient() {
  const [price, setPrice] = useState("45000000");
  const [downPayment, setDownPayment] = useState("9000000");
  const [months, setMonths] = useState("36");
  const [annualRate, setAnnualRate] = useState("22");

  const principal = Math.max(Number(price || 0) - Number(downPayment || 0), 0);
  const monthly = calculateMonthlyPayment(principal, Number(annualRate || 0), Number(months || 0));
  const totalPayable = monthly * Number(months || 0);
  const totalInterest = Math.max(totalPayable - principal, 0);

  const summary = useMemo(
    () => [
      { label: "Financed Amount", value: formatCurrency(principal) },
      { label: "Monthly Payment", value: formatCurrency(monthly) },
      { label: "Total Interest", value: formatCurrency(totalInterest) },
    ],
    [principal, monthly, totalInterest],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
      <form className="grid gap-4 rounded-3xl border border-black/10 bg-surface p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Calculator</p>
          <h2 className="mt-2 text-2xl font-bold">Loan Calculator</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Estimate monthly vehicle repayments using your target price and preferred term.
          </p>
        </div>

        <label className="grid gap-1 text-sm font-semibold">
          Vehicle Price
          <input
            type="number"
            min={0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="rounded-lg border border-black/15 px-3 py-2 font-normal"
          />
        </label>

        <label className="grid gap-1 text-sm font-semibold">
          Down Payment
          <input
            type="number"
            min={0}
            value={downPayment}
            onChange={(event) => setDownPayment(event.target.value)}
            className="rounded-lg border border-black/15 px-3 py-2 font-normal"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Tenure (months)
            <input
              type="number"
              min={1}
              value={months}
              onChange={(event) => setMonths(event.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 font-normal"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold">
            Annual Interest Rate (%)
            <input
              type="number"
              min={0}
              step="0.1"
              value={annualRate}
              onChange={(event) => setAnnualRate(event.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 font-normal"
            />
          </label>
        </div>

        <p className="rounded-xl border border-brand/20 bg-brand-soft/30 p-4 text-sm text-foreground">
          Use this to compare financing scenarios before you reach out to the sales team.
        </p>
      </form>

      <aside className="rounded-3xl border border-black/10 bg-surface p-6">
        <h3 className="text-xl font-semibold">Your Estimate</h3>
        <div className="mt-5 grid gap-3">
          {summary.map((item) => (
            <div key={item.label} className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-ink-muted">{item.label}</p>
              <p className="mt-2 text-xl font-bold text-brand">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          Numbers are estimates only and do not include insurance, documentation or registration fees.
        </p>
      </aside>
    </div>
  );
}
