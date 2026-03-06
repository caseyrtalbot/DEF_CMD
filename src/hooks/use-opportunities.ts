import { useQuery } from "@tanstack/react-query";
import type { Opportunity, SearchFilters } from "@/lib/types";

async function fetchOpportunities(
  filters: SearchFilters,
  limit: number,
  offset: number
): Promise<{ data: Opportunity[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.keywords) params.set("keywords", filters.keywords);
  if (filters.naicsCodes?.length) params.set("naicsCodes", filters.naicsCodes.join(","));
  if (filters.agencies?.length) params.set("agencies", filters.agencies.join(","));
  if (filters.setAsides?.length) params.set("setAsides", filters.setAsides.join(","));
  if (filters.postedFrom) params.set("postedFrom", filters.postedFrom);
  if (filters.postedTo) params.set("postedTo", filters.postedTo);
  if (filters.opportunityType) params.set("type", filters.opportunityType);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const res = await fetch(`/api/opportunities?${params}`);
  if (!res.ok) throw new Error("Failed to fetch opportunities");
  return res.json();
}

export function useOpportunities(filters: SearchFilters, limit = 25, offset = 0, enabled = false) {
  return useQuery({
    queryKey: ["opportunities", filters, limit, offset],
    queryFn: () => fetchOpportunities(filters, limit, offset),
    enabled,
  });
}
