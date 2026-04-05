"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

type Staff = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function AdminStaffPage() {
  const [token, setToken] = useState("");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("sales_rep");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existingToken =
      window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";
    setToken(existingToken);
  }, []);

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
    void loadStaff();
  }, [token, loadStaff]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, role }),
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole("sales_rep");
      await loadStaff();
    } finally {
      setLoading(false);
    }
  }

  async function deactivate(id: string) {
    await fetch(`${API_BASE}/api/staff/${id}/deactivate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadStaff();
  }

  async function updateRole(id: string, newRole: string) {
    await fetch(`${API_BASE}/api/staff/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: newRole }),
    });
    await loadStaff();
  }

  return (
    <AdminGate>
      <div className="py-3">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <p className="mt-2 text-sm text-ink-muted">Create staff accounts and manage roles.</p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-3 rounded-2xl border border-black/10 bg-surface p-5 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-lg border border-black/15 px-3 py-2" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-black/15 px-3 py-2" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="rounded-lg border border-black/15 px-3 py-2" />
          <select title="New staff role" value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2">
            <option value="admin">admin</option>
            <option value="manager">manager</option>
            <option value="sales_rep">sales_rep</option>
          </select>
          <button disabled={loading} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">{loading ? "Saving..." : "Add Staff"}</button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-black/10 bg-surface">
          <table className="w-full min-w-180 text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-ink-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((item) => (
                <tr key={item.id} className="border-b border-black/5">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{item.email}</td>
                  <td className="px-4 py-3">
                    <select
                      title="Update staff role"
                      value={item.role}
                      onChange={(event) => updateRole(item.id, event.target.value)}
                      className="rounded-lg border border-black/15 px-2 py-1 text-sm capitalize"
                    >
                      <option value="admin">admin</option>
                      <option value="manager">manager</option>
                      <option value="sales_rep">sales_rep</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deactivate(item.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700">Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminGate>
  );
}
