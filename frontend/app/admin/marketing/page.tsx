"use client";

import { FormEvent, useEffect, useState } from "react";
import { useCallback } from "react";
import AdminGate from "@/components/admin/AdminGate";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

type Customer = { id: string; name: string; email?: string | null; phone: string };
type Referral = {
  id: string;
  code: string;
  referrerId: string;
  referredId?: string | null;
  converted: boolean;
  rewardPaid: boolean;
  createdAt: string;
};

export default function AdminMarketingPage() {
  const [token] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [customerIds, setCustomerIds] = useState<string[]>([]);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [waPhone, setWaPhone] = useState("");
  const [waMessage, setWaMessage] = useState("");
  const [promoText, setPromoText] = useState("");
  const [promoActiveUntil, setPromoActiveUntil] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    const response = await fetch(`${API_BASE}/api/customers?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json()) as { customers?: Customer[] };
    setCustomers(payload.customers || []);
  }, [token]);

  const loadReferrals = useCallback(async () => {
    const response = await fetch(`${API_BASE}/api/referrals?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json()) as { referrals?: Referral[] };
    setReferrals(payload.referrals || []);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => {
      void loadCustomers();
      void loadReferrals();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [token, loadCustomers, loadReferrals]);

  async function sendBroadcast(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const response = await fetch(`${API_BASE}/api/notifications/email/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subject, body, customerIds }),
    });

    const payload = (await response.json()) as { message?: string; error?: string };
    setFeedback(payload.message || payload.error || "Broadcast sent.");
  }

  async function sendSms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const response = await fetch(`${API_BASE}/api/notifications/sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phone: smsPhone, message: smsMessage }),
    });

    const payload = (await response.json()) as { message?: string; error?: string };
    setFeedback(payload.message || payload.error || "SMS sent.");
  }

  async function generateWhatsApp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const response = await fetch(`${API_BASE}/api/notifications/whatsapp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phone: waPhone, message: waMessage }),
    });

    const payload = (await response.json()) as { link?: string; error?: string };
    if (payload.link) {
      window.open(payload.link, "_blank", "noreferrer");
      setFeedback("WhatsApp link opened in a new tab.");
      return;
    }

    setFeedback(payload.error || "Failed to generate WhatsApp link.");
  }

  async function markRewardPaid(referralId: string) {
    await fetch(`${API_BASE}/api/referrals/${referralId}/reward`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadReferrals();
  }

  async function savePromoBanner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const response = await fetch(`${API_BASE}/api/notifications/promo-banner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: promoText,
        activeUntil: promoActiveUntil ? new Date(promoActiveUntil).toISOString() : null,
      }),
    });

    const payload = (await response.json()) as { message?: string; error?: string };
    setFeedback(payload.message || payload.error || "Promo banner updated.");
  }

  return (
    <AdminGate>
      <div className="py-3">
        <h1 className="text-2xl font-bold">Marketing</h1>
        <p className="mt-2 text-sm text-ink-muted">Email broadcast, SMS, WhatsApp campaigns, and referral rewards.</p>

        {feedback ? <p className="mt-4 rounded-lg border border-black/10 bg-surface px-4 py-2 text-sm">{feedback}</p> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-black/10 bg-surface p-5">
            <h2 className="text-lg font-semibold">Email Broadcast (Brevo)</h2>
            <form onSubmit={sendBroadcast} className="mt-3 grid gap-3">
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="rounded-lg border border-black/15 px-3 py-2" />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Message body" className="rounded-lg border border-black/15 px-3 py-2" />
              <label className="text-sm font-semibold">Recipients</label>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-black/10 p-2">
                {customers.map((customer) => (
                  <label key={customer.id} className="flex items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={customerIds.includes(customer.id)}
                      onChange={(event) => {
                        setCustomerIds((prev) =>
                          event.target.checked ? [...prev, customer.id] : prev.filter((id) => id !== customer.id)
                        );
                      }}
                    />
                    {customer.name} ({customer.email || customer.phone})
                  </label>
                ))}
              </div>
              <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">Send Email</button>
            </form>
          </section>

          <section className="rounded-2xl border border-black/10 bg-surface p-5">
            <h2 className="text-lg font-semibold">SMS Campaign (Termii)</h2>
            <form onSubmit={sendSms} className="mt-3 grid gap-3">
              <input value={smsPhone} onChange={(e) => setSmsPhone(e.target.value)} placeholder="Phone" className="rounded-lg border border-black/15 px-3 py-2" />
              <textarea value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} rows={4} placeholder="SMS message" className="rounded-lg border border-black/15 px-3 py-2" />
              <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">Send SMS</button>
            </form>
          </section>

          <section className="rounded-2xl border border-black/10 bg-surface p-5">
            <h2 className="text-lg font-semibold">WhatsApp Campaign</h2>
            <form onSubmit={generateWhatsApp} className="mt-3 grid gap-3">
              <input value={waPhone} onChange={(e) => setWaPhone(e.target.value)} placeholder="Phone" className="rounded-lg border border-black/15 px-3 py-2" />
              <textarea value={waMessage} onChange={(e) => setWaMessage(e.target.value)} rows={4} placeholder="WhatsApp message" className="rounded-lg border border-black/15 px-3 py-2" />
              <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">Generate WhatsApp Link</button>
            </form>
          </section>

          <section className="rounded-2xl border border-black/10 bg-surface p-5">
            <h2 className="text-lg font-semibold">Referral Rewards</h2>
            <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-black/10">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-ink-muted">
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Converted</th>
                    <th className="px-3 py-2">Reward</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="border-b border-black/5">
                      <td className="px-3 py-2">{referral.code}</td>
                      <td className="px-3 py-2">{referral.converted ? "Yes" : "No"}</td>
                      <td className="px-3 py-2">{referral.rewardPaid ? "Paid" : "Pending"}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => markRewardPaid(referral.id)}
                          disabled={referral.rewardPaid}
                          className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                        >
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-surface p-5 lg:col-span-2">
            <h2 className="text-lg font-semibold">Homepage Promo Banner</h2>
            <form onSubmit={savePromoBanner} className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <input
                value={promoText}
                onChange={(e) => setPromoText(e.target.value)}
                placeholder="Promo text shown on homepage"
                className="rounded-lg border border-black/15 px-3 py-2"
                required
              />
              <input
                type="datetime-local"
                value={promoActiveUntil}
                onChange={(e) => setPromoActiveUntil(e.target.value)}
                className="rounded-lg border border-black/15 px-3 py-2"
                title="Active until"
              />
              <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">
                Save Promo
              </button>
            </form>
          </section>
        </div>
      </div>
    </AdminGate>
  );
}
