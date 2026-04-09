"use client";

import { useEffect, useMemo, useState } from "react";
import type { HomeCarouselSlide } from "@/lib/api";

type HomeHeroCarouselProps = {
  slides: HomeCarouselSlide[];
};

export default function HomeHeroCarousel({ slides }: HomeHeroCarouselProps) {
  const safeSlides = useMemo(() => slides.filter((slide) => !!slide.url), [slides]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeSlides.length);
    }, 5500);

    return () => {
      window.clearInterval(timer);
    };
  }, [safeSlides.length]);

  if (safeSlides.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-brand-soft/50 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Homepage media</p>
        <p className="mt-3 text-sm text-ink-muted">
          Add image or video slides from the admin panel to display your latest promos here.
        </p>
      </div>
    );
  }

  const safeIndex = safeSlides.length > 0 ? index % safeSlides.length : 0;
  const active = safeSlides[safeIndex];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-black">
      <div className="relative aspect-video w-full">
        {active.mediaType === "video" ? (
          <video
            key={active.id}
            src={active.url}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            controls={false}
          />
        ) : (
          <img
            key={active.id}
            src={active.url}
            alt={active.title || "Homepage carousel slide"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/30 to-transparent p-4">
          {active.title ? <p className="text-base font-semibold text-white">{active.title}</p> : null}
          {active.subtitle ? <p className="mt-1 text-sm text-white/85">{active.subtitle}</p> : null}
        </div>
      </div>

      {safeSlides.length > 1 ? (
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          {safeSlides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(slideIndex)}
              className={`h-2.5 rounded-full transition ${
                slideIndex === safeIndex ? "w-7 bg-white" : "w-2.5 bg-white/45"
              }`}
              aria-label={`Go to slide ${slideIndex + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
