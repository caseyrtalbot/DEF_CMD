"use client";

import { ReactNode } from "react";

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  lastUpdated?: Date | null;
  isLoading?: boolean;
  actions?: ReactNode;
}

export function Panel({ title, children, className = "", lastUpdated, isLoading, actions }: PanelProps) {
  return (
    <div className={`flex flex-col border border-border bg-card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="panel-header">{title}</span>
          {lastUpdated && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono-data">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isLoading ? "bg-amber-500 pulse-dot" : "bg-green-500"}`} />
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
