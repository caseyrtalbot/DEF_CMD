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
  if (filters.opportunityType) params.set("type", filters.opportunityType);
  if (filters.psc) params.set("psc", filters.psc);
  if (filters.state) params.set("state", filters.state);
  if (filters.dueBefore) params.set("dueBefore", filters.dueBefore);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
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
