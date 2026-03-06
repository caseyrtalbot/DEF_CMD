import { useQuery } from "@tanstack/react-query";
import type { SbirTopic } from "@/lib/types";

interface SbirFilters {
  keyword?: string;
  agency?: string;
  status?: string;
}

async function fetchSbirTopics(
  filters: SbirFilters
): Promise<{ data: SbirTopic[] }> {
  const params = new URLSearchParams();
  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.agency) params.set("agency", filters.agency);
  if (filters.status) params.set("status", filters.status);

  const res = await fetch(`/api/sbir?${params}`);
  if (!res.ok) throw new Error("Failed to fetch SBIR topics");
  return res.json();
}

export function useSbirTopics(filters: SbirFilters = {}, enabled = false) {
  return useQuery({
    queryKey: ["sbir-topics", filters],
    queryFn: () => fetchSbirTopics(filters),
    enabled,
  });
}
