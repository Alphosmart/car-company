import Link from "next/link";
import { notFound } from "next/navigation";
import LoanCalculatorClient from "@/components/tools/LoanCalculatorClient";
import ValueEstimatorClient from "@/components/tools/ValueEstimatorClient";
import HistoryCheckClient from "@/components/tools/HistoryCheckClient";
import { formatNaira, getCarsPage, getCompanyProfile } from "@/lib/api";
import { toolsPageContent } from "@/lib/navigation";

type ToolsPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}

function getParamValues(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

export default async function ToolsPage({ params, searchParams }: ToolsPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const content = toolsPageContent[slug];

  if (!content) {
    notFound();
  }

  if (slug === "ai-car-match") {
    const budget = getParamValue(query.budget);
    const condition = getParamValue(query.condition);
    const fuelType = getParamValue(query.fuelType);
    const transmission = getParamValue(query.transmission);
    const segment = getParamValue(query.segment);
    const vehicleType = getParamValue(query.vehicleType);

    const result = await getCarsPage({
      maxPrice: budget,
      condition,
      fuelType,
      transmission,
      segment,
      vehicleType,
      sort: "price_asc",
      limit: "12",
    });

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <section className="rounded-3xl border border-black/10 bg-surface p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Ownership Tools</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">AI Car Match</h1>
          <p className="mt-4 max-w-3xl text-base text-ink-muted sm:text-lg">
            Filter the inventory by budget and preferences to get smart recommendations.
          </p>

          <form className="mt-6 grid gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
            <input
              name="budget"
              type="number"
              min={0}
              defaultValue={budget}
              placeholder="Maximum budget"
              className="rounded-lg border border-black/15 px-3 py-2"
            />
            <select name="condition" title="Filter by condition" defaultValue={condition} className="rounded-lg border border-black/15 px-3 py-2">
              <option value="">Any condition</option>
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
            <select name="fuelType" title="Filter by fuel type" defaultValue={fuelType} className="rounded-lg border border-black/15 px-3 py-2">
              <option value="">Any fuel</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
            </select>
            <select name="transmission" title="Filter by transmission" defaultValue={transmission} className="rounded-lg border border-black/15 px-3 py-2">
              <option value="">Any transmission</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
            <select name="segment" title="Filter by segment" defaultValue={segment} className="rounded-lg border border-black/15 px-3 py-2">
              <option value="">Any segment</option>
              <option value="executive">Executive Class</option>
              <option value="sport-performance">Sport and Performance</option>
              <option value="luxury-suv">Luxury SUVs</option>
              <option value="daily-luxury">Daily Luxury</option>
            </select>
            <select name="vehicleType" title="Filter by vehicle type" defaultValue={vehicleType} className="rounded-lg border border-black/15 px-3 py-2">
              <option value="">Any vehicle type</option>
              <option value="car">Car</option>
              <option value="bike">Bike</option>
              <option value="van-bus">Van or Bus</option>
            </select>
            <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white lg:col-span-3">
              Find Matching Cars
            </button>
          </form>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.cars.length === 0 ? (
            <p className="text-ink-muted">No matches found for the current preferences.</p>
          ) : (
            result.cars.map((car) => (
              <Link key={car.id} href={`/cars/${car.id}`} className="rounded-2xl border border-black/10 bg-surface p-5">
                <p className="text-xs uppercase tracking-wide text-brand">Recommended Match</p>
                <h2 className="mt-2 text-xl font-semibold">{car.year} {car.make} {car.model}</h2>
                <p className="mt-2 text-lg font-bold text-brand">{formatNaira(car.price)}</p>
                <p className="mt-2 text-sm text-ink-muted">{car.condition} • {car.fuelType} • {car.transmission}</p>
                <p className="mt-1 text-xs text-ink-muted">{car.segment || car.vehicleType}</p>
              </Link>
            ))
          )}
        </section>
      </div>
    );
  }

  if (slug === "compare") {
    const carsResponse = await getCarsPage({ limit: "24", sort: "newest" });
    const selectedIds = getParamValues(query.ids).slice(0, 4);
    const selectedCars = carsResponse.cars.filter((car) => selectedIds.includes(car.id));

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <section className="rounded-3xl border border-black/10 bg-surface p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Ownership Tools</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Compare Vehicles</h1>
          <p className="mt-4 max-w-3xl text-base text-ink-muted sm:text-lg">
            Pick up to four vehicles from the inventory and compare the key specs side by side.
          </p>

          <form className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {carsResponse.cars.map((car) => (
                <label key={car.id} className="flex items-start gap-3 rounded-xl border border-black/10 p-3">
                  <input type="checkbox" name="ids" value={car.id} defaultChecked={selectedIds.includes(car.id)} className="mt-1" />
                  <span className="grid gap-1">
                    <span className="font-semibold">
                      {car.year} {car.make} {car.model}
                    </span>
                    <span className="text-xs text-ink-muted">{formatNaira(car.price)} • {car.segment || car.vehicleType}</span>
                  </span>
                </label>
              ))}
            </div>
            <button className="mt-4 rounded-lg bg-brand px-4 py-2 font-semibold text-white">
              Compare Selected Cars
            </button>
          </form>
        </section>

        <section className="mt-8 overflow-x-auto rounded-3xl border border-black/10 bg-surface p-6">
          <h2 className="text-xl font-semibold">Comparison</h2>
          {selectedCars.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Select vehicles above to view the comparison table.</p>
          ) : (
            <table className="mt-4 min-w-190 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-ink-muted">
                  <th className="py-2">Spec</th>
                  {selectedCars.map((car) => (
                    <th key={car.id} className="py-2">
                      {car.year} {car.make} {car.model}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Price", selectedCars.map((car) => formatNaira(car.price))],
                  ["Mileage", selectedCars.map((car) => `${car.mileage.toLocaleString()} km`)],
                  ["Condition", selectedCars.map((car) => car.condition)],
                  ["Fuel Type", selectedCars.map((car) => car.fuelType)],
                  ["Transmission", selectedCars.map((car) => car.transmission)],
                  ["Segment", selectedCars.map((car) => car.segment || "-")],
                  ["Type", selectedCars.map((car) => car.vehicleType)],
                ].map(([label, values]) => (
                  <tr key={String(label)} className="border-b border-black/5 align-top">
                    <td className="py-3 font-semibold">{label}</td>
                    {(values as string[]).map((value, index) => (
                      <td key={`${label}-${index}`} className="py-3">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    );
  }

  if (slug === "loan-calculator") {
    const profile = await getCompanyProfile();

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <LoanCalculatorClient config={profile.settings.finance} />
      </div>
    );
  }

  if (slug === "value-estimator") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <ValueEstimatorClient />
      </div>
    );
  }

  if (slug === "history-check") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <HistoryCheckClient />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-black/10 bg-surface p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Ownership Tools</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base text-ink-muted sm:text-lg">{content.description}</p>
        <p className="mt-6 rounded-xl border border-brand/25 bg-brand-soft/35 p-4 text-sm text-foreground">
          This page is now live in navigation. Functional workflows and API integrations are the next build step.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/contact" className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">
            Request This Tool
          </Link>
          <Link href="/cars" className="rounded-lg border border-black/15 px-4 py-2 font-semibold">
            Explore Inventory
          </Link>
        </div>
      </section>
    </div>
  );
}
