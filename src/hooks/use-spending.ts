import { useQuery } from "@tanstack/react-query";
import type { SpendingRecord, SpendingByTime } from "@/lib/types";

async function fetchSpending(
  view: "agency" | "naics" | "time",
  startDate: string,
  endDate: string
): Promise<{ data: SpendingRecord[] | SpendingByTime[] }> {
  const params = new URLSearchParams({ view, startDate, endDate });
  const res = await fetch(`/api/spending?${params}`);
  if (!res.ok) throw new Error("Failed to fetch spending");
  return res.json();
}

export function useSpending(
  view: "agency" | "naics" | "time" = "agency",
  startDate = "2025-10-01",
  endDate = new Date().toISOString().split("T")[0]
) {
  return useQuery({
    queryKey: ["spending", view, startDate, endDate],
    queryFn: () => fetchSpending(view, startDate, endDate),
    refetchInterval: 5 * 60 * 1000,
  });
}
