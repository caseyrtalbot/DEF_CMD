import { useQuery } from "@tanstack/react-query";
import type { FederalRegisterDocument } from "@/lib/types";

interface FederalRegisterFilters {
  type?: string;
  dateFrom?: string;
  keyword?: string;
}

async function fetchDocuments(
  filters: FederalRegisterFilters
): Promise<{ data: FederalRegisterDocument[] }> {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.keyword) params.set("keyword", filters.keyword);

  const res = await fetch(`/api/federal-register?${params}`);
  if (!res.ok) throw new Error("Failed to fetch Federal Register documents");
  return res.json();
}

export function useFederalRegister(
  filters: FederalRegisterFilters = {},
  enabled = false
) {
  return useQuery({
    queryKey: ["federal-register", filters],
    queryFn: () => fetchDocuments(filters),
    enabled,
  });
}
