import { useQuery } from "@tanstack/react-query";
import type { ProductServiceCode } from "@/lib/types";

interface PscFilters {
  searchText?: string;
  code?: string;
}

async function fetchPSCCodes(
  filters: PscFilters
): Promise<{ data: ProductServiceCode[] }> {
  const params = new URLSearchParams();
  if (filters.searchText) params.set("searchText", filters.searchText);
  if (filters.code) params.set("code", filters.code);

  const res = await fetch(`/api/psc?${params}`);
  if (!res.ok) throw new Error("Failed to fetch PSC codes");
  return res.json();
}

export function usePSCCodes(filters: PscFilters = {}, enabled = false) {
  return useQuery({
    queryKey: ["psc-codes", filters],
    queryFn: () => fetchPSCCodes(filters),
    enabled,
  });
}
