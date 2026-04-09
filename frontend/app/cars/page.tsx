import Link from "next/link";
import { formatNaira, getCarsPage } from "@/lib/api";

type CarsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CarsPage({ searchParams }: CarsPageProps) {
  const params = await searchParams;
  const make = typeof params.make === "string" ? params.make : "";
  const status = typeof params.status === "string" ? params.status : "";
  const condition = typeof params.condition === "string" ? params.condition : "";
  const fuelType = typeof params.fuelType === "string" ? params.fuelType : "";
  const transmission = typeof params.transmission === "string" ? params.transmission : "";
  const segment = typeof params.segment === "string" ? params.segment : "";
  const vehicleType = typeof params.vehicleType === "string" ? params.vehicleType : "";
  const minPrice = typeof params.minPrice === "string" ? params.minPrice : "";
  const maxPrice = typeof params.maxPrice === "string" ? params.maxPrice : "";
  const minYear = typeof params.minYear === "string" ? params.minYear : "";
  const maxYear = typeof params.maxYear === "string" ? params.maxYear : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const parsedPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const result = await getCarsPage({
    make,
    status,
    condition,
    fuelType,
    transmission,
    segment,
    vehicleType,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    sort: sort === "price_asc" || sort === "price_desc" ? sort : "newest",
    page: String(page),
    limit: "12",
  });
  const cars = result.cars;
  const totalPages = result.pagination.pages || 1;

  const makeHref = (targetPage: number) => {
    const query = new URLSearchParams();
    if (make) query.set("make", make);
    if (status) query.set("status", status);
    if (condition) query.set("condition", condition);
    if (fuelType) query.set("fuelType", fuelType);
    if (transmission) query.set("transmission", transmission);
    if (segment) query.set("segment", segment);
    if (vehicleType) query.set("vehicleType", vehicleType);
    if (minPrice) query.set("minPrice", minPrice);
    if (maxPrice) query.set("maxPrice", maxPrice);
    if (minYear) query.set("minYear", minYear);
    if (maxYear) query.set("maxYear", maxYear);
    if (sort) query.set("sort", sort);
    query.set("page", String(targetPage));
    return `/cars?${query.toString()}`;
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Inventory</h1>
      <p className="mt-2 text-ink-muted">Find available vehicles and compare options.</p>

      <form className="mt-6 grid gap-3 rounded-2xl border border-black/10 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="make"
          defaultValue={make}
          placeholder="Filter by make"
          className="rounded-lg border border-black/15 px-3 py-2"
        />
        <select
          name="condition"
          defaultValue={condition}
          title="Filter by condition"
          className="rounded-lg border border-black/15 px-3 py-2"
        >
          <option value="">Any condition</option>
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>
        <select
          name="fuelType"
          defaultValue={fuelType}
          title="Filter by fuel type"
          className="rounded-lg border border-black/15 px-3 py-2"
        >
          <option value="">Any fuel type</option>
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
          <option value="hybrid">Hybrid</option>
          <option value="electric">Electric</option>
        </select>
        <select
          name="transmission"
          defaultValue={transmission}
          title="Filter by transmission"
          className="rounded-lg border border-black/15 px-3 py-2"
        >
          <option value="">Any transmission</option>
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
        </select>
        <select
          name="status"
          defaultValue={status}
          title="Filter cars by status"
          className="rounded-lg border border-black/15 px-3 py-2"
        >
          <option value="">Any status</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>
        <select
          name="segment"
          defaultValue={segment}
          title="Filter by vehicle segment"
          className="rounded-lg border border-black/15 px-3 py-2"
        >
          <option value="">Any segment</option>
          <option value="executive">Executive Class</option>
          <option value="sport-performance">Sport and Performance</option>
          <option value="luxury-suv">Luxury SUVs</option>
          <option value="daily-luxury">Daily Luxury</option>
        </select>
        <select
          name="vehicleType"
          defaultValue={vehicleType}
          title="Filter by vehicle type"
          className="rounded-lg border border-black/15 px-3 py-2"
        >
          <option value="">Any vehicle type</option>
          <option value="car">Car</option>
          <option value="bike">Bike</option>
          <option value="van-bus">Van or Bus</option>
        </select>
        <input
          name="minPrice"
          defaultValue={minPrice}
          type="number"
          min={0}
          placeholder="Min price (NGN)"
          className="rounded-lg border border-black/15 px-3 py-2"
        />
        <input
          name="maxPrice"
          defaultValue={maxPrice}
          type="number"
          min={0}
          placeholder="Max price (NGN)"
          className="rounded-lg border border-black/15 px-3 py-2"
        />
        <input
          name="minYear"
          defaultValue={minYear}
          type="number"
          min={1980}
          placeholder="Min year"
          className="rounded-lg border border-black/15 px-3 py-2"
        />
        <input
          name="maxYear"
          defaultValue={maxYear}
          type="number"
          min={1980}
          placeholder="Max year"
          className="rounded-lg border border-black/15 px-3 py-2"
        />
        <select
          name="sort"
          defaultValue={sort}
          title="Sort inventory"
          className="rounded-lg border border-black/15 px-3 py-2"
        >
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white lg:col-span-2">
          Apply filters
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cars.length === 0 ? (
          <p className="text-ink-muted">No cars match these filters.</p>
        ) : (
          cars.map((car) => (
            <Link
              key={car.id}
              href={`/cars/${car.id}`}
              className="rounded-2xl border border-black/10 bg-surface p-4"
            >
              <p
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
                  car.status === "available"
                    ? "bg-green-100 text-green-800"
                    : car.status === "sold"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                }`}
              >
                {car.status}
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {car.year} {car.make} {car.model}
              </h2>
              <p className="mt-2 text-xl font-bold text-brand">{formatNaira(car.price)}</p>
              <p className="mt-2 text-sm text-ink-muted">
                {car.fuelType} • {car.transmission} • {car.mileage.toLocaleString()} km
              </p>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Link
            href={makeHref(Math.max(page - 1, 1))}
            className={`rounded-lg border px-3 py-2 text-sm ${
              page <= 1 ? "pointer-events-none border-black/10 text-ink-muted" : "border-black/20"
            }`}
          >
            Previous
          </Link>
          <span className="text-sm text-ink-muted">
            Page {page} of {totalPages}
          </span>
          <Link
            href={makeHref(Math.min(page + 1, totalPages))}
            className={`rounded-lg border px-3 py-2 text-sm ${
              page >= totalPages ? "pointer-events-none border-black/10 text-ink-muted" : "border-black/20"
            }`}
          >
            Next
          </Link>
        </div>
      ) : null}
    </div>
  );
}
