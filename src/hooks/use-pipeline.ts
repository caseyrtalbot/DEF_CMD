import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PipelineItem, PipelineStage } from "@/lib/types";

async function fetchPipeline(): Promise<PipelineItem[]> {
  const res = await fetch("/api/pipeline");
  if (!res.ok) throw new Error("Failed to fetch pipeline");
  return res.json();
}

export function usePipeline() {
  return useQuery({
    queryKey: ["pipeline"],
    queryFn: fetchPipeline,
  });
}

export function useAddToPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ opportunityId, stage }: { opportunityId: string; stage?: PipelineStage }) => {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId, stage }),
      });
      if (!res.ok) throw new Error("Failed to add to pipeline");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}

export function useUpdatePipelineItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; stage?: PipelineStage; notes?: string; decisionDate?: string; tags?: string[] }) => {
      const res = await fetch(`/api/pipeline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update pipeline item");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}

export function useDeletePipelineItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pipeline/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete pipeline item");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}
