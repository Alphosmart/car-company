"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

type RequestLog = {
  id: string;
  channel: string;
  recipient?: string | null;
  status: string;
  context?: string | null;
  payload?: unknown;
  createdAt: string;
};

type RequestPayload = {
  requestType?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  subject?: string | null;
  message?: string;
  adminNote?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  metadata?: Record<string, unknown> | null;
};

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type RequestsResponse = {
  requests: RequestLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

const statusOptions = ["received", "in_review", "contacted", "resolved", "closed"] as const;

export default function AdminRequestsPage() {
  const [token, setToken] = useState("");
  const [requests, setRequests] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [assigneeDrafts, setAssigneeDrafts] = useState<Record<string, string>>({});
  const [staff, setStaff] = useState<StaffMember[]>([]);

  useEffect(() => {
    const existingToken =
      window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";
    setToken(existingToken);
  }, []);

  const loadRequests = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    const query = new URLSearchParams();
    query.set("limit", "100");
    if (statusFilter) query.set("status", statusFilter);
    if (typeFilter) query.set("requestType", typeFilter);

    try {
      const response = await fetch(`${API_BASE}/api/notifications/requests?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load requests (${response.status})`);
      }

      const payload = (await response.json()) as RequestsResponse;
      const nextRequests = payload.requests || [];
      setRequests(nextRequests);
      setNoteDrafts((previous) => {
        const next = { ...previous };
        for (const request of nextRequests) {
          const requestPayload = (request.payload || {}) as RequestPayload;
          if (next[request.id] === undefined) {
            next[request.id] = requestPayload.adminNote || "";
          }
        }
        return next;
      });
      setAssigneeDrafts((previous) => {
        const next = { ...previous };
        for (const request of nextRequests) {
          const requestPayload = (request.payload || {}) as RequestPayload;
          if (next[request.id] === undefined) {
            next[request.id] = requestPayload.assignee?.id || "";
          }
        }
        return next;
      });
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to load request logs";
      setError(text);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, token, typeFilter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const loadAssignableStaff = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/notifications/assignable-staff`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load assignable staff");
      }

      const payload = (await response.json()) as { staff?: StaffMember[] };
      setStaff(payload.staff || []);
    } catch {
      setStaff([]);
    }
  }, [token]);

  useEffect(() => {
    void loadAssignableStaff();
  }, [loadAssignableStaff]);

  async function updateStatus(
    id: string,
    status: (typeof statusOptions)[number],
    adminNote?: string,
  ) {
    setFeedback(null);

    try {
      const response = await fetch(`${API_BASE}/api/notifications/requests/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, adminNote }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update status (${response.status})`);
      }

      setFeedback("Request status updated.");
      await loadRequests();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to update request";
      setError(text);
    }
  }

  const requestTypes = useMemo(() => {
    const values = new Set<string>();

    for (const request of requests) {
      const type = request.context?.replace(/^request:/, "") || "";
      if (type) values.add(type);
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [requests]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: requests.length,
    };

    for (const status of statusOptions) {
      counts[status] = requests.filter((request) => request.status === status).length;
    }

    return counts;
  }, [requests]);

  async function saveAdminNote(id: string) {
    const target = requests.find((request) => request.id === id);
    if (!target) return;

    await updateStatus(id, target.status as (typeof statusOptions)[number], noteDrafts[id] || "");
  }

  async function updateAssignee(id: string) {
    setFeedback(null);

    try {
      const response = await fetch(`${API_BASE}/api/notifications/requests/${id}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ staffId: assigneeDrafts[id] || null }),
      });

      if (!response.ok) {
        throw new Error(`Failed to assign request (${response.status})`);
      }

      setFeedback("Request assignment updated.");
      await loadRequests();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to assign request";
      setError(text);
    }
  }

  const slaCounts = useMemo(() => {
    let overdue = 0;
    let atRisk = 0;

    const activeRequests = requests.filter(
      (request) => request.status !== "resolved" && request.status !== "closed",
    );

    for (const request of activeRequests) {
      const ageHours = (Date.now() - new Date(request.createdAt).getTime()) / 36e5;
      if (ageHours > 24) {
        overdue += 1;
      } else if (ageHours > 8) {
        atRisk += 1;
      }
    }

    return { overdue, atRisk };
  }, [requests]);

  function exportCsv() {
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const header = [
      "id",
      "type",
      "status",
      "name",
      "phone",
      "email",
      "assignee",
      "adminNote",
      "createdAt",
      "message",
    ];

    const rows = requests.map((request) => {
      const payload = (request.payload || {}) as RequestPayload;
      const requestType = request.context?.replace(/^request:/, "") || payload.requestType || "";

      return [
        request.id,
        requestType,
        request.status,
        payload.name || "",
        payload.phone || "",
        payload.email || "",
        payload.assignee?.name || "",
        payload.adminNote || "",
        request.createdAt,
        payload.message || "",
      ]
        .map((value) => escapeCsv(String(value)))
        .join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `service-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminGate>
      <div className="py-3">
        <h1 className="text-2xl font-bold">Service Requests</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Review sell, swap, valuation and network requests captured from the public site.
        </p>

        <div className="mt-4 grid gap-3 rounded-2xl border border-black/10 bg-surface p-4 sm:grid-cols-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            title="Filter by request status"
            className="rounded-lg border border-black/15 px-3 py-2"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            title="Filter by request type"
            className="rounded-lg border border-black/15 px-3 py-2"
          >
            <option value="">All request types</option>
            {requestTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <button type="button" onClick={() => void loadRequests()} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold">
            Refresh
          </button>
          <button type="button" onClick={exportCsv} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold">
            Export CSV
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        {feedback ? <p className="mt-2 text-sm text-green-700">{feedback}</p> : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <article className="rounded-xl border border-black/10 bg-surface p-3">
            <p className="text-xs uppercase tracking-wide text-ink-muted">All</p>
            <p className="mt-1 text-xl font-bold">{statusCounts.all}</p>
          </article>
          {statusOptions.map((status) => (
            <article key={status} className="rounded-xl border border-black/10 bg-surface p-3">
              <p className="text-xs uppercase tracking-wide text-ink-muted">{status.replace("_", " ")}</p>
              <p className="mt-1 text-xl font-bold">{statusCounts[status]}</p>
            </article>
          ))}
          <article className="rounded-xl border border-amber-300/60 bg-amber-50 p-3">
            <p className="text-xs uppercase tracking-wide text-amber-800">At Risk (8h+)</p>
            <p className="mt-1 text-xl font-bold text-amber-900">{slaCounts.atRisk}</p>
          </article>
          <article className="rounded-xl border border-red-300/60 bg-red-50 p-3">
            <p className="text-xs uppercase tracking-wide text-red-800">Overdue (24h+)</p>
            <p className="mt-1 text-xl font-bold text-red-900">{slaCounts.overdue}</p>
          </article>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/10 bg-surface p-4">
          {loading ? <p className="text-sm text-ink-muted">Loading requests...</p> : null}

          {!loading && requests.length === 0 ? (
            <p className="text-sm text-ink-muted">No request records found for this filter.</p>
          ) : (
            <table className="w-full min-w-190 text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-ink-muted">
                  <th className="py-2">View</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Contact</th>
                  <th className="py-2">Message</th>
                  <th className="py-2">SLA</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const payload = (request.payload || {}) as RequestPayload;
                  const requestType = request.context?.replace(/^request:/, "") || payload.requestType || "Unknown";
                  const ageHours = (Date.now() - new Date(request.createdAt).getTime()) / 36e5;
                  const isClosed = request.status === "resolved" || request.status === "closed";
                  const slaLabel = isClosed
                    ? "Closed"
                    : ageHours > 24
                      ? "Overdue"
                      : ageHours > 8
                        ? "At Risk"
                        : "On Track";
                  const slaClassName = isClosed
                    ? "bg-emerald-100 text-emerald-800"
                    : ageHours > 24
                      ? "bg-red-100 text-red-800"
                      : ageHours > 8
                        ? "bg-amber-100 text-amber-800"
                        : "bg-sky-100 text-sky-800";

                  return (
                    <Fragment key={request.id}>
                      <tr className="border-b border-black/5 align-top">
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId((current) => (current === request.id ? null : request.id))}
                            className="rounded-lg border border-black/15 px-2 py-1 text-xs font-semibold"
                          >
                            {expandedId === request.id ? "Hide" : "View"}
                          </button>
                        </td>
                        <td className="py-3 font-semibold">{requestType}</td>
                        <td className="py-3">
                          <p className="font-medium">{payload.name || "-"}</p>
                          <p className="text-xs text-ink-muted">{payload.phone || "-"}</p>
                          <p className="text-xs text-ink-muted">{payload.email || "-"}</p>
                        </td>
                        <td className="py-3">
                          <p className="line-clamp-3 max-w-md text-xs text-ink-muted">{payload.message || "-"}</p>
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${slaClassName}`}>
                            {slaLabel}
                          </span>
                        </td>
                        <td className="py-3">
                          <select
                            value={request.status}
                            onChange={(event) =>
                              void updateStatus(
                                request.id,
                                event.target.value as (typeof statusOptions)[number],
                                noteDrafts[request.id] || "",
                              )
                            }
                            title="Update request status"
                            className="rounded-lg border border-black/15 px-2 py-1 text-xs font-semibold"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 text-xs text-ink-muted">{new Date(request.createdAt).toLocaleString()}</td>
                      </tr>
                      {expandedId === request.id ? (
                        <tr className="border-b border-black/5 bg-white/40">
                          <td colSpan={7} className="px-3 py-3">
                            <div className="grid gap-4 md:grid-cols-3">
                              <div className="rounded-xl border border-black/10 bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Metadata</p>
                                <pre className="mt-2 whitespace-pre-wrap break-all text-xs text-ink-muted">
                                  {JSON.stringify(payload.metadata || {}, null, 2)}
                                </pre>
                              </div>
                              <div className="rounded-xl border border-black/10 bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Assignment</p>
                                <select
                                  value={assigneeDrafts[request.id] || ""}
                                  onChange={(event) =>
                                    setAssigneeDrafts((previous) => ({
                                      ...previous,
                                      [request.id]: event.target.value,
                                    }))
                                  }
                                  title="Assign request owner"
                                  className="mt-2 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                                >
                                  <option value="">Unassigned</option>
                                  {staff.map((member) => (
                                    <option key={member.id} value={member.id}>
                                      {member.name} ({member.role})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => void updateAssignee(request.id)}
                                  className="mt-2 rounded-lg border border-black/15 px-3 py-2 text-xs font-semibold"
                                >
                                  Save Assignment
                                </button>
                                {payload.assignee ? (
                                  <p className="mt-2 text-xs text-ink-muted">
                                    Assigned to {payload.assignee.name} ({payload.assignee.email})
                                  </p>
                                ) : (
                                  <p className="mt-2 text-xs text-ink-muted">No assignee yet.</p>
                                )}
                              </div>
                              <div className="rounded-xl border border-black/10 bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Admin Note</p>
                                <textarea
                                  value={noteDrafts[request.id] || ""}
                                  onChange={(event) =>
                                    setNoteDrafts((previous) => ({
                                      ...previous,
                                      [request.id]: event.target.value,
                                    }))
                                  }
                                  rows={4}
                                  className="mt-2 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                                  placeholder="Write follow-up notes for this request"
                                />
                                <button
                                  type="button"
                                  onClick={() => void saveAdminNote(request.id)}
                                  className="mt-2 rounded-lg border border-black/15 px-3 py-2 text-xs font-semibold"
                                >
                                  Save Note
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminGate>
  );
}
