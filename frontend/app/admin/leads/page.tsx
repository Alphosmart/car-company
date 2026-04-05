"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";
import { formatNaira, type Car } from "@/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

const statusColumns = ["new", "contacted", "test_drive", "negotiating", "closed", "lost"] as const;

type Staff = { id: string; name: string; email: string };

type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  status: string;
  createdAt: string;
  notes?: string | null;
  followUpAt?: string | null;
  staffId?: string | null;
  car?: Car | null;
  assignedTo?: Staff | null;
};

export default function AdminLeadsPage() {
  const [token, setToken] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [drawerNotes, setDrawerNotes] = useState("");
  const [drawerStatus, setDrawerStatus] = useState("");
  const [drawerStaffId, setDrawerStaffId] = useState("");
  const [drawerFollowUpAt, setDrawerFollowUpAt] = useState("");

  useEffect(() => {
    const existingToken =
      window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";
    setToken(existingToken);
  }, []);

  useEffect(() => {
    if (!selectedLead) return;
    setDrawerNotes(selectedLead.notes || "");
    setDrawerStatus(selectedLead.status || "new");
    setDrawerStaffId(selectedLead.staffId || "");
    setDrawerFollowUpAt(selectedLead.followUpAt ? selectedLead.followUpAt.slice(0, 16) : "");
  }, [selectedLead]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("limit", "100");
      if (statusFilter) query.set("status", statusFilter);
      if (staffFilter) query.set("staffId", staffFilter);
      if (dateRangeFilter) query.set("dateRange", dateRangeFilter);
      const response = await fetch(`${API_BASE}/api/leads?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = (await response.json()) as { leads?: Lead[] };
      setLeads(payload.leads || []);
    } finally {
      setLoading(false);
    }
  }, [dateRangeFilter, staffFilter, statusFilter, token]);

  const loadStaff = useCallback(async () => {
    const response = await fetch(`${API_BASE}/api/staff`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json()) as { staff?: Staff[] };
    setStaff(payload.staff || []);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadLeads();
    void loadStaff();
  }, [token, loadLeads, loadStaff]);

  const groupedLeads = useMemo(() => {
    return statusColumns.reduce<Record<string, Lead[]>>((acc, status) => {
      acc[status] = leads.filter((lead) => lead.status === status);
      return acc;
    }, {});
  }, [leads]);

  async function saveLead() {
    if (!selectedLead) return;

    await fetch(`${API_BASE}/api/leads/${selectedLead.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: drawerStatus,
        notes: drawerNotes,
        followUpAt: drawerFollowUpAt || null,
      }),
    });

    if (drawerStaffId) {
      await fetch(`${API_BASE}/api/leads/${selectedLead.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ staffId: drawerStaffId }),
      });
    }

    setSelectedLead(null);
    await loadLeads();
  }

  return (
    <AdminGate>
      <div className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Leads & CRM</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Kanban workflow with lead drawer, assignment, notes, and follow-up scheduling.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {statusColumns.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
            <select
              value={staffFilter}
              onChange={(event) => setStaffFilter(event.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            >
              <option value="">All staff</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
            <select
              value={dateRangeFilter}
              onChange={(event) => setDateRangeFilter(event.target.value)}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            >
              <option value="">All time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              type="button"
              onClick={() => setViewMode((previous) => (previous === "kanban" ? "table" : "kanban"))}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold"
            >
              {viewMode === "kanban" ? "Switch to table" : "Switch to kanban"}
            </button>
          </div>
        </div>

        {loading ? <p className="mt-4 text-sm text-ink-muted">Loading leads...</p> : null}

        {viewMode === "kanban" ? (
          <div className="mt-6 grid gap-4 overflow-x-auto lg:grid-cols-3 xl:grid-cols-6">
            {statusColumns.map((status) => (
              <section key={status} className="min-h-[280px] rounded-2xl border border-black/10 bg-surface p-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                  {status.replace("_", " ")}
                </h2>
                <div className="mt-3 grid gap-3">
                  {groupedLeads[status]?.length ? (
                    groupedLeads[status].map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => setSelectedLead(lead)}
                        className="rounded-xl border border-black/10 bg-white p-3 text-left shadow-sm"
                      >
                        <p className="font-semibold">{lead.name}</p>
                        <p className="text-xs text-ink-muted">
                          {lead.car ? `${lead.car.year} ${lead.car.make} ${lead.car.model}` : "No car linked"}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">{lead.phone}</p>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-ink-muted">No leads here.</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-black/10 bg-surface">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-ink-muted">
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Car</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-ink-muted" colSpan={6}>
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-black/5">
                      <td className="px-4 py-3 font-medium">{lead.name}</td>
                      <td className="px-4 py-3">{lead.phone}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {lead.car ? `${lead.car.year} ${lead.car.make} ${lead.car.model}` : "-"}
                      </td>
                      <td className="px-4 py-3 capitalize">{lead.status.replace("_", " ")}</td>
                      <td className="px-4 py-3">{lead.assignedTo?.name || "Unassigned"}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedLead(lead)}
                          className="font-semibold text-brand"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedLead ? (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
            <aside className="h-full w-full max-w-lg overflow-y-auto bg-surface p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Lead Details</h2>
                  <p className="text-sm text-ink-muted">{selectedLead.name}</p>
                </div>
                <button type="button" onClick={() => setSelectedLead(null)} className="text-sm font-semibold text-ink-muted">
                  Close
                </button>
              </div>

              <div className="mt-5 grid gap-3 text-sm">
                <p><span className="font-semibold">Phone:</span> {selectedLead.phone}</p>
                <p><span className="font-semibold">Email:</span> {selectedLead.email || "-"}</p>
                <p>
                  <span className="font-semibold">Car:</span>{" "}
                  {selectedLead.car ? `${selectedLead.car.year} ${selectedLead.car.make} ${selectedLead.car.model} (${formatNaira(selectedLead.car.price)})` : "-"}
                </p>
                <p><span className="font-semibold">Message:</span> {selectedLead.message || "-"}</p>
              </div>

              <div className="mt-5 grid gap-3">
                <label className="grid gap-1 text-sm font-semibold">
                  Status
                  <select
                    value={drawerStatus}
                    onChange={(event) => setDrawerStatus(event.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2 font-normal"
                  >
                    {statusColumns.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm font-semibold">
                  Assign to staff
                  <select
                    value={drawerStaffId}
                    onChange={(event) => setDrawerStaffId(event.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2 font-normal"
                  >
                    <option value="">Unassigned</option>
                    {staff.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm font-semibold">
                  Follow-up date/time
                  <input
                    type="datetime-local"
                    value={drawerFollowUpAt}
                    onChange={(event) => setDrawerFollowUpAt(event.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2 font-normal"
                  />
                </label>

                <label className="grid gap-1 text-sm font-semibold">
                  Notes
                  <textarea
                    rows={5}
                    value={drawerNotes}
                    onChange={(event) => setDrawerNotes(event.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2 font-normal"
                  />
                </label>

                <a
                  href={`https://wa.me/${selectedLead.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Hi ${selectedLead.name}, this is Sarkin Mota Autos following up on your inquiry.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-black/15 px-4 py-2 text-center text-sm font-semibold"
                >
                  Open WhatsApp Chat
                </a>

                <button
                  onClick={saveLead}
                  className="rounded-lg bg-brand px-4 py-2 font-semibold text-white"
                >
                  Save Changes
                </button>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </AdminGate>
  );
}
