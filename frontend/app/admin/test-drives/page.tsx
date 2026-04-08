"use client";

import { useCallback, useEffect, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";

type TestDrive = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  carId: string;
  preferredDate?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

const statusOptions = ["pending", "scheduled", "completed", "cancelled"];

export default function AdminTestDrivesPage() {
  const [token, setToken] = useState("");
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existingToken =
      window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";

    setToken(existingToken);
  }, []);

  const loadBookings = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`${API_BASE}/api/test-drives?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || `Failed to load bookings (${response.status})`);
      }

      const payload = (await response.json()) as { testDrives?: TestDrive[] };
      setTestDrives(payload.testDrives || []);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Unable to load test drive bookings";
      setError(text);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, token]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  async function updateBooking(id: string, updates: { status?: string; notes?: string }) {
    setSavingId(id);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/test-drives/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to update booking");
      }

      await loadBookings();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to update booking";
      setError(text);
    } finally {
      setSavingId(null);
    }
  }

  async function deleteBooking(id: string) {
    if (!window.confirm("Delete this test drive booking?")) return;

    setSavingId(id);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/test-drives/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to delete booking");
      }

      await loadBookings();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to delete booking";
      setError(text);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AdminGate>
      <div className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Test Drive Bookings</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Track incoming requests, update status, and add team notes.
            </p>
          </div>
          <select
            title="Filter bookings by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        {loading ? <p className="mt-4 text-sm text-ink-muted">Loading bookings...</p> : null}

        <section className="mt-6 overflow-x-auto rounded-2xl border border-black/10 bg-surface">
          <table className="w-full min-w-245 text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-ink-muted">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Car ID</th>
                <th className="px-4 py-3">Preferred Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && testDrives.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-ink-muted" colSpan={7}>
                    No bookings found.
                  </td>
                </tr>
              ) : (
                testDrives.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    disabled={savingId === booking.id}
                    onUpdate={updateBooking}
                    onDelete={deleteBooking}
                  />
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </AdminGate>
  );
}

function BookingRow({
  booking,
  disabled,
  onUpdate,
  onDelete,
}: {
  booking: TestDrive;
  disabled: boolean;
  onUpdate: (id: string, updates: { status?: string; notes?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(booking.status || "pending");
  const [notes, setNotes] = useState(booking.notes || "");

  return (
    <tr className="border-b border-black/5 align-top">
      <td className="px-4 py-3 font-medium">{booking.name}</td>
      <td className="px-4 py-3">{booking.phone}</td>
      <td className="px-4 py-3 text-ink-muted">{booking.carId}</td>
      <td className="px-4 py-3 text-ink-muted">
        {booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : "-"}
      </td>
      <td className="px-4 py-3">
        <select
          title="Booking status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-black/15 px-2 py-1 text-sm"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <textarea
          title="Booking notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          className="w-full min-w-55 rounded-lg border border-black/15 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onUpdate(booking.id, { status, notes })}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold"
          >
            Save
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDelete(booking.id)}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
