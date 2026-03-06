"use client";

import { useState, useCallback } from "react";
import { Panel } from "@/components/dashboard/panel";
import { useFederalRegister } from "@/hooks/use-federal-register";
import type { FederalRegisterDocument } from "@/lib/types";

const TYPE_FILTERS = [
  { label: "ALL", value: undefined },
  { label: "RULE", value: "rule" },
  { label: "PROPOSED", value: "proposed_rule" },
  { label: "NOTICE", value: "notice" },
] as const;

const TYPE_COLORS: Record<FederalRegisterDocument["type"], string> = {
  rule: "bg-data-green",
  proposed_rule: "bg-data-amber",
  notice: "bg-data-blue",
  presidential_document: "bg-data-purple",
};

const TYPE_TEXT_COLORS: Record<FederalRegisterDocument["type"], string> = {
  rule: "text-data-green",
  proposed_rule: "text-data-amber",
  notice: "text-data-blue",
  presidential_document: "text-data-purple",
};

const TYPE_LABELS: Record<FederalRegisterDocument["type"], string> = {
  rule: "RULE",
  proposed_rule: "PROP",
  notice: "NOTC",
  presidential_document: "PRES",
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

interface DfarsFeedProps {
  enabled?: boolean;
}

export function DfarsFeed({ enabled: _enabled }: DfarsFeedProps) {
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const filters = {
    ...(typeFilter ? { type: typeFilter } : {}),
  };

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } =
    useFederalRegister(filters, searchTriggered);

  const handleSearch = useCallback(() => {
    if (searchTriggered) {
      refetch();
    } else {
      setSearchTriggered(true);
    }
  }, [searchTriggered, refetch]);

  const documents = data?.data ?? [];
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <Panel
      title="DFARS / Fed Register"
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
          {documents.length > 0 && (
            <span className="ml-1 text-[10px] font-mono-data text-muted-foreground">
              {documents.length}
            </span>
          )}
        </div>
      }
    >
      {!searchTriggered && documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Press SEARCH to query Federal Register</span>
          <span className="text-[10px] font-mono-data">
            DFARS / ACQUISITION RULES
          </span>
        </div>
      ) : isLoading && documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Querying Federal Register...</span>
          <span className="text-[10px] font-mono-data">FEDERAL REGISTER API</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">No documents found</span>
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
            <span className="w-16 text-right">DATE</span>
          </div>

          <div className="overflow-y-auto flex-1">
            {documents.map((doc, i) => (
              <a
                key={doc.id}
                href={doc.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="stagger-item data-row block w-full text-left px-2.5 py-2 border-b border-border-subtle group focus:outline-none focus:bg-primary/5"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start gap-1.5">
                  {/* Type indicator */}
                  <div className="w-10 shrink-0 flex items-center gap-1">
                    <span
                      className={`inline-block w-1.5 h-1.5 shrink-0 ${TYPE_COLORS[doc.type]}`}
                    />
                    <span
                      className={`text-[9px] font-mono-data font-bold uppercase ${TYPE_TEXT_COLORS[doc.type]}`}
                    >
                      {TYPE_LABELS[doc.type]}
                    </span>
                  </div>

                  {/* Document info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate leading-tight group-hover:text-data-blue group-hover:underline transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {doc.agencies.join(", ")}
                    </p>
                    {doc.abstractText && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                        {doc.abstractText}
                      </p>
                    )}
                  </div>

                  {/* Date column */}
                  <div className="w-16 shrink-0 text-right">
                    <span className="text-[10px] font-mono-data text-muted-foreground">
                      {formatDate(doc.publicationDate)}
                    </span>
                    {doc.commentsDue && (
                      <p
                        className={`text-[10px] font-mono-data mt-0.5 ${
                          isCommentsOpen(doc.commentsDue)
                            ? "text-data-amber"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isCommentsOpen(doc.commentsDue) ? "CMT " : ""}
                        {formatDate(doc.commentsDue)}
                      </p>
                    )}
                  </div>
                </div>

                {/* External link indicator on hover */}
                <div className="hidden group-hover:flex items-center gap-1 mt-1 ml-11">
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-data-blue"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                  <span className="text-[9px] font-mono-data text-data-blue">
                    {doc.documentNumber}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
