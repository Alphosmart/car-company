import Link from "next/link";
import HomeHeroCarousel from "@/components/home/HomeHeroCarousel";
import { formatNaira, getCars, getCompanyProfile, getPromoBanner } from "@/lib/api";

export default async function Home() {
  const featuredCars = await getCars({ featured: "true", limit: "6" });
  const profile = await getCompanyProfile();
  const promo = await getPromoBanner();
  const heroSlides = profile.heroSlides;
  const trustCards = profile.settings.homepage.trustCards;
  const testimonials = profile.settings.homepage.testimonials;
  const contactSettings = profile.settings.contact;

  return (
    <>
      <HomeHeroCarousel slides={heroSlides} />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        {promo.text ? (
          <section className="mb-6 rounded-2xl border border-brand/30 bg-brand-soft p-4">
            <p className="text-sm font-semibold text-foreground">{promo.text}</p>
          </section>
        ) : null}

        <section className="rounded-3xl bg-surface p-7 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
            Find your car faster
          </p>
          <h2 className="mt-3 max-w-3xl font-(family-name:--font-sora) text-3xl font-bold leading-tight sm:text-4xl">
            Filter by make, condition, and budget to shortlist the right options.
          </h2>
          <form action="/cars" className="mt-6 grid gap-2 rounded-2xl border border-black/10 bg-white p-3 sm:grid-cols-4">
            <input
              name="make"
              placeholder="Make"
              className="rounded-lg border border-black/15 px-3 py-2"
            />
            <select name="condition" className="rounded-lg border border-black/15 px-3 py-2" title="Condition">
              <option value="">Any condition</option>
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
            <input
              name="maxPrice"
              type="number"
              min={0}
              placeholder="Max budget (NGN)"
              className="rounded-lg border border-black/15 px-3 py-2"
            />
            <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">
              Search Cars
            </button>
          </form>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustCards.map((card) => (
            <TrustCard key={card.label} label={card.label} value={card.value} />
          ))}
        </section>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured Cars</h2>
          <Link href="/cars" className="text-sm font-semibold text-brand">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCars.length === 0 ? (
            <p className="text-ink-muted">No featured cars yet.</p>
          ) : (
            featuredCars.map((car) => (
              <Link
                key={car.id}
                href={`/cars/${car.id}`}
                className="rounded-2xl border border-black/10 bg-surface p-4"
              >
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  {car.condition}
                </p>
                <h3 className="mt-2 text-lg font-semibold">
                  {car.year} {car.make} {car.model}
                </h3>
                <p className="mt-2 text-xl font-bold text-brand">
                  {formatNaira(car.price)}
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  {car.mileage.toLocaleString()} km • {car.transmission}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-black/10 bg-surface p-6 sm:p-8">
        <h2 className="text-2xl font-bold">What customers are saying</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-sm text-ink-muted">&quot;{item.text}&quot;</p>
              <p className="mt-3 text-sm font-semibold">{item.name}</p>
            </article>
          ))}
        </div>
      </section>

        <section className="mt-10 rounded-3xl border border-black/10 bg-brand-soft p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Looking for a specific car?</h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Tell us your budget, preferred make, and model. Our team will source available options for you.
          </p>
          <a
            href={`https://wa.me/${contactSettings.whatsappNumber}?text=${encodeURIComponent(contactSettings.whatsappMessage)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block rounded-lg bg-brand px-5 py-3 font-semibold text-white"
          >
            Request on WhatsApp
          </a>
        </section>
      </div>
    </>
  );
}

function TrustCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-black/10 bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </article>
  );
}
