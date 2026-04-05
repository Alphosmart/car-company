"use client";

import { FormEvent, useState } from "react";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <h1 className="mt-3 font-[family-name:var(--font-sora)] text-3xl font-bold sm:text-4xl">
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
            <p><span className="font-semibold">Phone:</span> +234 801 234 5678</p>
            <p><span className="font-semibold">Email:</span> info@sarkinmotaautos.com</p>
            <p><span className="font-semibold">Address:</span> Plot 14, Auto Market Road, Abuja</p>
            <p><span className="font-semibold">Hours:</span> Mon-Sat, 9:00AM - 6:00PM</p>
          </div>
          <a
            href="https://wa.me/2348012345678?text=Hi%20Sarkin%20Mota%20Autos%2C%20I%20need%20help%20finding%20a%20car"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block rounded-lg border border-black/15 px-4 py-2 font-semibold"
          >
            Chat on WhatsApp
          </a>

          <div className="mt-5 overflow-hidden rounded-2xl border border-black/10">
            <iframe
              title="Sarkin Mota Autos contact map"
              src="https://maps.google.com/maps?q=Abuja%20Nigeria&t=&z=13&ie=UTF8&iwloc=&output=embed"
              className="h-[250px] w-full"
              loading="lazy"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
