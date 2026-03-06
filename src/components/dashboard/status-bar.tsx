"use client";

import type { Branch } from "@/lib/branch-config";
import { useSavedOpportunities } from "@/hooks";
import { getPeosByBranch, ALL_PEOS } from "@/lib/peo-data";

interface StatusBarProps {
  branch: Branch;
}

function formatBudget(amount: number): string {
  if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`;
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(0)}M`;
  return `$${amount.toLocaleString()}`;
}

export function StatusBar({ branch }: StatusBarProps) {
  const { data: savedData } = useSavedOpportunities();

  const savedCount = savedData?.length ?? 0;
  const peoCount = getPeosByBranch(branch.id).length;
  const totalPrograms = getPeosByBranch(branch.id).reduce(
    (sum, peo) => sum + peo.keyPrograms.length,
    0
  );

  return (
    <footer className="flex items-center h-7 px-3 border-t border-border bg-surface-0 text-[10px] font-mono-data">
      <div className="flex items-center gap-1 mr-4">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-emerald-500">CONNECTED</span>
      </div>
      <div className="w-px h-3 bg-border mr-3" />

      <div className="flex items-center gap-4 text-muted-foreground">
        <span>
          <span className="text-muted-foreground mr-1">SAVED</span>
          <span className="text-foreground">{savedCount}</span>
        </span>
        <span>
          <span className="text-muted-foreground mr-1">PEOS</span>
          <span className="text-foreground">{peoCount}</span>
        </span>
        <span>
          <span className="text-muted-foreground mr-1">PROGRAMS</span>
          <span className="text-foreground">{totalPrograms}</span>
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3 text-muted-foreground">
        <span>
          <span className="mr-1">BRANCH</span>
          <span style={{ color: branch.color }}>{branch.abbr}</span>
        </span>
        <span>
          <span className="mr-1">FY26 DoD</span>
          <span className="text-signal">{formatBudget(961_600_000_000)}</span>
        </span>
        <span>
          <span className="mr-1">PEOS TOTAL</span>
          <span className="text-signal">{ALL_PEOS.length}</span>
        </span>
      </div>
    </footer>
  );
}
