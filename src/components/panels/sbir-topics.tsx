"use client";

import { useState, useCallback } from "react";
import { Panel } from "@/components/dashboard/panel";
import { useSbirTopics } from "@/hooks/use-sbir";
import type { SbirTopic } from "@/lib/types";

type StatusFilter = "open" | "closed" | "all";

const STATUS_TOGGLES: { label: string; value: StatusFilter }[] = [
  { label: "OPEN", value: "open" },
  { label: "CLOSED", value: "closed" },
  { label: "ALL", value: "all" },
];

function closeDateColor(closeDate: string | null): string {
  if (!closeDate) return "text-muted-foreground";
  const close = new Date(closeDate);
  const now = new Date();
  const diffMs = close.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "text-muted-foreground";
  if (diffDays <= 30) return "text-data-amber";
  return "text-data-green";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

interface SbirTopicsProps {
  enabled?: boolean;
}

export function SbirTopics({ enabled }: SbirTopicsProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters = {
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isFetching, dataUpdatedAt, refetch } =
    useSbirTopics(filters, searchTriggered && enabled);

  const handleSearch = useCallback(() => {
    if (searchTriggered) {
      refetch();
    } else {
      setSearchTriggered(true);
    }
  }, [searchTriggered, refetch]);

  const topics: SbirTopic[] = data?.data ?? [];
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <Panel
      title="SBIR/STTR"
      lastUpdated={lastUpdated}
      isLoading={isLoading || isFetching}
      actions={
        <div className="flex items-center gap-0.5">
          {STATUS_TOGGLES.map((st) => (
            <button
              key={st.value}
              onClick={() => setStatusFilter(st.value)}
              className={`px-1.5 py-0.5 text-[10px] font-mono-data font-semibold transition-colors ${
                statusFilter === st.value
                  ? "text-signal bg-signal"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {st.label}
            </button>
          ))}
          <button
            onClick={handleSearch}
            disabled={isFetching || !enabled}
            className="ml-1.5 px-2 py-0.5 text-[10px] font-mono-data font-bold bg-signal text-signal-foreground hover:bg-signal/90 disabled:opacity-50 transition-colors"
          >
            {isFetching ? "..." : searchTriggered ? "REFRESH" : "SEARCH"}
          </button>
          {topics.length > 0 && (
            <span className="ml-1 text-[10px] font-mono-data text-muted-foreground">
              {topics.length}
            </span>
          )}
        </div>
      }
    >
      {!searchTriggered && topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Press SEARCH to query SBIR/STTR topics</span>
          <span className="text-[10px] font-mono-data">
            DoD R&D investment signals
          </span>
        </div>
      ) : isLoading && topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Querying SBIR topics...</span>
        </div>
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">No topics found</span>
          <span className="text-[10px] font-mono-data">
            Adjust filters and search again
          </span>
        </div>
      ) : (
        <div>
          {/* Column header */}
          <div className="flex items-center px-2.5 py-1.5 text-[10px] font-mono-data text-muted-foreground uppercase border-b border-border bg-surface-0">
            <span className="w-10">PROG</span>
            <span className="flex-1 ml-1">TOPIC / AGENCY</span>
            <span className="w-12 text-right">PHASE</span>
            <span className="w-20 text-right">CLOSE</span>
          </div>

          <div className="overflow-y-auto flex-1">
            {topics.map((topic) => (
              <button
                key={topic.topicNumber}
                onClick={() =>
                  setExpandedId(
                    topic.topicNumber === expandedId
                      ? null
                      : topic.topicNumber
                  )
                }
                className="data-row w-full text-left px-2.5 py-2 border-b border-border-subtle"
              >
                <div className="flex items-start gap-1">
                  <span
                    className={`text-[10px] font-mono-data font-bold w-10 shrink-0 ${
                      topic.program === "SBIR"
                        ? "text-data-cyan"
                        : "text-data-purple"
                    }`}
                  >
                    {topic.program}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                      {topic.topicTitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {topic.branch}
                      {topic.agency ? ` — ${topic.agency}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono-data text-muted-foreground w-12 text-right shrink-0">
                    {topic.phase || "--"}
                  </span>
                  <span
                    className={`text-[11px] font-mono-data w-20 text-right shrink-0 ${closeDateColor(
                      topic.closeDate
                    )}`}
                  >
                    {formatDate(topic.closeDate)}
                  </span>
                </div>

                {/* Expanded topic detail */}
                {expandedId === topic.topicNumber && (
                  <div className="mt-2 border-t border-border pt-2 space-y-2">
                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-muted-foreground">
                        <span className="text-signal font-bold">TOPIC</span>{" "}
                        {topic.topicNumber}
                      </span>
                      {topic.solicitation && (
                        <span className="text-muted-foreground">
                          <span className="text-signal font-bold">SOL</span>{" "}
                          {topic.solicitation}
                        </span>
                      )}
                      {topic.openDate && (
                        <span className="text-muted-foreground">
                          <span className="text-signal font-bold">OPEN</span>{" "}
                          {formatDate(topic.openDate)}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {topic.description && (
                      <p className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {topic.description}
                      </p>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
