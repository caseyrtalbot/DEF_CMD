"use client";

import { BRANCHES, type Branch } from "@/lib/branch-config";
import { getPeosByBranch } from "@/lib/peo-data";

interface BranchNavProps {
  activeBranch: Branch;
  onSelect: (branch: Branch) => void;
}

export function BranchNav({ activeBranch, onSelect }: BranchNavProps) {
  return (
    <nav className="flex items-stretch h-8 border-b border-border bg-surface-1 overflow-x-auto">
      {BRANCHES.map((branch) => {
        const isActive = branch.id === activeBranch.id;
        const peoCount = getPeosByBranch(branch.id).length;
        return (
          <button
            key={branch.id}
            onClick={() => onSelect(branch)}
            className="relative flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap"
            style={{
              color: isActive ? branch.color : "var(--muted-foreground)",
              backgroundColor: isActive ? `${branch.color}08` : "transparent",
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: isActive ? branch.color : "var(--border)",
              }}
            />
            {branch.abbr}
            {peoCount > 0 && (
              <span className="text-[9px] font-mono-data text-muted-foreground ml-0.5 opacity-60">
                {peoCount}
              </span>
            )}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: branch.color }}
              />
            )}
          </button>
        );
      })}
      <div className="flex-1" />
      <div className="flex items-center px-3 gap-3 text-[10px] font-mono-data text-muted-foreground">
        <span>FY26</span>
        <span className="text-foreground">{activeBranch.name}</span>
      </div>
    </nav>
  );
}
