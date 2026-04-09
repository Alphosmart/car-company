"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";

type TeamMember = {
  name: string;
  role: string;
};

type CompanyProfile = {
  yearsInBusiness: number;
  carsSold: number;
  happyCustomers: number;
  citiesServed: number;
  team: TeamMember[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

const emptyProfile: CompanyProfile = {
  yearsInBusiness: 8,
  carsSold: 1200,
  happyCustomers: 900,
  citiesServed: 12,
  team: [],
};

export default function AdminCompanyPage() {
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<CompanyProfile>(emptyProfile);
  const [teamText, setTeamText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const existingToken =
      window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";

    setToken(existingToken);
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/company`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load company profile (${response.status})`);
      }

      const payload = (await response.json()) as CompanyProfile;
      const safeProfile: CompanyProfile = {
        yearsInBusiness: payload.yearsInBusiness ?? 8,
        carsSold: payload.carsSold ?? 1200,
        happyCustomers: payload.happyCustomers ?? 900,
        citiesServed: payload.citiesServed ?? 12,
        team: Array.isArray(payload.team) ? payload.team : [],
      };

      setProfile(safeProfile);
      setTeamText(safeProfile.team.map((member) => `${member.name}|${member.role}`).join("\n"));
    } catch (err) {
      const text = err instanceof Error ? err.message : "Unable to load company profile";
      setError(text);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const team = teamText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, role] = line.split("|").map((part) => part.trim());
        return { name, role: role || "Team Member" };
      })
      .filter((member) => member.name.length > 0);

    try {
      const response = await fetch(`${API_BASE}/api/company/admin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          yearsInBusiness: Number(profile.yearsInBusiness),
          carsSold: Number(profile.carsSold),
          happyCustomers: Number(profile.happyCustomers),
          citiesServed: Number(profile.citiesServed),
          team,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to save company profile");
      }

      setMessage("Company profile updated successfully.");
      await loadProfile();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to save company profile";
      setError(text);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminGate>
      <div className="py-3">
        <div>
          <h1 className="text-2xl font-bold">Company Profile</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Update public About page statistics and team members.
          </p>
        </div>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}
        {loading ? <p className="mt-4 text-sm text-ink-muted">Loading profile...</p> : null}

        <section className="mt-6 rounded-2xl border border-black/10 bg-surface p-5">
          <form onSubmit={handleSubmit} className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <NumberInput
                label="Years in Business"
                value={profile.yearsInBusiness}
                onChange={(value) => setProfile({ ...profile, yearsInBusiness: value })}
              />
              <NumberInput
                label="Cars Sold"
                value={profile.carsSold}
                onChange={(value) => setProfile({ ...profile, carsSold: value })}
              />
              <NumberInput
                label="Happy Customers"
                value={profile.happyCustomers}
                onChange={(value) => setProfile({ ...profile, happyCustomers: value })}
              />
              <NumberInput
                label="Cities Served"
                value={profile.citiesServed}
                onChange={(value) => setProfile({ ...profile, citiesServed: value })}
              />
            </div>

            <label className="grid gap-1 text-sm font-semibold">
              Team Members (one per line: Name|Role)
              <textarea
                value={teamText}
                onChange={(event) => setTeamText(event.target.value)}
                rows={8}
                className="rounded-lg border border-black/15 px-3 py-2 font-normal"
                placeholder="Dr. Aliyu Uhammed|Founder and CEO\nAisha Bello|Sales Manager"
              />
            </label>

            <button
              type="submit"
              disabled={saving || !token}
              className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save Company Profile"}
            </button>
          </form>
        </section>
      </div>
    </AdminGate>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        className="rounded-lg border border-black/15 px-3 py-2 font-normal"
      />
    </label>
  );
}
