import Link from "next/link";

export default function NewsEventsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-black/10 bg-surface p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">News and Events</p>
        <h1 className="mt-3 font-(family-name:--font-sora) text-3xl font-bold sm:text-5xl">
          Latest announcements, launches and community activities.
        </h1>
        <p className="mt-4 max-w-3xl text-base text-ink-muted sm:text-lg">
          Stay updated on inventory arrivals, special campaigns, educational guides and event highlights.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-black/10 bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">News</p>
          <h2 className="mt-2 text-xl font-semibold">Market updates and inventory announcements</h2>
          <p className="mt-2 text-sm text-ink-muted">
            This section is ready for CMS or API-powered content.
          </p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Events</p>
          <h2 className="mt-2 text-xl font-semibold">Community meetups and showcase drives</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Event scheduling and registrations can be integrated in the next build cycle.
          </p>
        </article>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/blog" className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">
          Read Blog
        </Link>
        <Link href="/contact" className="rounded-lg border border-black/15 px-4 py-2 font-semibold">
          Contact Team
        </Link>
      </div>
    </div>
  );
}
