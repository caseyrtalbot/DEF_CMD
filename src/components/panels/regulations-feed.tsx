"use client";

import { useState, useCallback } from "react";
import { Panel } from "@/components/dashboard/panel";
import { useRegulations } from "@/hooks/use-regulations";
import type { RegulationDocument } from "@/lib/types";

const TYPE_FILTERS = [
  { label: "ALL", value: undefined },
  { label: "RULE", value: "Rule" },
  { label: "PROPOSED", value: "Proposed Rule" },
  { label: "NOTICE", value: "Notice" },
] as const;

const TYPE_COLORS: Record<RegulationDocument["type"], string> = {
  Rule: "text-data-green",
  "Proposed Rule": "text-data-amber",
  Notice: "text-data-blue",
  Other: "text-muted-foreground",
};

const TYPE_LABELS: Record<RegulationDocument["type"], string> = {
  Rule: "RULE",
  "Proposed Rule": "PROP",
  Notice: "NOTC",
  Other: "OTHR",
};

function isCommentsOpen(commentsDue: string | null): boolean {
  if (!commentsDue) return false;
  return new Date(commentsDue) > new Date();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}

interface RegulationsFeedProps {
  enabled?: boolean;
}

export function RegulationsFeed({ enabled: _enabled }: RegulationsFeedProps) {
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const filters = {
    ...(typeFilter ? { documentType: typeFilter } : {}),
  };

  const { data, isLoading, dataUpdatedAt, refetch, isFetching, error } =
    useRegulations(filters, searchTriggered);

  const handleSearch = useCallback(() => {
    if (searchTriggered) {
      refetch();
    } else {
      setSearchTriggered(true);
    }
  }, [searchTriggered, refetch]);

  const regulations = data?.data ?? [];
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const isApiKeyError =
    error?.message?.includes("API key") ||
    error?.message?.includes("401") ||
    error?.message?.includes("403");

  return (
    <Panel
      title="Regulations"
      lastUpdated={lastUpdated}
      isLoading={isLoading || isFetching}
      actions={
        <div className="flex items-center gap-0.5">
          {TYPE_FILTERS.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setTypeFilter(tf.value)}
              className={`px-1.5 py-0.5 text-[10px] font-mono-data font-semibold transition-colors ${
                typeFilter === tf.value
                  ? "text-signal bg-signal"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf.label}
            </button>
          ))}
          <button
            onClick={handleSearch}
            disabled={isFetching}
            className="ml-1.5 px-2 py-0.5 text-[10px] font-mono-data font-bold bg-signal text-signal-foreground hover:bg-signal/90 disabled:opacity-50 transition-colors"
          >
            {isFetching ? "..." : searchTriggered ? "REFRESH" : "SEARCH"}
          </button>
          {regulations.length > 0 && (
            <span className="ml-1 text-[10px] font-mono-data text-muted-foreground">
              {regulations.length}
            </span>
          )}
        </div>
      }
    >
      {isApiKeyError ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs text-data-amber">API key not configured</span>
          <span className="text-[10px] font-mono-data">
            Set REGULATIONS_GOV_API_KEY in .env.local
          </span>
        </div>
      ) : !searchTriggered && regulations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">
            Press SEARCH to query Regulations.gov
          </span>
          <span className="text-[10px] font-mono-data">
            PROPOSED RULES &amp; PUBLIC COMMENTS
          </span>
        </div>
      ) : isLoading && regulations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Querying Regulations.gov...</span>
          <span className="text-[10px] font-mono-data">REGULATIONS.GOV API</span>
        </div>
      ) : regulations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">No regulations found</span>
          <span className="text-[10px] font-mono-data">
            Adjust filters and search again
          </span>
        </div>
      ) : (
        <div>
          {/* Column header */}
          <div className="flex items-center px-2.5 py-1.5 text-[10px] font-mono-data text-muted-foreground uppercase border-b border-border bg-surface-0">
            <span className="w-10">TYPE</span>
            <span className="flex-1 ml-1">DOCUMENT</span>
            <span className="w-14 text-right">CMTS</span>
            <span className="w-16 text-right">DUE</span>
          </div>

          <div className="overflow-y-auto flex-1">
            {regulations.map((reg, i) => (
              <a
                key={reg.id}
                href={reg.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="stagger-item data-row block w-full text-left px-2.5 py-2 border-b border-border-subtle group focus:outline-none focus:bg-primary/5"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start gap-1.5">
                  {/* Type badge */}
                  <span
                    className={`w-10 shrink-0 text-[10px] font-mono-data font-bold ${TYPE_COLORS[reg.type]}`}
                  >
                    {TYPE_LABELS[reg.type]}
                  </span>

                  {/* Document info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate leading-tight group-hover:text-data-blue group-hover:underline transition-colors">
                      {reg.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {reg.agency}
                    </p>
                    {reg.summary && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                        {reg.summary}
                      </p>
                    )}
                  </div>

                  {/* Comment count */}
                  <span
                    className={`w-14 shrink-0 text-right text-[10px] font-mono-data ${
                      reg.commentCount > 0
                        ? "text-data-cyan"
                        : "text-muted-foreground"
                    }`}
                  >
                    {reg.commentCount > 0 ? reg.commentCount.toLocaleString() : "--"}
                  </span>

                  {/* Comment deadline */}
                  <div className="w-16 shrink-0 text-right">
                    {reg.commentsDue ? (
                      <span
                        className={`text-[10px] font-mono-data ${
                          isCommentsOpen(reg.commentsDue)
                            ? "text-data-amber"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatDate(reg.commentsDue)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono-data text-muted-foreground">
                        --
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
