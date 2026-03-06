"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  onSearch: (query: string) => void;
  alertCount: number;
  onToggleAlerts: () => void;
  onToggleSettings: () => void;
  searchFocusRef: React.MutableRefObject<(() => void) | null>;
}

function LiveClock() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState("--:--:--");
  const [date, setDate] = useState("--- --");

  useEffect(() => {
    setMounted(true);
    function tick() {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
      setDate(now.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase());
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 font-mono-data text-[11px]">
        <span className="text-muted-foreground">--- --</span>
        <span className="text-foreground tabular-nums">--:--:--</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 font-mono-data text-[11px]">
      <span className="text-muted-foreground">{date}</span>
      <span className="text-foreground tabular-nums">{time}</span>
    </div>
  );
}

export function Header({ onSearch, alertCount, onToggleAlerts, onToggleSettings, searchFocusRef }: HeaderProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchFocusRef.current = () => inputRef.current?.focus();
  }, [searchFocusRef]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(query);
  }

  return (
    <header className="flex items-center h-10 px-3 border-b border-border bg-surface-1">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="flex items-center">
          <span className="text-base font-bold tracking-wide text-foreground">DEF</span>
          <span className="text-base font-bold tracking-wide text-signal">CMD</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
          <span className="text-[10px] font-mono-data text-emerald-500">LIVE</span>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-md min-w-0">
        <div className="relative">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contracts, programs, vendors..."
            className="h-7 text-xs bg-surface-inset border-input font-mono-data placeholder:text-muted-foreground/50 focus:border-primary/40 rounded-none px-2"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 kbd">/</span>
        </div>
      </form>

      {/* Right side — metrics & controls */}
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <LiveClock />
        <div className="w-px h-4 bg-border" />
        <button
          onClick={onToggleAlerts}
          className="relative flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-signal transition-colors uppercase tracking-wider"
        >
          ALERTS
          {alertCount > 0 && (
            <span className="flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-red-600 text-white rounded-full">
              {alertCount}
            </span>
          )}
        </button>
        <ThemeToggle />
        <button
          onClick={onToggleSettings}
          className="text-[11px] font-semibold text-muted-foreground hover:text-signal transition-colors uppercase tracking-wider"
        >
          CFG
        </button>
      </div>
    </header>
  );
}
