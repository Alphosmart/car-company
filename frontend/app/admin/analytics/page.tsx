"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";
import {
  AnalyticsOverview,
  AnalyticsPeriod,
  fetchAnalyticsOverview,
  fetchLeadPipeline,
  fetchStaffPerformance,
  fetchTopCars,
  fetchRevenue,
  LeadPipelineItem,
  RevenueItem,
  StaffPerformanceItem,
  TopCarItem,
} from "@/lib/analytics";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const periodOptions: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "this_month", label: "This month" },
  { value: "this_year", label: "This year" },
];

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export default function AdminAnalyticsPage() {
  const [token, setToken] = useState("");
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [pipeline, setPipeline] = useState<LeadPipelineItem[]>([]);
  const [revenue, setRevenue] = useState<RevenueItem[]>([]);
  const [topCars, setTopCars] = useState<TopCarItem[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadsPerWeek, setLeadsPerWeek] = useState<Array<{ week: string; count: number }>>([]);

  const pipelineChartData = useMemo(
    () => pipeline.map((item) => ({ name: item.status.replace("_", " "), value: item.count })),
    [pipeline]
  );

  const revenueChartData = useMemo(
    () => revenue.map((item) => ({ month: item.month, total: item.total })),
    [revenue]
  );

  const staffChartData = useMemo(
    () =>
      staffPerformance.map((item) => ({
        name: item.name,
        assigned: item.leadsAssigned,
        closed: item.leadsClosed,
      })),
    [staffPerformance]
  );

  useEffect(() => {
    const existingToken =
      window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";
    setToken(existingToken);
  }, []);

  const canLoad = useMemo(() => token.trim().length > 0, [token]);

  const loadAnalytics = useCallback(async () => {
    if (!canLoad) {
      setError("Provide a valid JWT token to load analytics.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [overviewData, pipelineData, revenueData, topCarsData, staffPerformanceData] =
        await Promise.all([
          fetchAnalyticsOverview(token, { period }),
          fetchLeadPipeline(token, { period }),
          fetchRevenue(token, { period }),
          fetchTopCars(token),
          fetchStaffPerformance(token),
        ]);

      const leadsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/leads?limit=200&dateRange=90d`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      const leadsPayload = (await leadsResponse.json()) as {
        leads?: Array<{ createdAt: string }>;
      };

      const weekMap = new Map<string, number>();
      (leadsPayload.leads || []).forEach((lead) => {
        const date = new Date(lead.createdAt);
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay());
        start.setHours(0, 0, 0, 0);
        const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
          start.getDate()
        ).padStart(2, "0")}`;
        weekMap.set(key, (weekMap.get(key) || 0) + 1);
      });

      const weekly = Array.from(weekMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([week, count]) => ({ week, count }));

      setOverview(overviewData);
      setPipeline(pipelineData);
      setRevenue(revenueData);
      setTopCars(topCarsData);
      setStaffPerformance(staffPerformanceData);
      setLeadsPerWeek(weekly);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load analytics";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [canLoad, token, period]);

  useEffect(() => {
    if (canLoad) {
      loadAnalytics();
    }
  }, [canLoad, loadAnalytics]);

  return (
    <AdminGate>
      <div className="py-3">
      <div className="rounded-2xl border border-black/10 bg-(--surface) p-5">
        <h1 className="text-2xl font-bold">Admin Analytics</h1>
        <p className="mt-2 text-sm text-(--ink-muted)">
          Leads, revenue, listing demand, and staff performance in one place.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
            title="Analytics time period"
            className="rounded-lg border border-black/15 px-3 py-2"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="rounded-lg bg-(--brand) px-4 py-2 font-semibold text-white disabled:opacity-70"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Cars In Stock" value={overview?.carsInStock ?? 0} />
        <MetricCard label="Leads In Range" value={overview?.leadsToday ?? 0} />
        <MetricCard label="Total Customers" value={overview?.totalCustomers ?? 0} />
        <MetricCard label="Conversion Rate" value={formatPercent(overview?.conversionRate ?? 0)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-black/10 bg-(--surface) p-5">
          <h2 className="text-lg font-semibold">Lead Pipeline Funnel</h2>
          <div className="mt-3 h-[280px]">
            {pipelineChartData.length === 0 ? (
              <p className="text-sm text-(--ink-muted)">No lead data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pipelineChartData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {pipelineChartData.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={["#2563eb", "#0ea5e9", "#22c55e", "#f59e0b", "#14b8a6", "#ef4444"][index % 6]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-(--surface) p-5">
          <h2 className="text-lg font-semibold">Revenue By Month</h2>
          <div className="mt-3 h-[280px]">
            {revenueChartData.length === 0 ? (
              <p className="text-sm text-(--ink-muted)">No revenue data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => new Intl.NumberFormat("en-NG").format(Number(value ?? 0))} />
                  <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-(--surface) p-5">
        <h2 className="text-lg font-semibold">Leads Per Week (Last 90 Days)</h2>
        <div className="mt-3 h-[280px]">
          {leadsPerWeek.length === 0 ? (
            <p className="text-sm text-(--ink-muted)">No weekly trend data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leadsPerWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-(--surface) p-5">
        <h2 className="text-lg font-semibold">Staff Lead Performance</h2>
        <div className="mt-3 h-[280px]">
          {staffChartData.length === 0 ? (
            <p className="text-sm text-(--ink-muted)">No staff data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={staffChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="assigned" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="closed" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-black/10 bg-(--surface) p-5">
          <h2 className="text-lg font-semibold">Top Cars By Inquiries</h2>
          <div className="mt-3 grid gap-2">
            {topCars.length === 0 ? (
              <p className="text-sm text-(--ink-muted)">No car inquiry data available.</p>
            ) : (
              topCars.map((car) => (
                <div
                  key={car.id}
                  className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2"
                >
                  <span>
                    {car.year} {car.make} {car.model}
                  </span>
                  <span className="font-semibold">{car.inquiries}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-(--surface) p-5">
          <h2 className="text-lg font-semibold">Staff Performance</h2>
          <div className="mt-3 grid gap-2">
            {staffPerformance.length === 0 ? (
              <p className="text-sm text-(--ink-muted)">No staff data available.</p>
            ) : (
              staffPerformance.map((staff) => (
                <div key={staff.id} className="rounded-lg border border-black/10 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{staff.name}</span>
                    <span className="text-sm font-semibold">
                      {formatPercent(staff.conversionRate)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-(--ink-muted)">
                    Assigned: {staff.leadsAssigned} • Closed: {staff.leadsClosed}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      </div>
    </AdminGate>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="rounded-2xl border border-black/10 bg-(--surface) p-4">
      <p className="text-xs uppercase tracking-wide text-(--ink-muted)">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </article>
  );
}
