"use client";

import { ReactNode } from "react";

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  lastUpdated?: Date | null;
  isLoading?: boolean;
  actions?: ReactNode;
  accentColor?: string;
}

export function Panel({ title, children, className = "", lastUpdated, isLoading, actions, accentColor }: PanelProps) {
  return (
    <div className={`relative flex flex-col bg-surface-1 overflow-hidden ${className}`}>
      {/* Top accent line */}
      <div
        className="h-[2px] w-full"
        style={{ backgroundColor: accentColor ?? "color-mix(in srgb, var(--primary) 30%, transparent)" }}
      />
      {/* Header */}
      <div className="relative flex items-center justify-between px-3 py-2 border-b border-border scan-line">
        <div className="flex items-center gap-2">
          <span className="panel-header">{title}</span>
          {lastUpdated && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono-data">
              <span
                className={`inline-block w-1 h-1 rounded-full ${
                  isLoading ? "bg-amber-500 pulse-dot" : "bg-emerald-600"
                }`}
              />
              {lastUpdated.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
