"use client";

import { FormEvent, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    grecaptcha?: {
      getResponse: () => string;
    };
  }
}

type InquiryFormProps = {
  carId: string;
  carLabel: string;
};

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

export default function InquiryForm({ carId, carLabel }: InquiryFormProps) {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("Hi, I am interested in this car.");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      message,
      carId,
      source: "website",
      referralCode: searchParams.get("ref") || undefined,
      recaptchaToken: typeof window !== "undefined" && window.grecaptcha ? window.grecaptcha.getResponse() : "",
    };

    if (recaptchaSiteKey && !payload.recaptchaToken) {
      setFeedback("Please complete the reCAPTCHA challenge before submitting.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit inquiry");
      }

      setFeedback("Inquiry submitted. Our sales team will contact you shortly.");
      event.currentTarget.reset();
      setMessage(`Hi, I'm interested in the ${carLabel}.`);
    } catch {
      setFeedback("We could not submit your inquiry right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4">
      {recaptchaSiteKey ? (
        <Script src="https://www.google.com/recaptcha/api.js" async defer />
      ) : null}
      <h3 className="text-lg font-semibold">Send an Inquiry</h3>
      <input
        name="name"
        required
        placeholder="Your full name"
        className="rounded-lg border border-black/15 px-3 py-2"
      />
      <input
        name="phone"
        required
        placeholder="Phone number"
        className="rounded-lg border border-black/15 px-3 py-2"
      />
      <input
        name="email"
        type="email"
        placeholder="Email (optional)"
        className="rounded-lg border border-black/15 px-3 py-2"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your message"
        title="Inquiry message"
        rows={4}
        className="rounded-lg border border-black/15 px-3 py-2"
      />
      <button
        disabled={isSubmitting}
        className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70"
      >
        {isSubmitting ? "Submitting..." : "Submit Inquiry"}
      </button>
      {recaptchaSiteKey ? <div className="g-recaptcha" data-sitekey={recaptchaSiteKey} /> : null}
      {feedback ? <p className="text-sm text-ink-muted">{feedback}</p> : null}
    </form>
  );
}
