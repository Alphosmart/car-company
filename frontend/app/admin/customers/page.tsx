"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  referralCode?: string | null;
  createdAt: string;
};

export default function AdminCustomersPage() {
  const [token, setToken] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const existingToken =
      window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";
    setToken(existingToken);
  }, []);

  const loadCustomers = useCallback(async (query = search) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/customers?search=${encodeURIComponent(query)}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = (await response.json()) as { customers?: Customer[] };
      setCustomers(payload.customers || []);
    } finally {
      setLoading(false);
    }
  }, [search, token]);

  useEffect(() => {
    if (!token) return;
    void loadCustomers();
  }, [token, loadCustomers]);

  function exportCsv() {
    if (customers.length === 0) return;

    const rows = [
      ["Name", "Phone", "Email", "Referral Code", "Created At"],
      ...customers.map((customer) => [
        customer.name,
        customer.phone,
        customer.email || "",
        customer.referralCode || "",
        new Date(customer.createdAt).toISOString(),
      ]),
    ];

    const content = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "customers-export.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async function createCustomer() {
    if (!newName || !newPhone) return;

    setCreating(true);
    setFeedback(null);

    try {
      const response = await fetch(`${API_BASE}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          email: newEmail || undefined,
          address: newAddress || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create customer");
      }

      setFeedback("Customer added successfully.");
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewAddress("");
      await loadCustomers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create customer";
      setFeedback(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <AdminGate>
      <div className="py-3">
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="mt-2 text-sm text-ink-muted">Searchable list of customers and referral identifiers.</p>

        <div className="mt-5 flex gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, phone, or email"
            className="w-full rounded-lg border border-black/15 px-3 py-2"
          />
          <button
            type="button"
            onClick={() => loadCustomers(search)}
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white"
          >
            Search
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-black/15 px-4 py-2 font-semibold"
          >
            Export CSV
          </button>
        </div>

        <section className="mt-4 rounded-2xl border border-black/10 bg-surface p-4">
          <h2 className="text-lg font-semibold">Add Walk-in Customer</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Full name"
              className="rounded-lg border border-black/15 px-3 py-2"
            />
            <input
              value={newPhone}
              onChange={(event) => setNewPhone(event.target.value)}
              placeholder="Phone"
              className="rounded-lg border border-black/15 px-3 py-2"
            />
            <input
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="Email (optional)"
              className="rounded-lg border border-black/15 px-3 py-2"
            />
            <input
              value={newAddress}
              onChange={(event) => setNewAddress(event.target.value)}
              placeholder="Address (optional)"
              className="rounded-lg border border-black/15 px-3 py-2"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={createCustomer}
              disabled={creating || !newName || !newPhone}
              className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {creating ? "Adding..." : "Add Customer"}
            </button>
            {feedback ? <p className="text-sm text-ink-muted">{feedback}</p> : null}
          </div>
        </section>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/10 bg-surface">
          <table className="w-full min-w-190 text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-ink-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Referral Code</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-4" colSpan={5}>Loading customers...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td className="px-4 py-4" colSpan={5}>No customers found.</td></tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-black/5">
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3">{customer.phone}</td>
                    <td className="px-4 py-3">{customer.email || "-"}</td>
                    <td className="px-4 py-3 text-ink-muted">{customer.referralCode || "-"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${customer.id}`} className="font-semibold text-brand">
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminGate>
  );
}
