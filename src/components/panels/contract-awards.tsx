"use client";

import { useState, useCallback } from "react";
import type { Branch } from "@/lib/branch-config";
import type { ContractAwardFilters } from "@/lib/api/contract-awards";
import { useContractAwards } from "@/hooks/use-contract-awards";
import { Panel } from "@/components/dashboard/panel";

interface ContractAwardsPanelProps {
  branch: Branch;
}

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount.toFixed(0)}`;
}

function formatSignedDate(dateStr: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

export function ContractAwardsPanel({ branch }: ContractAwardsPanelProps) {
  const [searchTriggered, setSearchTriggered] = useState(false);

  const filters: ContractAwardFilters = {
    ...(branch.id !== "all" ? { agencies: branch.samAgencies } : {}),
  };

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useContractAwards(
    filters,
    25,
    0,
    searchTriggered
  );

  const handleSearch = useCallback(() => {
    if (searchTriggered) {
      refetch();
    } else {
      setSearchTriggered(true);
    }
  }, [searchTriggered, refetch]);

  const awards = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <Panel
      title="Awards"
      lastUpdated={lastUpdated}
      isLoading={isLoading || isFetching}
      accentColor={branch.color}
      actions={
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleSearch}
            disabled={isFetching}
            className="ml-1.5 px-2 py-0.5 text-[10px] font-mono-data font-bold bg-signal text-signal-foreground hover:bg-signal/90 disabled:opacity-50 transition-colors"
          >
            {isFetching ? "..." : searchTriggered ? "REFRESH" : "SEARCH"}
          </button>
          {total > 0 && (
            <span className="ml-1 text-[10px] font-mono-data text-muted-foreground">
              {total.toLocaleString()}
            </span>
          )}
        </div>
      }
    >
      {!searchTriggered && awards.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Press SEARCH to query contract awards</span>
          <span className="text-[10px] font-mono-data">SAM.GOV API — manual queries only</span>
        </div>
      ) : isLoading && awards.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">Querying SAM.gov...</span>
          <span className="text-[10px] font-mono-data">SAM.GOV API</span>
        </div>
      ) : awards.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
          <span className="text-xs">No awards found</span>
          <span className="text-[10px] font-mono-data">Adjust filters and search again</span>
        </div>
      ) : (
        <div>
          {/* Column header */}
          <div className="flex items-center px-2.5 py-1.5 text-[10px] font-mono-data text-muted-foreground uppercase border-b border-border bg-surface-0">
            <span className="flex-1">AWARD / VENDOR</span>
            <span className="w-14 text-right">NAICS</span>
            <span className="w-20 text-right">VALUE</span>
          </div>
          {awards.map((award, i) => (
            <div
              key={award.id + "-" + i}
              className="stagger-item data-row w-full text-left px-2.5 py-2 border-b border-border-subtle"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start gap-1">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                    {award.description || award.piid}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-data-cyan truncate">
                      {award.vendorName}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {award.agencyName}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono-data text-muted-foreground w-14 text-right shrink-0">
                  {award.naicsCode ?? "—"}
                </span>
                <div className="w-20 text-right shrink-0">
                  <p className="text-[11px] font-mono-data font-semibold text-data-green">
                    {formatCurrency(award.awardAmount)}
                  </p>
                  <p className="text-[10px] font-mono-data text-muted-foreground">
                    {formatSignedDate(award.signedDate)}
                  </p>
                </div>
              </div>
              {(award.setAside || award.psc) && (
                <div className="mt-0.5 flex items-center gap-1.5">
                  {award.setAside && (
                    <span className="text-[9px] font-mono-data px-1 py-0 text-data-purple bg-data-purple/10 border border-data-purple/20">
                      {award.setAside}
                    </span>
                  )}
                  {award.psc && (
                    <span className="text-[10px] font-mono-data text-muted-foreground">
                      PSC {award.psc}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
