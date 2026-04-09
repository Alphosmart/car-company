import Link from "next/link";
import { notFound } from "next/navigation";
import SellDashboardClient from "@/components/sell/SellDashboardClient";
import SellRequestClient from "@/components/sell/SellRequestClient";
import { sellPageContent } from "@/lib/navigation";

type SellPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SellPage({ params }: SellPageProps) {
  const { slug } = await params;
  const content = sellPageContent[slug];

  if (!content) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      {slug === "dashboard" ? (
        <SellDashboardClient />
      ) : slug === "sell-your-vehicle" ? (
        <SellRequestClient
          title={content.title}
          description={content.description}
          requestType="Sell Your Vehicle"
          dashboardKey="sell-dashboard-requests"
        />
      ) : slug === "trade-in-swap" ? (
        <SellRequestClient
          title={content.title}
          description={content.description}
          requestType="Trade-In / Swap"
          dashboardKey="sell-dashboard-requests"
        />
      ) : slug === "instant-valuation" ? (
        <SellRequestClient
          title={content.title}
          description={content.description}
          requestType="Instant Valuation"
          dashboardKey="sell-dashboard-requests"
        />
      ) : (
        <section className="rounded-3xl border border-black/10 bg-surface p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Sell or Swap</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{content.title}</h1>
          <p className="mt-4 max-w-3xl text-base text-ink-muted sm:text-lg">{content.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">
              Contact Team
            </Link>
            <Link href="/cars" className="rounded-lg border border-black/15 px-4 py-2 font-semibold">
              Browse Available Cars
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
