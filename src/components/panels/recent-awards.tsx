"use client";

interface RecentAwardsProps {
  naicsCode?: string;
}

export function RecentAwards({ naicsCode: _naicsCode }: RecentAwardsProps) {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Awards
    </div>
  );
}
