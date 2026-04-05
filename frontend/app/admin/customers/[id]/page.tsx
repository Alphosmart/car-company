"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminGate from "@/components/admin/AdminGate";
import { formatNaira } from "@/lib/api";

type CustomerLead = {
  id: string;
  status: string;
  message?: string | null;
  createdAt: string;
  car?: {
    id: string;
    make: string;
    model: string;
    year: number;
  } | null;
};

type CustomerPurchase = {
  id: string;
  salePrice: number;
  purchasedAt: string;
};

type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  referralCode?: string | null;
  referredBy?: string | null;
  createdAt: string;
  leads: CustomerLead[];
  purchases: CustomerPurchase[];
};

type ReferralItem = {
  id: string;
  code: string;
  referrerId: string;
  referredId?: string | null;
  converted: boolean;
  rewardPaid: boolean;
  createdAt: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

export default function AdminCustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existingToken =
      window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";
    setToken(existingToken);
  }, []);

  useEffect(() => {
    if (!token || !params?.id) return;

    const run = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/customers/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!response.ok) {
          setProfile(null);
          return;
        }

        const payload = (await response.json()) as CustomerProfile;
        setProfile(payload);

        const referralResponse = await fetch(`${API_BASE}/api/referrals?limit=200`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const referralPayload = (await referralResponse.json()) as { referrals?: ReferralItem[] };
        const matched = (referralPayload.referrals || []).filter(
          (item) => item.referrerId === payload.id || item.referredId === payload.id
        );
        setReferrals(matched);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [params?.id, token]);

  const timeline = useMemo(() => {
    if (!profile) return [];

    const leadEvents = profile.leads.map((lead) => ({
      id: `lead-${lead.id}`,
      date: lead.createdAt,
      label: `Lead: ${lead.status}`,
      detail: lead.car ? `${lead.car.year} ${lead.car.make} ${lead.car.model}` : "No car linked",
    }));

    const purchaseEvents = profile.purchases.map((purchase) => ({
      id: `purchase-${purchase.id}`,
      date: purchase.purchasedAt,
      label: "Purchase completed",
      detail: formatNaira(purchase.salePrice),
    }));

    return [...leadEvents, ...purchaseEvents].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [profile]);

  const referralLink = profile?.referralCode
    ? `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/cars?ref=${profile.referralCode}`
    : "";

  return (
    <AdminGate>
      <div className="py-3">
        <Link href="/admin/customers" className="text-sm font-semibold text-brand">
          Back to customers
        </Link>

        {loading ? <p className="mt-4 text-sm text-ink-muted">Loading profile...</p> : null}

        {!loading && !profile ? (
          <p className="mt-4 text-sm text-ink-muted">Customer profile not found.</p>
        ) : null}

        {profile ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <section className="rounded-2xl border border-black/10 bg-surface p-5">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <div className="mt-3 grid gap-2 text-sm">
                <p><span className="font-semibold">Phone:</span> {profile.phone}</p>
                <p><span className="font-semibold">Email:</span> {profile.email || "-"}</p>
                <p><span className="font-semibold">Address:</span> {profile.address || "-"}</p>
                <p><span className="font-semibold">Customer Since:</span> {new Date(profile.createdAt).toLocaleString()}</p>
              </div>

              <div className="mt-6 rounded-xl border border-black/10 bg-white p-4">
                <h2 className="text-lg font-semibold">Referral Details</h2>
                <p className="mt-2 text-sm"><span className="font-semibold">Referral code:</span> {profile.referralCode || "-"}</p>
                <p className="text-sm"><span className="font-semibold">Referred by:</span> {profile.referredBy || "-"}</p>
                {referralLink ? (
                  <p className="mt-2 break-all text-sm text-brand">{referralLink}</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-surface p-5">
              <h2 className="text-lg font-semibold">Interaction Timeline</h2>
              <div className="mt-3 grid gap-2">
                {timeline.length === 0 ? (
                  <p className="text-sm text-ink-muted">No timeline events yet.</p>
                ) : (
                  timeline.map((item) => (
                    <div key={item.id} className="rounded-lg border border-black/10 px-3 py-2">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-ink-muted">{item.detail}</p>
                      <p className="text-xs text-ink-muted">{new Date(item.date).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-surface p-5">
              <h2 className="text-lg font-semibold">Inquiries</h2>
              <div className="mt-3 grid gap-2">
                {profile.leads.length === 0 ? (
                  <p className="text-sm text-ink-muted">No inquiries yet.</p>
                ) : (
                  profile.leads.map((lead) => (
                    <div key={lead.id} className="rounded-lg border border-black/10 px-3 py-2">
                      <p className="text-sm font-semibold capitalize">{lead.status.replace("_", " ")}</p>
                      <p className="text-xs text-ink-muted">
                        {lead.car ? `${lead.car.year} ${lead.car.make} ${lead.car.model}` : "No car linked"}
                      </p>
                      <p className="text-xs text-ink-muted">{new Date(lead.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-surface p-5">
              <h2 className="text-lg font-semibold">Purchases</h2>
              <div className="mt-3 grid gap-2">
                {profile.purchases.length === 0 ? (
                  <p className="text-sm text-ink-muted">No purchases recorded.</p>
                ) : (
                  profile.purchases.map((purchase) => (
                    <div key={purchase.id} className="rounded-lg border border-black/10 px-3 py-2">
                      <p className="text-sm font-semibold">{formatNaira(purchase.salePrice)}</p>
                      <p className="text-xs text-ink-muted">{new Date(purchase.purchasedAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-surface p-5">
              <h2 className="text-lg font-semibold">Referral History</h2>
              <div className="mt-3 grid gap-2">
                {referrals.length === 0 ? (
                  <p className="text-sm text-ink-muted">No referral activity recorded.</p>
                ) : (
                  referrals.map((referral) => (
                    <div key={referral.id} className="rounded-lg border border-black/10 px-3 py-2">
                      <p className="text-sm font-semibold">Code: {referral.code}</p>
                      <p className="text-xs text-ink-muted">
                        Converted: {referral.converted ? "Yes" : "No"} • Reward paid: {referral.rewardPaid ? "Yes" : "No"}
                      </p>
                      <p className="text-xs text-ink-muted">{new Date(referral.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </AdminGate>
  );
}
