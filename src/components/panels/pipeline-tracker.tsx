"use client";

import { useState } from "react";
import type { PipelineItem, PipelineStage } from "@/lib/types";
import { usePipeline, useUpdatePipelineItem, useDeletePipelineItem } from "@/hooks/use-pipeline";
import { Panel } from "@/components/dashboard/panel";
import { DeadlineBadge } from "@/components/ui/deadline-badge";

const COLUMNS: { stage: PipelineStage; label: string; color: string }[] = [
  { stage: "tracking", label: "TRACK", color: "border-t-blue-500" },
  { stage: "bid_no_bid", label: "BID/NO-BID", color: "border-t-amber-500" },
  { stage: "drafting", label: "DRAFT", color: "border-t-cyan-500" },
  { stage: "submitted", label: "SUBMIT", color: "border-t-purple-500" },
  { stage: "awarded", label: "WON", color: "border-t-green-500" },
  { stage: "lost", label: "LOST", color: "border-t-red-500" },
];

export function PipelineTracker() {
  const { data: items, isLoading, dataUpdatedAt } = usePipeline();
  const updateMutation = useUpdatePipelineItem();
  const deleteMutation = useDeletePipelineItem();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const pipelineItems = items ?? [];

  const getColumnItems = (stage: PipelineStage): PipelineItem[] =>
    pipelineItems.filter((item) => item.stage === stage);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain");
    if (!itemId) return;

    const item = pipelineItems.find((i) => i.id === itemId);
    if (item && item.stage !== targetStage) {
      updateMutation.mutate({ id: itemId, stage: targetStage });
    }
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <Panel title="Pipeline" lastUpdated={lastUpdated} isLoading={isLoading}>
      {isLoading && pipelineItems.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading pipeline...
        </div>
      ) : (
        <div className="flex h-full divide-x divide-border">
          {COLUMNS.map(({ stage, label, color }) => {
            const columnItems = getColumnItems(stage);
            return (
              <div
                key={stage}
                className={`flex-1 flex flex-col min-w-0 border-t-2 ${color}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="px-2 py-1.5 border-b border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono-data font-semibold text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-[10px] font-mono-data text-muted-foreground">
                      {columnItems.length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-1 space-y-1">
                  {columnItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      className={`group relative rounded border border-border bg-card p-1.5 cursor-grab active:cursor-grabbing transition-opacity ${
                        draggedId === item.id ? "opacity-50" : ""
                      }`}
                    >
                      <p className="text-[10px] font-medium text-foreground leading-tight truncate">
                        {item.opportunityId}
                      </p>
                      {item.notes && (
                        <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
                          {item.notes}
                        </p>
                      )}
                      <div className="mt-1">
                        <DeadlineBadge deadline={item.decisionDate} />
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="absolute top-1 right-1 hidden group-hover:block text-[10px] text-red-400 hover:text-red-300 transition-colors"
                        title="Remove from pipeline"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
