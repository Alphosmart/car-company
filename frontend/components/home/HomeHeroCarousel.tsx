"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HomeCarouselSlide } from "@/lib/api";

type HomeHeroCarouselProps = {
  slides: HomeCarouselSlide[];
};

export default function HomeHeroCarousel({ slides }: HomeHeroCarouselProps) {
  const safeSlides = useMemo(() => {
    const provided = slides.filter((slide) => !!slide.url);

    if (provided.length > 0) return provided;

    return [
      {
        id: "default-sarkin-mota-video",
        url: "/assets/sarkin-mota-addressed.mp4",
        mediaType: "video" as const,
        title: "Sarkin Mota Autos Showcase",
        subtitle: "Premium rides. Trusted process. Fast delivery.",
      },
    ];
  }, [slides]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (safeSlides.length <= 1 || !isPlaying) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeSlides.length);
    }, 6000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPlaying, safeSlides.length]);

  const goToPrev = () => {
    setIndex((current) => (current - 1 + safeSlides.length) % safeSlides.length);
  };

  const goToNext = () => {
    setIndex((current) => (current + 1) % safeSlides.length);
  };

  const safeIndex = safeSlides.length > 0 ? index % safeSlides.length : 0;
  const active = safeSlides[safeIndex];
  const heroTitle = active.title || "Find your next ride with confidence";
  const heroSubtitle =
    active.subtitle || "Verified inventory, transparent pricing, and support that stays with you.";

  return (
    <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden bg-black">
      <div className="relative mx-auto min-h-[520px] w-full max-w-[1600px] sm:min-h-[580px] lg:min-h-[680px]">
        {active.mediaType === "video" ? (
          <video
            key={active.id}
            src={active.url}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay={isPlaying}
            muted
            loop
            playsInline
            controls={false}
          />
        ) : (
          <img
            key={active.id}
            src={active.url}
            alt={heroTitle}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        )}

        <div className="absolute inset-0 bg-linear-to-r from-black/72 via-black/35 to-black/25" />
        <div className="absolute inset-0 bg-linear-to-t from-black/72 via-transparent to-black/25" />
        <div className="absolute inset-x-0 top-[76px] h-px bg-white/20" />

        <div className="relative z-10 flex min-h-[520px] items-end px-6 py-16 sm:min-h-[580px] sm:px-10 lg:min-h-[680px] lg:px-16 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Featured Showcase</p>
            <h1 className="mt-4 font-[family-name:var(--font-sora)] text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-[4rem]">
              {heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-3xl">{heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/cars"
                className="inline-flex rounded-none bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-black"
              >
                Explore Inventory
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute right-4 top-4 z-20 rounded-md border border-white/20 bg-black/35 px-3 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm sm:right-6 sm:top-6">
          {String(safeIndex + 1).padStart(2, "0")} / {String(safeSlides.length).padStart(2, "0")}
        </div>

        {safeSlides.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goToPrev}
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-black/35 px-3 py-2 text-lg text-white backdrop-blur-sm transition hover:bg-black/55 sm:left-6"
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-black/35 px-3 py-2 text-lg text-white backdrop-blur-sm transition hover:bg-black/55 sm:right-6"
              aria-label="Next slide"
            >
              ›
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setIsPlaying((current) => !current)}
          className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white/35 bg-black/30 px-3 py-2 text-lg font-semibold text-white backdrop-blur-sm"
          aria-label={isPlaying ? "Pause autoplay" : "Play autoplay"}
        >
          {isPlaying ? "||" : "▶"}
        </button>

        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 px-3 py-2">
          {safeSlides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(slideIndex)}
              className={`h-1.5 rounded-full transition ${
                slideIndex === safeIndex ? "w-12 bg-white" : "w-8 bg-white/40"
              }`}
              aria-label={`Go to slide ${slideIndex + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
