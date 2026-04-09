"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";

type HeroSlide = {
  id: string;
  url: string;
  mediaType: "image" | "video";
  title: string;
  subtitle: string;
};

type CompanyPayload = {
  heroSlides?: HeroSlide[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

export default function AdminHomeCarouselPage() {
  const [token, setToken] = useState("");
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const existingToken =
      window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";

    setToken(existingToken);
  }, []);

  const canSave = useMemo(() => token.length > 0, [token.length]);

  const loadSlides = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/company`, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Failed to load carousel (${response.status})`);
      }

      const payload = (await response.json()) as CompanyPayload;

      setSlides(Array.isArray(payload.heroSlides) ? payload.heroSlides : []);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to load carousel";
      setError(text);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSlides();
  }, [loadSlides]);

  function moveSlide(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;

    setSlides((current) => {
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }

  function removeSlide(id: string) {
    setSlides((current) => current.filter((item) => item.id !== id));
  }

  function updateSlide(id: string, key: "title" | "subtitle", value: string) {
    setSlides((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          [key]: value,
        };
      })
    );
  }

  async function uploadMedia() {
    if (!token || selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("media", file));

      const response = await fetch(`${API_BASE}/api/company/admin/hero-slides`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const payloadError = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payloadError?.error || "Upload failed");
      }

      const payload = (await response.json()) as CompanyPayload;
      setSlides(Array.isArray(payload.heroSlides) ? payload.heroSlides : []);
      setSelectedFiles([]);
      setMessage("Media uploaded. You can now edit captions or reorder slides.");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Upload failed";
      setError(text);
    } finally {
      setUploading(false);
    }
  }

  async function saveChanges() {
    if (!token) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/company/admin/hero-slides`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ heroSlides: slides }),
      });

      if (!response.ok) {
        const payloadError = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payloadError?.error || "Failed to save carousel changes");
      }

      const payload = (await response.json()) as CompanyPayload;
      setSlides(Array.isArray(payload.heroSlides) ? payload.heroSlides : []);
      setMessage("Homepage carousel updated successfully.");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to save carousel changes";
      setError(text);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminGate>
      <div className="py-3">
        <div>
          <h1 className="text-2xl font-bold">Homepage Carousel</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Upload images or videos for the homepage slider, edit captions, and reorder display.
          </p>
        </div>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}

        <section className="mt-6 rounded-2xl border border-black/10 bg-surface p-5">
          <h2 className="text-lg font-semibold">Upload Media</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Supports images and videos. Files upload to your configured Cloudinary account.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="grid gap-1 text-sm font-semibold">
              Select files
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
                className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-normal"
              />
            </label>
            <button
              type="button"
              onClick={uploadMedia}
              disabled={uploading || selectedFiles.length === 0 || !token}
              className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-black/10 bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Slides ({slides.length})</h2>
            <button
              type="button"
              onClick={saveChanges}
              disabled={saving || !canSave}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save Carousel Changes"}
            </button>
          </div>

          {loading ? <p className="mt-4 text-sm text-ink-muted">Loading slides...</p> : null}

          {!loading && slides.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No slides yet. Upload media to get started.</p>
          ) : (
            <div className="mt-4 grid gap-4">
              {slides.map((slide, index) => (
                <article key={slide.id} className="rounded-xl border border-black/10 bg-white p-3">
                  <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
                    <div className="overflow-hidden rounded-lg border border-black/10 bg-black">
                      {slide.mediaType === "video" ? (
                        <video src={slide.url} className="h-44 w-full object-cover" muted controls />
                      ) : (
                        <img src={slide.url} alt={slide.title || "Slide preview"} className="h-44 w-full object-cover" loading="lazy" />
                      )}
                    </div>

                    <div className="grid gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Slide {index + 1} • {slide.mediaType}
                      </p>
                      <label className="grid gap-1 text-sm font-semibold">
                        Title
                        <input
                          value={slide.title}
                          onChange={(event) => updateSlide(slide.id, "title", event.target.value)}
                          className="rounded-lg border border-black/15 px-3 py-2 font-normal"
                          placeholder="Optional slide title"
                        />
                      </label>
                      <label className="grid gap-1 text-sm font-semibold">
                        Subtitle
                        <input
                          value={slide.subtitle}
                          onChange={(event) => updateSlide(slide.id, "subtitle", event.target.value)}
                          className="rounded-lg border border-black/15 px-3 py-2 font-normal"
                          placeholder="Optional slide subtitle"
                        />
                      </label>

                      <div className="mt-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => moveSlide(index, -1)}
                          disabled={index === 0}
                          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                        >
                          Move Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSlide(index, 1)}
                          disabled={index === slides.length - 1}
                          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                        >
                          Move Down
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSlide(slide.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminGate>
  );
}
