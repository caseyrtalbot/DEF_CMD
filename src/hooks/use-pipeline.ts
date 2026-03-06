import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavedOpportunity } from "@/lib/types";

async function fetchSaved(): Promise<SavedOpportunity[]> {
  const res = await fetch("/api/pipeline");
  if (!res.ok) throw new Error("Failed to fetch saved opportunities");
  return res.json();
}

export function useSavedOpportunities() {
  return useQuery({
    queryKey: ["saved-opportunities"],
    queryFn: fetchSaved,
  });
}

export function useSaveOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ opportunityId, title, agency, notes }: { opportunityId: string; title?: string; agency?: string; notes?: string }) => {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId, title, agency, notes }),
      });
      if (!res.ok) throw new Error("Failed to save opportunity");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-opportunities"] }),
  });
}

export function useUpdateSavedOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await fetch(`/api/pipeline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to update saved opportunity");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-opportunities"] }),
  });
}

export function useRemoveSavedOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pipeline/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove saved opportunity");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-opportunities"] }),
  });
}
