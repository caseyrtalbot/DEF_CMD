import type { SpendingRecord, SpendingByTime } from "@/lib/types";

const BASE_URL = "https://api.usaspending.gov/api/v2";

interface TimePeriod {
  start_date: string;
  end_date: string;
  date_type?: string;
}

interface SpendingFilters {
  time_period: TimePeriod[];
  agencies?: { type: string; tier: string; name: string }[];
  naics_codes?: string[];
}

interface SpendingCategoryRequest {
  filters: SpendingFilters;
  category?: string;
  page?: number;
  limit?: number;
}

interface SpendingOverTimeRequest {
  filters: SpendingFilters;
  group: "month" | "quarter" | "fiscal_year";
  page?: number;
  limit?: number;
}

interface SpendingCategoryResult {
  id: number | string | null;
  name: string;
  code: string;
  amount: number;
}

interface SpendingCategoryResponse {
  results: SpendingCategoryResult[];
  page_metadata: {
    page: number;
    total: number;
    limit: number;
    hasNext: boolean;
  };
}

interface SpendingOverTimeResult {
  time_period: {
    fiscal_year: string;
    month?: string;
    quarter?: string;
  };
  aggregated_amount: number;
}

interface SpendingOverTimeResponse {
  results: SpendingOverTimeResult[];
  page_metadata: {
    page: number;
    total: number;
    limit: number;
    hasNext: boolean;
  };
}

async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `USASpending API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

function normalizeSpendingRecord(raw: SpendingCategoryResult): SpendingRecord {
  return {
    id: String(raw.id ?? ""),
    name: raw.name ?? "",
    code: raw.code ?? "",
    amount: raw.amount ?? 0,
  };
}

function normalizeSpendingByTime(raw: SpendingOverTimeResult): SpendingByTime {
  const tp = raw.time_period;
  let period = tp.fiscal_year;
  if (tp.quarter) {
    period = `${tp.fiscal_year} Q${tp.quarter}`;
  } else if (tp.month) {
    period = `${tp.fiscal_year}-${tp.month.padStart(2, "0")}`;
  }

  return {
    period,
    amount: raw.aggregated_amount ?? 0,
  };
}

export async function getSpendingByAgency(
  timePeriods: TimePeriod[],
  page = 1,
  limit = 10
): Promise<{ data: SpendingRecord[]; total: number; hasMore: boolean }> {
  const body: SpendingCategoryRequest = {
    filters: { time_period: timePeriods },
    page,
    limit,
  };

  const response = await postJson<SpendingCategoryResponse>(
    "/search/spending_by_category/awarding_agency",
    body
  );

  return {
    data: response.results.map(normalizeSpendingRecord),
    total: response.page_metadata.total,
    hasMore: response.page_metadata.hasNext,
  };
}

export async function getSpendingByNaics(
  timePeriods: TimePeriod[],
  page = 1,
  limit = 10
): Promise<{ data: SpendingRecord[]; total: number; hasMore: boolean }> {
  const body: SpendingCategoryRequest = {
    filters: { time_period: timePeriods },
    page,
    limit,
  };

  const response = await postJson<SpendingCategoryResponse>(
    "/search/spending_by_category/naics",
    body
  );

  return {
    data: response.results.map(normalizeSpendingRecord),
    total: response.page_metadata.total,
    hasMore: response.page_metadata.hasNext,
  };
}

export async function getSpendingOverTime(
  timePeriods: TimePeriod[],
  group: "month" | "quarter" | "fiscal_year" = "month",
  page = 1,
  limit = 12
): Promise<{ data: SpendingByTime[]; total: number; hasMore: boolean }> {
  const body: SpendingOverTimeRequest = {
    filters: { time_period: timePeriods },
    group,
    page,
    limit,
  };

  const response = await postJson<SpendingOverTimeResponse>(
    "/search/spending_over_time/",
    body
  );

  return {
    data: response.results.map(normalizeSpendingByTime),
    total: response.page_metadata.total,
    hasMore: response.page_metadata.hasNext,
  };
}

export interface AwardSpendingFilters {
  timePeriods: TimePeriod[];
  agencies?: string[];
  naicsCodes?: string[];
}

export async function searchAwardSpending(
  filters: AwardSpendingFilters,
  page = 1,
  limit = 25
): Promise<{ data: SpendingRecord[]; total: number; hasMore: boolean }> {
  const spendingFilters: SpendingFilters = {
    time_period: filters.timePeriods,
  };

  if (filters.naicsCodes?.length) {
    spendingFilters.naics_codes = filters.naicsCodes;
  }

  if (filters.agencies?.length) {
    spendingFilters.agencies = filters.agencies.map((name) => ({
      type: "awarding",
      tier: "toptier",
      name,
    }));
  }

  const body: SpendingCategoryRequest = {
    filters: spendingFilters,
    page,
    limit,
  };

  const response = await postJson<SpendingCategoryResponse>(
    "/search/spending_by_category/awarding_agency",
    body
  );

  return {
    data: response.results.map(normalizeSpendingRecord),
    total: response.page_metadata.total,
    hasMore: response.page_metadata.hasNext,
  };
}
