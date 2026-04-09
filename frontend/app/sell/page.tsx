import Link from "next/link";
import { megaMenuGroups } from "@/lib/navigation";

const sellGroup = megaMenuGroups.find((group) => group.id === "sell-swap");

export default function SellLandingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-black/10 bg-surface p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Sell or Swap</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Sell and Swap Hub</h1>
        <p className="mt-4 max-w-3xl text-base text-ink-muted sm:text-lg">
          Start a vehicle sale, request a swap, get an instant estimate or review your seller dashboard.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sellGroup?.items.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-2xl border border-black/10 bg-surface p-5 transition hover:border-brand/40 hover:shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Sell or Swap</p>
            <h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{item.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
