import { useQuery } from "@tanstack/react-query";
import type { Award } from "@/lib/types";

async function fetchAwards(filters: {
  naicsCode?: string;
  agency?: string;
  vendor?: string;
}): Promise<{ data: Award[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.naicsCode) params.set("naicsCode", filters.naicsCode);
  if (filters.agency) params.set("agency", filters.agency);
  if (filters.vendor) params.set("vendor", filters.vendor);

  const res = await fetch(`/api/awards?${params}`);
  if (!res.ok) throw new Error("Failed to fetch awards");
  return res.json();
}

export function useAwards(filters: { naicsCode?: string; agency?: string; vendor?: string } = {}) {
  return useQuery({
    queryKey: ["awards", filters],
    queryFn: () => fetchAwards(filters),
    refetchInterval: 5 * 60 * 1000,
  });
}
