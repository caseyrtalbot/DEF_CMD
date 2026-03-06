import { useQuery } from "@tanstack/react-query";
import type { ContractAward } from "@/lib/types";
import type { ContractAwardFilters } from "@/lib/api/contract-awards";

async function fetchContractAwards(
  filters: ContractAwardFilters,
  limit: number,
  offset: number
): Promise<{ data: ContractAward[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.agencies?.length) params.set("agencies", filters.agencies.join(","));
  if (filters.naicsCode) params.set("naicsCode", filters.naicsCode);
  if (filters.vendorName) params.set("vendorName", filters.vendorName);
  if (filters.dateSignedFrom) params.set("dateSignedFrom", filters.dateSignedFrom);
  if (filters.dateSignedTo) params.set("dateSignedTo", filters.dateSignedTo);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const res = await fetch(`/api/awards?${params}`);
  if (!res.ok) throw new Error("Failed to fetch contract awards");
  return res.json();
}

export function useContractAwards(
  filters: ContractAwardFilters,
  limit = 25,
  offset = 0,
  enabled = false
) {
  return useQuery({
    queryKey: ["contract-awards", filters, limit, offset],
    queryFn: () => fetchContractAwards(filters, limit, offset),
    enabled,
  });
}
