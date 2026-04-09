"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";
import { CompanySettings, defaultCompanySettings } from "@/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

type SettingsPayload = {
  settings?: CompanySettings;
};

const emptyTestimonial = { name: "", text: "" };

export default function AdminSettingsPage() {
  const [token, setToken] = useState("");
  const [settings, setSettings] = useState<CompanySettings>(defaultCompanySettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const existingToken = window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";
    setToken(existingToken);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/company`, { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as SettingsPayload;
        if (payload.settings) {
          setSettings({
            ...defaultCompanySettings,
            ...payload.settings,
            finance: { ...defaultCompanySettings.finance, ...payload.settings.finance },
            contact: { ...defaultCompanySettings.contact, ...payload.settings.contact },
            homepage: {
              trustCards: payload.settings.homepage?.trustCards?.length
                ? payload.settings.homepage.trustCards
                : defaultCompanySettings.homepage.trustCards,
              testimonials: payload.settings.homepage?.testimonials?.length
                ? payload.settings.homepage.testimonials
                : defaultCompanySettings.homepage.testimonials,
            },
            social: { ...defaultCompanySettings.social, ...payload.settings.social },
          });
        }
      } catch {
        // fall back to defaults
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const canSave = useMemo(() => token.length > 0, [token]);

  function updateTrustCard(index: number, key: "label" | "value", value: string) {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        trustCards: current.homepage.trustCards.map((card, cardIndex) =>
          cardIndex === index ? { ...card, [key]: value } : card,
        ),
      },
    }));
  }

  function updateTestimonial(index: number, key: "name" | "text", value: string) {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        testimonials: current.homepage.testimonials.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [key]: value } : item,
        ),
      },
    }));
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/company/admin/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to save settings");
      }

      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminGate>
      <div className="py-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="mt-2 text-sm text-ink-muted">Manage loan defaults, contact details, homepage cards, testimonials, and social links.</p>
        </div>

        {loading ? <p className="mt-4 text-sm text-ink-muted">Loading settings...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}

        <form onSubmit={saveSettings} className="mt-6 grid gap-6">
          <SettingsSection title="Loan Defaults">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <NumberField label="Default Price" value={settings.finance.defaultPrice} onChange={(value) => setSettings((current) => ({ ...current, finance: { ...current.finance, defaultPrice: value } }))} />
              <NumberField label="Default Down Payment" value={settings.finance.defaultDownPayment} onChange={(value) => setSettings((current) => ({ ...current, finance: { ...current.finance, defaultDownPayment: value } }))} />
              <NumberField label="Default Months" value={settings.finance.defaultMonths} onChange={(value) => setSettings((current) => ({ ...current, finance: { ...current.finance, defaultMonths: value } }))} />
              <NumberField label="Annual Interest Rate %" value={settings.finance.defaultAnnualRate} onChange={(value) => setSettings((current) => ({ ...current, finance: { ...current.finance, defaultAnnualRate: value } }))} />
            </div>
            <TextAreaField label="Loan Disclaimer" value={settings.finance.disclaimer} onChange={(value) => setSettings((current) => ({ ...current, finance: { ...current.finance, disclaimer: value } }))} />
          </SettingsSection>

          <SettingsSection title="Contact Details">
            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="Phone" value={settings.contact.phone} onChange={(value) => setSettings((current) => ({ ...current, contact: { ...current.contact, phone: value } }))} />
              <TextField label="Email" value={settings.contact.email} onChange={(value) => setSettings((current) => ({ ...current, contact: { ...current.contact, email: value } }))} />
              <TextField label="Address" value={settings.contact.address} onChange={(value) => setSettings((current) => ({ ...current, contact: { ...current.contact, address: value } }))} />
              <TextField label="Hours" value={settings.contact.hours} onChange={(value) => setSettings((current) => ({ ...current, contact: { ...current.contact, hours: value } }))} />
              <TextField label="WhatsApp Number" value={settings.contact.whatsappNumber} onChange={(value) => setSettings((current) => ({ ...current, contact: { ...current.contact, whatsappNumber: value } }))} />
              <TextField label="WhatsApp Message" value={settings.contact.whatsappMessage} onChange={(value) => setSettings((current) => ({ ...current, contact: { ...current.contact, whatsappMessage: value } }))} />
            </div>
            <TextAreaField label="Map Embed URL" value={settings.contact.mapEmbedUrl} onChange={(value) => setSettings((current) => ({ ...current, contact: { ...current.contact, mapEmbedUrl: value } }))} />
          </SettingsSection>

          <SettingsSection title="Homepage Trust Cards">
            <div className="grid gap-3 md:grid-cols-2">
              {settings.homepage.trustCards.map((card, index) => (
                <div key={`${card.label}-${index}`} className="rounded-2xl border border-black/10 bg-white p-4">
                  <TextField label="Label" value={card.label} onChange={(value) => updateTrustCard(index, "label", value)} />
                  <div className="mt-3">
                    <TextField label="Value" value={card.value} onChange={(value) => updateTrustCard(index, "value", value)} />
                  </div>
                </div>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Testimonials">
            <div className="grid gap-3 md:grid-cols-3">
              {settings.homepage.testimonials.map((testimonial, index) => (
                <div key={`${testimonial.name}-${index}`} className="rounded-2xl border border-black/10 bg-white p-4">
                  <TextField label="Name" value={testimonial.name} onChange={(value) => updateTestimonial(index, "name", value)} />
                  <div className="mt-3">
                    <TextAreaField label="Text" value={testimonial.text} onChange={(value) => updateTestimonial(index, "text", value)} rows={5} />
                  </div>
                </div>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Social Links">
            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="X" value={settings.social.x} onChange={(value) => setSettings((current) => ({ ...current, social: { ...current.social, x: value } }))} />
              <TextField label="YouTube" value={settings.social.youtube} onChange={(value) => setSettings((current) => ({ ...current, social: { ...current.social, youtube: value } }))} />
              <TextField label="Facebook" value={settings.social.facebook} onChange={(value) => setSettings((current) => ({ ...current, social: { ...current.social, facebook: value } }))} />
              <TextField label="TikTok" value={settings.social.tiktok} onChange={(value) => setSettings((current) => ({ ...current, social: { ...current.social, tiktok: value } }))} />
              <TextField label="Instagram" value={settings.social.instagram} onChange={(value) => setSettings((current) => ({ ...current, social: { ...current.social, instagram: value } }))} />
            </div>
          </SettingsSection>

          <button
            type="submit"
            disabled={!canSave || saving}
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </AdminGate>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-surface p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value || 0))} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="rounded-lg border border-black/15 px-3 py-2 font-normal" />
    </label>
  );
}