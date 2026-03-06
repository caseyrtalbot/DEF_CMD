import { useQuery } from "@tanstack/react-query";
import type { RegulationDocument } from "@/lib/types";

interface RegulationFilters {
  keyword?: string;
  documentType?: string;
  agency?: string;
}

async function fetchRegulations(
  filters: RegulationFilters
): Promise<{ data: RegulationDocument[] }> {
  const params = new URLSearchParams();
  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.documentType) params.set("documentType", filters.documentType);
  if (filters.agency) params.set("agency", filters.agency);

  const res = await fetch(`/api/regulations?${params}`);
  if (!res.ok) throw new Error("Failed to fetch regulations");
  return res.json();
}

export function useRegulations(
  filters: RegulationFilters = {},
  enabled = false
) {
  return useQuery({
    queryKey: ["regulations", filters],
    queryFn: () => fetchRegulations(filters),
    enabled,
  });
}
