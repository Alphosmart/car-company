export type AnalyticsPeriod =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "this_month"
  | "this_year";

export type DateFilter = {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
};

export type AnalyticsOverview = {
  carsInStock: number;
  leadsToday: number;
  totalCustomers: number;
  totalPurchases: number;
  conversionRate: number;
};

export type LeadPipelineItem = {
  status: string;
  count: number;
};

export type StaffPerformanceItem = {
  id: string;
  name: string;
  email: string;
  leadsAssigned: number;
  leadsClosed: number;
  conversionRate: number;
};

export type TopCarItem = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string;
  inquiries: number;
};

export type RevenueItem = {
  month: string;
  total: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";

const buildQuery = (filter?: DateFilter) => {
  if (!filter) return "";

  const params = new URLSearchParams();

  if (filter.period) params.set("period", filter.period);
  if (filter.startDate) params.set("startDate", filter.startDate);
  if (filter.endDate) params.set("endDate", filter.endDate);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const getJson = async <T>(path: string, token: string, filter?: DateFilter): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}${buildQuery(filter)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Analytics request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const fetchAnalyticsOverview = (token: string, filter?: DateFilter) =>
  getJson<AnalyticsOverview>("/api/analytics/overview", token, filter);

export const fetchLeadPipeline = (token: string, filter?: DateFilter) =>
  getJson<LeadPipelineItem[]>("/api/analytics/leads/pipeline", token, filter);

export const fetchTopCars = (token: string) =>
  getJson<TopCarItem[]>("/api/analytics/cars/top", token);

export const fetchStaffPerformance = (token: string) =>
  getJson<StaffPerformanceItem[]>("/api/analytics/staff/performance", token);

export const fetchRevenue = (token: string, filter?: DateFilter) =>
  getJson<RevenueItem[]>("/api/analytics/revenue", token, filter);
