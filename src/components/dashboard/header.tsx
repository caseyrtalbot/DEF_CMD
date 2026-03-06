"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onSearch: (query: string) => void;
  alertCount: number;
  onToggleAlerts: () => void;
  onToggleSettings: () => void;
  searchFocusRef: React.MutableRefObject<(() => void) | null>;
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
    <header className="flex items-center justify-between h-10 px-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-wide text-foreground">
          GOVCON<span className="text-blue-500">CMD</span>
        </h1>
        <span className="text-[10px] text-muted-foreground font-mono-data">v1.0</span>
      </div>
      <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-8">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search opportunities, awards, vendors... ( / )"
          className="h-7 text-xs bg-background border-border font-mono-data"
        />
      </form>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleAlerts}
          className="relative text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ALERTS
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-3 flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-red-500 text-white rounded-full">
              {alertCount}
            </span>
          )}
        </button>
        <button
          onClick={onToggleSettings}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          CONFIG
        </button>
      </div>
    </header>
  );
}
