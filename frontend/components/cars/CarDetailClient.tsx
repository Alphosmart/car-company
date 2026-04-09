"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import InquiryForm from "@/components/forms/InquiryForm";
import { formatNaira, type Car } from "@/lib/api";

type CarDetailClientProps = {
  car: Car;
  relatedCars: Car[];
};

export default function CarDetailClient({ car, relatedCars }: CarDetailClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [testDriveOpen, setTestDriveOpen] = useState(false);
  const [testDriveName, setTestDriveName] = useState("");
  const [testDrivePhone, setTestDrivePhone] = useState("");
  const [testDriveEmail, setTestDriveEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [testDriveMessage, setTestDriveMessage] = useState("");
  const [submittingTestDrive, setSubmittingTestDrive] = useState(false);
  const [testDriveError, setTestDriveError] = useState<string | null>(null);
  const [testDriveSuccess, setTestDriveSuccess] = useState<string | null>(null);
  const [depositPercent, setDepositPercent] = useState(20);
  const [annualInterestPercent, setAnnualInterestPercent] = useState(18);
  const [tenureMonths, setTenureMonths] = useState(36);

  const carLabel = `${car.year} ${car.make} ${car.model}`;
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "09133225255";
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";
  const photos = car.photos?.length > 0 ? car.photos : ["", "", ""];

  const loanEstimate = useMemo(() => {
    const safeDeposit = Math.min(Math.max(depositPercent, 0), 99);
    const safeMonths = Math.max(tenureMonths, 1);
    const monthlyRate = Math.max(annualInterestPercent, 0) / 100 / 12;
    const deposit = car.price * (safeDeposit / 100);
    const principal = car.price - deposit;
    const payment =
      monthlyRate === 0
        ? principal / safeMonths
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, safeMonths)) /
          (Math.pow(1 + monthlyRate, safeMonths) - 1);

    return {
      deposit,
      principal,
      payment,
      months: safeMonths,
    };
  }, [annualInterestPercent, car.price, depositPercent, tenureMonths]);

  const openWhatsAppForTestDrive = () => {
    const text = encodeURIComponent(
      `Hi, I want to book a test drive for the ${carLabel}. My name is ${testDriveName || "[Your name]"}, phone ${testDrivePhone || "[Your phone]"}, preferred date: ${preferredDate || "[date]"}.`
    );
    window.open(`https://wa.me/${waNumber}?text=${text}`, "_blank", "noreferrer");
  };

  const submitTestDrive = async () => {
    if (!testDriveName.trim() || !testDrivePhone.trim()) {
      setTestDriveError("Name and phone number are required.");
      return;
    }

    setSubmittingTestDrive(true);
    setTestDriveError(null);
    setTestDriveSuccess(null);

    try {
      const response = await fetch(`${apiBase}/api/test-drives`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: testDriveName.trim(),
          phone: testDrivePhone.trim(),
          email: testDriveEmail.trim() || undefined,
          carId: car.id,
          preferredDate: preferredDate || undefined,
          message: testDriveMessage.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to submit booking request");
      }

      setTestDriveSuccess("Booking request received. Our team will contact you shortly.");
      setTestDriveName("");
      setTestDrivePhone("");
      setTestDriveEmail("");
      setPreferredDate("");
      setTestDriveMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit booking request";
      setTestDriveError(message);
    } finally {
      setSubmittingTestDrive(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
      <section className="rounded-2xl border border-black/10 bg-surface p-5">
        <p className="text-xs uppercase tracking-wide text-ink-muted">{car.status}</p>
        <h1 className="mt-2 text-3xl font-bold">{carLabel}</h1>
        <p className="mt-3 text-2xl font-bold text-brand">{formatNaira(car.price)}</p>

        <div className="mt-5">
          <div className="aspect-16/10 overflow-hidden rounded-2xl border border-black/10 bg-brand-soft/40">
            {photos[activeIndex] ? (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="h-full w-full"
                title="Open image preview"
              >
                <Image
                  src={photos[activeIndex]}
                  alt={`${carLabel} photo ${activeIndex + 1}`}
                  width={1200}
                  height={750}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              </button>
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-ink-muted">
                No photos uploaded yet. Use the admin inventory page to add Cloudinary images.
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {photos.map((photo, index) => (
              <button
                key={`${photo || "placeholder"}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-20 w-24 shrink-0 overflow-hidden rounded-xl border ${
                  activeIndex === index ? "border-brand" : "border-black/10"
                } bg-white`}
              >
                {photo ? (
                  <Image
                    src={photo}
                    alt={`${carLabel} thumbnail ${index + 1}`}
                    width={240}
                    height={160}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-ink-muted">Photo</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Condition" value={car.condition} />
          <Info label="Mileage" value={`${car.mileage.toLocaleString()} km`} />
          <Info label="Fuel Type" value={car.fuelType} />
          <Info label="Transmission" value={car.transmission} />
          <Info label="Color" value={car.color} />
          <Info label="Year" value={String(car.year)} />
        </div>

        {car.description ? <p className="mt-6 text-ink-muted">{car.description}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
              `Hi, I'm interested in the ${carLabel} listed for ${formatNaira(car.price)}. Is it still available?`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-brand px-5 py-3 font-semibold text-white"
          >
            Ask on WhatsApp
          </a>
          <button
            type="button"
            onClick={() => {
              setTestDriveError(null);
              setTestDriveSuccess(null);
              setTestDriveOpen(true);
            }}
            className="rounded-lg border border-black/15 px-5 py-3 font-semibold"
          >
            Book a Test Drive
          </button>
        </div>

        <section className="mt-8 rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">Loan Calculator</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium">
              Deposit (%)
              <input
                type="number"
                min={0}
                max={99}
                value={depositPercent}
                onChange={(event) => setDepositPercent(Number(event.target.value || 0))}
                className="rounded-lg border border-black/15 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Annual Interest (%)
              <input
                type="number"
                min={0}
                step="0.1"
                value={annualInterestPercent}
                onChange={(event) => setAnnualInterestPercent(Number(event.target.value || 0))}
                className="rounded-lg border border-black/15 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Tenure (months)
              <input
                type="number"
                min={1}
                value={tenureMonths}
                onChange={(event) => setTenureMonths(Number(event.target.value || 1))}
                className="rounded-lg border border-black/15 px-3 py-2"
              />
            </label>
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            <p>Estimated deposit: {formatNaira(loanEstimate.deposit)}</p>
            <p>Estimated financed amount: {formatNaira(loanEstimate.principal)}</p>
            <p>Estimated monthly payment: {formatNaira(loanEstimate.payment)}</p>
            <p>
              Based on {depositPercent}% deposit, {loanEstimate.months} months, and {annualInterestPercent}% annual interest.
            </p>
          </div>
        </section>

        {relatedCars.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xl font-semibold">Related Cars</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCars.map((relatedCar) => (
                <Link
                  key={relatedCar.id}
                  href={`/cars/${relatedCar.id}`}
                  className="rounded-2xl border border-black/10 bg-white p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-ink-muted">{relatedCar.status}</p>
                  <h3 className="mt-1 font-semibold">
                    {relatedCar.year} {relatedCar.make} {relatedCar.model}
                  </h3>
                  <p className="mt-2 font-bold text-brand">{formatNaira(relatedCar.price)}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <aside>
        <InquiryForm carId={car.id} carLabel={carLabel} />
      </aside>

      {testDriveOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Book a Test Drive</h2>
              <button type="button" onClick={() => setTestDriveOpen(false)} className="text-sm font-semibold text-ink-muted">
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <input
                value={testDriveName}
                onChange={(event) => setTestDriveName(event.target.value)}
                placeholder="Your name"
                className="rounded-lg border border-black/15 px-3 py-2"
              />
              <input
                value={testDrivePhone}
                onChange={(event) => setTestDrivePhone(event.target.value)}
                placeholder="Phone number"
                className="rounded-lg border border-black/15 px-3 py-2"
              />
              <input
                type="email"
                value={testDriveEmail}
                onChange={(event) => setTestDriveEmail(event.target.value)}
                placeholder="Email (optional)"
                className="rounded-lg border border-black/15 px-3 py-2"
              />
              <input
                type="date"
                value={preferredDate}
                onChange={(event) => setPreferredDate(event.target.value)}
                title="Preferred date"
                className="rounded-lg border border-black/15 px-3 py-2"
              />
              <textarea
                value={testDriveMessage}
                onChange={(event) => setTestDriveMessage(event.target.value)}
                placeholder="Any extra details (optional)"
                rows={3}
                className="rounded-lg border border-black/15 px-3 py-2"
              />
              {testDriveError ? <p className="text-sm text-red-700">{testDriveError}</p> : null}
              {testDriveSuccess ? <p className="text-sm text-green-700">{testDriveSuccess}</p> : null}
              <button
                type="button"
                onClick={submitTestDrive}
                disabled={submittingTestDrive}
                className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70"
              >
                {submittingTestDrive ? "Submitting..." : "Submit Booking"}
              </button>
              <p className="text-center text-xs text-ink-muted">or</p>
              <button
                type="button"
                onClick={openWhatsAppForTestDrive}
                className="rounded-lg border border-black/15 px-4 py-2 font-semibold"
              >
                Continue on WhatsApp
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {lightboxOpen && photos[activeIndex] ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4">
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-2 top-2 rounded bg-black/60 px-3 py-1 text-sm font-semibold text-white"
            >
              Close
            </button>
            <Image
              src={photos[activeIndex]}
              alt={`${carLabel} enlarged photo ${activeIndex + 1}`}
              width={1800}
              height={1200}
              unoptimized
              className="h-auto max-h-[85vh] w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-ink-muted">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
