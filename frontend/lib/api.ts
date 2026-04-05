export type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  condition: string;
  fuelType: string;
  transmission: string;
  color: string;
  description?: string | null;
  status: string;
  photos: string[];
  featured: boolean;
  createdAt: string;
};

export type CarQueryParams = {
  make?: string;
  status?: string;
  condition?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxYear?: string;
  featured?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: string;
  limit?: string;
};

export type CarsResponse = {
  cars: Car[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

function withBase(path: string): string {
  return `${apiBase}${path}`;
}

export async function getCars(params?: Record<string, string>): Promise<Car[]> {
  const payload = await getCarsPage(params);
  return payload.cars;
}

export async function getCarsPage(params?: CarQueryParams): Promise<CarsResponse> {
  try {
    const url = new URL(withBase("/api/cars"));
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
    }

    const response = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!response.ok) {
      return {
        cars: [],
        pagination: {
          page: Number(params?.page || 1),
          limit: Number(params?.limit || 12),
          total: 0,
          pages: 0,
        },
      };
    }

    const payload = await response.json();
    return {
      cars: payload.cars || [],
      pagination: payload.pagination || {
        page: Number(params?.page || 1),
        limit: Number(params?.limit || 12),
        total: 0,
        pages: 0,
      },
    };
  } catch {
    return {
      cars: [],
      pagination: {
        page: Number(params?.page || 1),
        limit: Number(params?.limit || 12),
        total: 0,
        pages: 0,
      },
    };
  }
}

export async function getCar(id: string): Promise<Car | null> {
  try {
    const response = await fetch(withBase(`/api/cars/${id}`), {
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export function formatNaira(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export type PromoBanner = {
  text: string | null;
  activeUntil: string | null;
};

export async function getPromoBanner(): Promise<PromoBanner> {
  try {
    const response = await fetch(withBase("/api/public/promo-banner"), {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return { text: null, activeUntil: null };
    }

    const payload = (await response.json()) as PromoBanner;
    return {
      text: payload.text || null,
      activeUntil: payload.activeUntil || null,
    };
  } catch {
    return { text: null, activeUntil: null };
  }
}
