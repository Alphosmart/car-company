"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnalyticsOverview, fetchAnalyticsOverview } from "@/lib/analytics";
import AdminGate from "@/components/admin/AdminGate";

type LeadListItem = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  car?: {
    make: string;
    model: string;
    year: number;
  } | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatLeadTime(value: string): string {
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(delta / 60000);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminOverviewPage() {
  const [token, setToken] = useState("");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [recentLeads, setRecentLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existingToken =
      window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";

    if (!existingToken) {
      window.location.href = "/admin/login";
      return;
    }

    setToken(existingToken);
  }, []);

  const canLoad = useMemo(() => token.trim().length > 0, [token]);

  useEffect(() => {
    const load = async () => {
      if (!canLoad) return;

      setLoading(true);
      setError(null);

      try {
        const [overviewData, leadsResponse] = await Promise.all([
          fetchAnalyticsOverview(token, { period: "today" }),
          fetch(`${API_BASE}/api/leads?limit=10&page=1`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }),
        ]);

        if (!leadsResponse.ok) {
          throw new Error(`Lead request failed: ${leadsResponse.status}`);
        }

        const payload = (await leadsResponse.json()) as { leads?: LeadListItem[] };

        setOverview(overviewData);
        setRecentLeads(payload.leads || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load admin dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canLoad, token]);

  return (
    <AdminGate>
      <div className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Snapshot of stock, leads, and conversions with quick admin actions.
          </p>
        </div>
        <Link href="/admin/analytics" className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">
          Open Analytics
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Cars In Stock" value={overview?.carsInStock ?? 0} />
        <MetricCard label="New Leads Today" value={overview?.leadsToday ?? 0} />
        <MetricCard label="Total Customers" value={overview?.totalCustomers ?? 0} />
        <MetricCard label="Conversion Rate" value={formatPercent(overview?.conversionRate ?? 0)} />
      </div>

      <section className="mt-6 rounded-2xl border border-black/10 bg-surface p-5">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/cars" className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold">
            Add New Car
          </Link>
          <Link href="/admin/leads" className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold">
            View All Leads
          </Link>
          <Link href="/admin/marketing" className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold">
            Send Broadcast
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black/10 bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Leads</h2>
          <Link href="/admin/leads" className="text-sm font-semibold text-brand">
            View all
          </Link>
        </div>

        {loading ? <p className="mt-3 text-sm text-ink-muted">Loading leads...</p> : null}

        {!loading && recentLeads.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No leads captured yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-ink-muted">
                  <th className="py-2">Customer</th>
                  <th className="py-2">Car</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-black/5">
                    <td className="py-2 font-medium">{lead.name}</td>
                    <td className="py-2">
                      {lead.car ? `${lead.car.year} ${lead.car.make} ${lead.car.model}` : "Unknown car"}
                    </td>
                    <td className="py-2 capitalize">{lead.status.replace("_", " ")}</td>
                    <td className="py-2 text-ink-muted">{formatLeadTime(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>
    </AdminGate>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="rounded-2xl border border-black/10 bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </article>
  );
}
