"use client";

import { FormEvent, useEffect, useState } from "react";
import { defaultCompanySettings } from "@/lib/api";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactSettings, setContactSettings] = useState(defaultCompanySettings.contact);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${apiBase}/api/company`, { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { settings?: { contact?: typeof defaultCompanySettings.contact } };
        if (payload.settings?.contact) {
          setContactSettings({ ...defaultCompanySettings.contact, ...payload.settings.contact });
        }
      } catch {
        // fall back to defaults
      }
    };

    void loadSettings();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      subject: String(form.get("subject") || ""),
      message: String(form.get("message") || ""),
    };

    try {
      const response = await fetch(`${apiBase}/api/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setSent(true);
      event.currentTarget.reset();
    } catch {
      setError("Message could not be sent right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl border border-black/10 bg-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Contact</p>
          <h1 className="mt-3 font-(family-name:--font-sora) text-3xl font-bold sm:text-4xl">
            Let us help you find the right car
          </h1>
          <form onSubmit={submit} className="mt-6 grid gap-3">
            <input name="name" required placeholder="Your name" className="rounded-lg border border-black/15 px-3 py-2" />
            <input name="phone" required placeholder="Phone number" className="rounded-lg border border-black/15 px-3 py-2" />
            <input name="email" type="email" placeholder="Email" className="rounded-lg border border-black/15 px-3 py-2" />
            <input name="subject" placeholder="Subject" className="rounded-lg border border-black/15 px-3 py-2" />
            <textarea name="message" rows={5} required placeholder="Message" className="rounded-lg border border-black/15 px-3 py-2" />
            <button disabled={submitting} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70">{submitting ? "Sending..." : "Send Message"}</button>
            {sent ? <p className="text-sm text-ink-muted">Message received. We will reach out soon.</p> : null}
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </form>
        </section>

        <section className="rounded-3xl border border-black/10 bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Visit or Call</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <p><span className="font-semibold">Phone:</span> {contactSettings.phone}</p>
            <p><span className="font-semibold">Email:</span> {contactSettings.email}</p>
            <p><span className="font-semibold">Address:</span> {contactSettings.address}</p>
            <p><span className="font-semibold">Hours:</span> {contactSettings.hours}</p>
          </div>
          <a
            href={`https://wa.me/${contactSettings.whatsappNumber}?text=${encodeURIComponent(contactSettings.whatsappMessage)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block rounded-lg border border-black/15 px-4 py-2 font-semibold"
          >
            Chat on WhatsApp
          </a>

          <div className="mt-5 overflow-hidden rounded-2xl border border-black/10">
            <iframe
              title="Sarkin Mota Autos contact map"
              src={contactSettings.mapEmbedUrl}
              className="h-62.5 w-full"
              loading="lazy"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
