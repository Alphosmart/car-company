import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CarDetailClient from "@/components/cars/CarDetailClient";
import { formatNaira, getCar, getCars } from "@/lib/api";

type CarDetailProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: CarDetailProps): Promise<Metadata> {
  const { id } = await params;
  const car = await getCar(id);

  if (!car) {
    return {
      title: "Car not found | Sarkin Mota Autos",
    };
  }

  const carLabel = `${car.year} ${car.make} ${car.model}`;
  const description = car.description
    ? car.description.slice(0, 150)
    : `View details for the ${carLabel} listed at ${formatNaira(car.price)}.`;
  const image = car.photos?.[0] || undefined;

  return {
    title: `${carLabel} | Sarkin Mota Autos`,
    description,
    openGraph: {
      title: `${carLabel} | Sarkin Mota Autos`,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/cars/${car.id}`,
      siteName: "Sarkin Mota Autos",
      type: "website",
      images: image ? [image] : undefined,
    },
  };
}

export default async function CarDetailPage({ params }: CarDetailProps) {
  const { id } = await params;
  const car = await getCar(id);

  if (!car) {
    notFound();
  }

  const related = await getCars({ make: car.make, limit: "4" });
  const relatedCars = related.filter((item) => item.id !== car.id).slice(0, 3);

  const vehicleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${car.year} ${car.make} ${car.model}`,
    brand: car.make,
    model: car.model,
    vehicleModelDate: String(car.year),
    color: car.color,
    fuelType: car.fuelType,
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: car.mileage,
      unitCode: "KMT",
    },
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: "NGN",
      availability:
        car.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
    image: car.photos,
    description: car.description || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd) }}
      />
      <CarDetailClient car={car} relatedCars={relatedCars} />
    </>
  );
}
