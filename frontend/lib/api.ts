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
  vehicleType: string;
  segment?: string | null;
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
  vehicleType?: string;
  segment?: string;
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

export type CompanyFinanceSettings = {
  defaultPrice: number;
  defaultDownPayment: number;
  defaultMonths: number;
  defaultAnnualRate: number;
  disclaimer: string;
};

export type CompanyContactSettings = {
  phone: string;
  email: string;
  address: string;
  hours: string;
  whatsappNumber: string;
  whatsappMessage: string;
  mapEmbedUrl: string;
};

export type CompanyHomepageTrustCard = {
  label: string;
  value: string;
};

export type CompanyHomepageTestimonial = {
  name: string;
  text: string;
};

export type CompanyHomepageSettings = {
  trustCards: CompanyHomepageTrustCard[];
  testimonials: CompanyHomepageTestimonial[];
};

export type CompanySocialSettings = {
  x: string;
  youtube: string;
  facebook: string;
  tiktok: string;
  instagram: string;
};

export type CompanySettings = {
  finance: CompanyFinanceSettings;
  contact: CompanyContactSettings;
  homepage: CompanyHomepageSettings;
  social: CompanySocialSettings;
};

export type CompanyTeamMember = {
  name: string;
  role: string;
};

export type CompanyProfile = {
  yearsInBusiness: number;
  carsSold: number;
  happyCustomers: number;
  citiesServed: number;
  team: CompanyTeamMember[];
  heroSlides: HomeCarouselSlide[];
  settings: CompanySettings;
};

export type HomeCarouselSlide = {
  id: string;
  url: string;
  mediaType: "image" | "video";
  title: string;
  subtitle: string;
  description?: string;
};

export const defaultCompanySettings: CompanySettings = {
  finance: {
    defaultPrice: 45000000,
    defaultDownPayment: 9000000,
    defaultMonths: 36,
    defaultAnnualRate: 22,
    disclaimer: "Use this to compare financing scenarios before you reach out to the sales team.",
  },
  contact: {
    phone: "+234 801 234 5678",
    email: "info@sarkinmotaautos.com",
    address: "Central Area, Abuja",
    hours: "Mon-Sat, 9:00AM - 6:00PM",
    whatsappNumber: "09133225255",
    whatsappMessage: "Hi, I would like to ask about your available cars.",
    mapEmbedUrl: "https://maps.google.com/maps?q=Abuja%20Nigeria&t=&z=13&ie=UTF8&iwloc=&output=embed",
  },
  homepage: {
    trustCards: [
      { label: "Years in Business", value: "8+" },
      { label: "Cars Sold", value: "1,200+" },
      { label: "Verified Listings", value: "100%" },
      { label: "After-Sales Support", value: "Dedicated" },
    ],
    testimonials: [
      {
        name: "Mariam S.",
        text: "The team gave me full service history before I paid. The process was transparent and fast.",
      },
      {
        name: "Tunde A.",
        text: "I got a clean Toyota in two days, and the after-sales support has been excellent.",
      },
      {
        name: "Ngozi O.",
        text: "They helped me compare options within my budget and arranged a smooth test drive.",
      },
    ],
  },
  social: {
    x: "https://x.com/SarkinMota_AMF",
    youtube: "https://www.youtube.com/@SarkinMota-24",
    facebook: "https://www.facebook.com/profile.php?id=61586026326682",
    tiktok: "https://www.tiktok.com/@alamin_sarkinmota",
    instagram: "https://www.instagram.com/p/DWpTtVQjYUS/",
  },
};

function normalizeCompanySettings(rawSettings: unknown): CompanySettings {
  if (!rawSettings || typeof rawSettings !== "object") {
    return defaultCompanySettings;
  }

  const source = rawSettings as Partial<CompanySettings> & {
    finance?: Partial<CompanyFinanceSettings>;
    contact?: Partial<CompanyContactSettings>;
    homepage?: Partial<CompanyHomepageSettings>;
    social?: Partial<CompanySocialSettings>;
  };

  const financeSource = (source.finance || {}) as CompanyFinanceSettings;
  const contactSource = (source.contact || {}) as CompanyContactSettings;
  const homepageSource = (source.homepage || {}) as CompanyHomepageSettings;
  const socialSource = (source.social || {}) as CompanySocialSettings;

  const trustCards = Array.isArray(homepageSource.trustCards)
    ? homepageSource.trustCards
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const label = typeof item.label === "string" ? item.label.trim() : "";
          const value = typeof item.value === "string" ? item.value.trim() : "";
          if (!label || !value) return null;
          return { label, value };
        })
        .filter(Boolean)
    : defaultCompanySettings.homepage.trustCards;

  const testimonials = Array.isArray(homepageSource.testimonials)
    ? homepageSource.testimonials
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const name = typeof item.name === "string" ? item.name.trim() : "";
          const text = typeof item.text === "string" ? item.text.trim() : "";
          if (!name || !text) return null;
          return { name, text };
        })
        .filter(Boolean)
    : defaultCompanySettings.homepage.testimonials;

  return {
    finance: {
      defaultPrice: Number(financeSource.defaultPrice ?? defaultCompanySettings.finance.defaultPrice),
      defaultDownPayment: Number(financeSource.defaultDownPayment ?? defaultCompanySettings.finance.defaultDownPayment),
      defaultMonths: Number(financeSource.defaultMonths ?? defaultCompanySettings.finance.defaultMonths),
      defaultAnnualRate: Number(financeSource.defaultAnnualRate ?? defaultCompanySettings.finance.defaultAnnualRate),
      disclaimer: typeof financeSource.disclaimer === "string" && financeSource.disclaimer.trim()
        ? financeSource.disclaimer.trim()
        : defaultCompanySettings.finance.disclaimer,
    },
    contact: {
      phone: typeof contactSource.phone === "string" && contactSource.phone.trim()
        ? contactSource.phone.trim()
        : defaultCompanySettings.contact.phone,
      email: typeof contactSource.email === "string" && contactSource.email.trim()
        ? contactSource.email.trim()
        : defaultCompanySettings.contact.email,
      address: typeof contactSource.address === "string" && contactSource.address.trim()
        ? contactSource.address.trim()
        : defaultCompanySettings.contact.address,
      hours: typeof contactSource.hours === "string" && contactSource.hours.trim()
        ? contactSource.hours.trim()
        : defaultCompanySettings.contact.hours,
      whatsappNumber: typeof contactSource.whatsappNumber === "string" && contactSource.whatsappNumber.trim()
        ? contactSource.whatsappNumber.trim()
        : defaultCompanySettings.contact.whatsappNumber,
      whatsappMessage: typeof contactSource.whatsappMessage === "string" && contactSource.whatsappMessage.trim()
        ? contactSource.whatsappMessage.trim()
        : defaultCompanySettings.contact.whatsappMessage,
      mapEmbedUrl: typeof contactSource.mapEmbedUrl === "string" && contactSource.mapEmbedUrl.trim()
        ? contactSource.mapEmbedUrl.trim()
        : defaultCompanySettings.contact.mapEmbedUrl,
    },
    homepage: {
      trustCards: (trustCards as CompanyHomepageTrustCard[]) || defaultCompanySettings.homepage.trustCards,
      testimonials: (testimonials as CompanyHomepageTestimonial[]) || defaultCompanySettings.homepage.testimonials,
    },
    social: {
      x: typeof socialSource.x === "string" && socialSource.x.trim() ? socialSource.x.trim() : defaultCompanySettings.social.x,
      youtube: typeof socialSource.youtube === "string" && socialSource.youtube.trim() ? socialSource.youtube.trim() : defaultCompanySettings.social.youtube,
      facebook: typeof socialSource.facebook === "string" && socialSource.facebook.trim() ? socialSource.facebook.trim() : defaultCompanySettings.social.facebook,
      tiktok: typeof socialSource.tiktok === "string" && socialSource.tiktok.trim() ? socialSource.tiktok.trim() : defaultCompanySettings.social.tiktok,
      instagram: typeof socialSource.instagram === "string" && socialSource.instagram.trim() ? socialSource.instagram.trim() : defaultCompanySettings.social.instagram,
    },
  };
}

function normalizeHomeCarouselSlide(item: unknown): HomeCarouselSlide | null {
  if (!item || typeof item !== "object") return null;

  const slide = item as Partial<HomeCarouselSlide>;
  const id = typeof slide.id === "string" ? slide.id : "";
  const url = typeof slide.url === "string" ? slide.url : "";
  const mediaType = slide.mediaType === "video" ? "video" : "image";
  const title = typeof slide.title === "string" ? slide.title : "";
  const subtitle = typeof slide.subtitle === "string" ? slide.subtitle : "";
  const description = typeof slide.description === "string" ? slide.description : undefined;

  if (!id || !url) return null;

  return {
    id,
    url,
    mediaType,
    title,
    subtitle,
    ...(description ? { description } : {}),
  };
}

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

export async function getCompanyProfile(): Promise<CompanyProfile> {
  try {
    const response = await fetch(withBase("/api/company"), {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        yearsInBusiness: 8,
        carsSold: 1200,
        happyCustomers: 900,
        citiesServed: 12,
        team: [],
        heroSlides: [],
        settings: defaultCompanySettings,
      };
    }

    const payload = (await response.json()) as Partial<CompanyProfile>;

    const heroSlides = Array.isArray(payload.heroSlides)
      ? payload.heroSlides
          .map(normalizeHomeCarouselSlide)
          .filter((slide): slide is HomeCarouselSlide => slide !== null)
      : [];

    const settings = normalizeCompanySettings((payload as { settings?: unknown }).settings);

    return {
      yearsInBusiness: Number(payload.yearsInBusiness ?? 8),
      carsSold: Number(payload.carsSold ?? 1200),
      happyCustomers: Number(payload.happyCustomers ?? 900),
      citiesServed: Number(payload.citiesServed ?? 12),
      team: Array.isArray(payload.team)
        ? payload.team.filter((member): member is CompanyTeamMember => {
            return (
              typeof member === "object" &&
              member !== null &&
              typeof member.name === "string" &&
              typeof member.role === "string"
            );
          })
        : [],
      heroSlides,
      settings,
    };
  } catch {
    return {
      yearsInBusiness: 8,
      carsSold: 1200,
      happyCustomers: 900,
      citiesServed: 12,
      team: [],
      heroSlides: [],
      settings: defaultCompanySettings,
    };
  }
}

export async function getHomeCarouselSlides(): Promise<HomeCarouselSlide[]> {
  const profile = await getCompanyProfile();
  return profile.heroSlides;
}
