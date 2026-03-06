"use client";

import { useState } from "react";
import type { SavedOpportunity } from "@/lib/types";
import { useSavedOpportunities, useUpdateSavedOpportunity, useRemoveSavedOpportunity } from "@/hooks";
import { Panel } from "@/components/dashboard/panel";

export function SavedReferences() {
  const { data: items, isLoading, dataUpdatedAt } = useSavedOpportunities();
  const updateMutation = useUpdateSavedOpportunity();
  const removeMutation = useRemoveSavedOpportunity();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const savedItems = items ?? [];

  const handleStartEdit = (item: SavedOpportunity) => {
    setEditingId(item.id);
    setEditNotes(item.notes ?? "");
  };

  const handleSaveNotes = (id: string) => {
    updateMutation.mutate({ id, notes: editNotes });
    setEditingId(null);
  };

  return (
    <Panel title="Saved References" lastUpdated={lastUpdated} isLoading={isLoading}>
      {/* Column header */}
      <div className="flex items-center px-2.5 py-1.5 text-[10px] font-mono-data text-muted-foreground uppercase border-b border-border bg-surface-0">
        <span className="flex-1">OPPORTUNITY</span>
        <span className="w-16 text-right">{savedItems.length} SAVED</span>
      </div>
      {isLoading && savedItems.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
          Loading saved...
        </div>
      ) : savedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">No saved opportunities</span>
          <span className="text-[10px] font-mono-data">
            Search and save opportunities for reference
          </span>
        </div>
      ) : (
        <div>
          {savedItems.map((item) => (
            <div
              key={item.id}
              className="group data-row px-2.5 py-2 border-b border-border-subtle"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                    {item.title ?? item.opportunityId}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.agency && (
                      <span className="text-[11px] text-muted-foreground truncate">
                        {item.agency}
                      </span>
                    )}
                    <span className="text-[10px] font-mono-data text-muted-foreground">
                      {item.opportunityId}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="hidden group-hover:block text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit notes"
                  >
                    note
                  </button>
                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    className="hidden group-hover:block text-[10px] text-red-500 hover:text-red-400 transition-colors leading-none"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
              {editingId === item.id ? (
                <div className="mt-1.5 flex gap-1">
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveNotes(item.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 text-[11px] bg-surface-0 border border-border px-1.5 py-0.5 text-foreground focus:outline-none focus:border-signal"
                    placeholder="Add notes..."
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveNotes(item.id)}
                    className="text-[10px] text-signal hover:text-signal/80 px-1"
                  >
                    save
                  </button>
                </div>
              ) : item.notes ? (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {item.notes}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
