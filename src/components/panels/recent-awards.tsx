"use client";

import type { Award } from "@/lib/types";
import { useAwards } from "@/hooks/use-awards";
import { Panel } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";

interface RecentAwardsProps {
  naicsCode?: string;
}

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount.toFixed(0)}`;
}

function AwardRow({ award }: { award: Award }) {
  return (
    <div className="px-3 py-2 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate leading-tight">
            {award.description || award.piid}
          </p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {award.agencyName}
          </p>
        </div>
        <span className="text-xs font-mono-data font-semibold text-green-400 whitespace-nowrap text-right">
          {formatCurrency(award.awardAmount)}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-[10px] text-cyan-400 truncate max-w-[120px]">
          {award.vendorName}
        </span>
        {award.naicsCode && (
          <span className="text-[9px] font-mono-data text-muted-foreground">
            {award.naicsCode}
          </span>
        )}
        {award.setAside && (
          <Badge
            variant="outline"
            className="text-[9px] px-1 py-0 h-4 border-purple-500/30 text-purple-400"
          >
            {award.setAside}
          </Badge>
        )}
        {award.competitionType && (
          <span className="text-[9px] text-muted-foreground truncate">
            {award.competitionType}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[9px] font-mono-data text-muted-foreground">
          {award.signedDate}
        </span>
        <span className="text-[9px] font-mono-data text-muted-foreground">
          {award.piid}
        </span>
      </div>
    </div>
  );
}

export function RecentAwards({ naicsCode }: RecentAwardsProps) {
  const { data, isLoading, dataUpdatedAt } = useAwards(
    naicsCode ? { naicsCode } : {}
  );

  const awards = data?.data ?? [];
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <Panel title="Recent Awards" lastUpdated={lastUpdated} isLoading={isLoading}>
      {isLoading && awards.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading awards...
        </div>
      ) : awards.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No awards found
        </div>
      ) : (
        <div className="divide-y divide-border">
          {awards.map((award) => (
            <AwardRow key={award.id} award={award} />
          ))}
        </div>
      )}
    </Panel>
  );
}
