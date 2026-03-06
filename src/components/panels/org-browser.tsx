"use client";

import { useState, useCallback } from "react";
import { Panel } from "@/components/dashboard/panel";
import { useHierarchySearch } from "@/hooks/use-hierarchy";
import type { FederalOrg } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  department: "text-data-amber",
  agency: "text-data-cyan",
  office: "text-data-green",
};

const TYPE_LABELS: Record<string, string> = {
  department: "DEPT",
  agency: "AGENCY",
  office: "OFFICE",
};

function orgTypeBadge(type: string): { label: string; color: string } {
  const key = type.toLowerCase();
  return {
    label: TYPE_LABELS[key] ?? type.toUpperCase().slice(0, 6),
    color: TYPE_COLORS[key] ?? "text-muted-foreground",
  };
}

export function OrgBrowser() {
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const { data, isLoading, isFetching, dataUpdatedAt, refetch } =
    useHierarchySearch(
      submittedQuery,
      undefined,
      undefined,
      25,
      0,
      searchTriggered && submittedQuery.length > 0
    );

  const handleSearch = useCallback(() => {
    if (!searchInput.trim()) return;
    if (searchTriggered && searchInput.trim() === submittedQuery) {
      refetch();
    } else {
      setSubmittedQuery(searchInput.trim());
      setSearchTriggered(true);
    }
  }, [searchInput, searchTriggered, submittedQuery, refetch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  const orgs: FederalOrg[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <Panel
      title="Org Hierarchy"
      lastUpdated={lastUpdated}
      isLoading={isLoading || isFetching}
      actions={
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search orgs..."
            className="px-1.5 py-0.5 text-[11px] font-mono-data bg-surface-0 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-signal w-32"
          />
          <button
            onClick={handleSearch}
            disabled={isFetching || !searchInput.trim()}
            className="px-2 py-0.5 text-[10px] font-mono-data font-bold bg-signal text-signal-foreground hover:bg-signal/90 disabled:opacity-50 transition-colors"
          >
            {isFetching ? "..." : "SEARCH"}
          </button>
          {total > 0 && (
            <span className="ml-0.5 text-[10px] font-mono-data text-muted-foreground">
              {total.toLocaleString()}
            </span>
          )}
        </div>
      }
    >
      {!searchTriggered && orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Search the DoD federal hierarchy</span>
          <span className="text-[10px] font-mono-data">
            SAM.gov org tree — departments, agencies, offices
          </span>
        </div>
      ) : isLoading && orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Querying hierarchy...</span>
          <span className="text-[10px] font-mono-data">SAM.GOV API</span>
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">No organizations found</span>
          <span className="text-[10px] font-mono-data">
            Try a different search term
          </span>
        </div>
      ) : (
        <div>
          {/* Column header */}
          <div className="flex items-center px-2.5 py-1.5 text-[10px] font-mono-data text-muted-foreground uppercase border-b border-border bg-surface-0">
            <span className="w-14">TYPE</span>
            <span className="flex-1 ml-1">ORG / CODE</span>
            <span className="w-28 text-right">PARENT</span>
          </div>

          <div className="overflow-y-auto flex-1">
            {orgs.map((org) => {
              const badge = orgTypeBadge(org.type);
              return (
                <div
                  key={org.orgKey}
                  className="data-row w-full text-left px-2.5 py-2 border-b border-border-subtle"
                >
                  <div className="flex items-start gap-1">
                    <span
                      className={`text-[10px] font-mono-data font-bold w-14 shrink-0 ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                        {org.name}
                      </p>
                      <p className="text-[11px] font-mono-data text-muted-foreground truncate mt-0.5">
                        {org.agencyCode ?? org.code}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground w-28 text-right shrink-0 truncate">
                      {org.parentOrgKey ?? "--"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}
