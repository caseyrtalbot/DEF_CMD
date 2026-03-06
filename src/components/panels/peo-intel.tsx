"use client";

import { useState, useMemo } from "react";
import { Panel } from "@/components/dashboard/panel";
import type { Branch } from "@/lib/branch-config";
import { getPeosByBranch } from "@/lib/peo-data";
import type { PeoEntry } from "@/lib/peo-data";

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (
    s.includes("production") ||
    s.includes("operational") ||
    s.includes("fielding") ||
    s.includes("deployed") ||
    s.includes("active") ||
    s.includes("in service") ||
    s.includes("commissioned") ||
    s.includes("fielded")
  )
    return "#00c853";
  if (
    s.includes("delay") ||
    s.includes("paused") ||
    s.includes("restructure") ||
    s.includes("retire") ||
    s.includes("wind-down") ||
    s.includes("scaled back") ||
    s.includes("cancelled") ||
    s.includes("deferred")
  )
    return "#ff1744";
  if (s.includes("classified") || s.includes("tbd") || s.includes("included"))
    return "#555555";
  return "#ff8c00";
}

interface PeoIntelProps {
  branch: Branch;
}

export function PeoIntel({ branch }: PeoIntelProps) {
  const [selectedPeoId, setSelectedPeoId] = useState<string | null>(null);
  const peos = useMemo(() => getPeosByBranch(branch.id), [branch.id]);

  const totalPrograms = useMemo(
    () => peos.reduce((sum, p) => sum + p.keyPrograms.length, 0),
    [peos]
  );

  return (
    <Panel
      title="PEO Intel"
      accentColor={branch.color}
      actions={
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono-data text-muted-foreground">
            {peos.length} PEOS
          </span>
          <span className="text-[10px] font-mono-data text-muted-foreground">
            {totalPrograms} PROGRAMS
          </span>
        </div>
      }
    >
      {/* Column header */}
      <div className="flex items-center px-2.5 py-1.5 text-[10px] font-mono-data text-muted-foreground uppercase border-b border-border bg-surface-0">
        <span className="w-20">PEO</span>
        <span className="flex-1 ml-1">PROGRAMS</span>
        <span className="w-16 text-right">BUDGET</span>
      </div>

      <div className="overflow-y-auto flex-1">
        {peos.map((peo) => (
          <button
            key={peo.id}
            onClick={() =>
              setSelectedPeoId(peo.id === selectedPeoId ? null : peo.id)
            }
            className="data-row w-full text-left px-2.5 py-2 border-b border-border-subtle"
          >
            <div className="flex items-start gap-1">
              <span className="text-[11px] font-mono-data font-bold text-signal w-20 shrink-0 truncate">
                {peo.name}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">
                  {peo.fullName}
                </p>
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  {peo.keyPrograms.slice(0, 3).map((prog) => (
                    <span
                      key={prog.name}
                      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                    >
                      <span
                        className="w-1.5 h-1.5 shrink-0"
                        style={{ backgroundColor: statusColor(prog.status) }}
                      />
                      {prog.name}
                    </span>
                  ))}
                  {peo.keyPrograms.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{peo.keyPrograms.length - 3}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-mono-data text-foreground w-16 text-right shrink-0">
                {peo.budget}
              </span>
            </div>

            {/* Expanded PEO detail */}
            {selectedPeoId === peo.id && (
              <div className="mt-2 border-t border-border pt-2 space-y-2">
                {/* Parent org & location */}
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-muted-foreground">
                    <span className="text-signal font-bold">ORG</span>{" "}
                    {peo.parent}
                  </span>
                  <span className="text-muted-foreground">
                    <span className="text-signal font-bold">LOC</span>{" "}
                    {peo.location}
                  </span>
                </div>

                {/* Budget note */}
                <p className="text-[10px] text-muted-foreground">
                  {peo.budgetNote}
                </p>

                {/* Categories */}
                <div className="flex flex-wrap gap-0.5">
                  {peo.categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-[10px] px-1.5 py-0.5 bg-border border border-border text-foreground uppercase tracking-wide"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Key programs table */}
                <div>
                  <div className="text-[10px] font-mono-data font-bold text-signal uppercase mb-1">
                    KEY PROGRAMS
                  </div>
                  {peo.keyPrograms.map((prog) => (
                    <div
                      key={prog.name}
                      className="flex items-center gap-2 py-0.5 text-[11px] border-b border-border-subtle"
                    >
                      <span
                        className="w-1.5 h-1.5 shrink-0"
                        style={{ backgroundColor: statusColor(prog.status) }}
                      />
                      <span className="flex-1 text-foreground truncate">
                        {prog.name}
                      </span>
                      <span className="text-muted-foreground text-[10px] max-w-[100px] truncate">
                        {prog.status}
                      </span>
                      <span className="font-mono-data text-foreground w-20 text-right shrink-0">
                        {prog.budget}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Sub-offices */}
                {peo.subOffices.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono-data font-bold text-signal uppercase mb-1">
                      SUB-OFFICES ({peo.subOffices.length})
                    </div>
                    {peo.subOffices.map((sub) => (
                      <div
                        key={sub.office}
                        className="flex items-start gap-2 py-0.5 text-[11px] border-b border-border-subtle"
                      >
                        <span className="font-mono-data text-signal w-16 shrink-0 truncate">
                          {sub.office}
                        </span>
                        <span className="flex-1 text-foreground truncate">
                          {sub.name}
                        </span>
                        <span className="text-muted-foreground text-[10px] max-w-[140px] truncate">
                          {sub.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Leadership */}
                {peo.leadership.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono-data font-bold text-signal uppercase mb-1">
                      LEADERSHIP
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {peo.leadership.map((leader) => (
                        <div
                          key={leader.name}
                          className="px-1.5 py-0.5 bg-surface-inset border border-border text-[10px]"
                        >
                          <span className="text-foreground font-medium">
                            {leader.name}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            {leader.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modernization priorities */}
                <div>
                  <div className="text-[10px] font-mono-data font-bold text-signal uppercase mb-1">
                    MODERNIZATION
                  </div>
                  <ul className="space-y-0.5">
                    {peo.modernization.map((item, i) => (
                      <li
                        key={i}
                        className="text-[10px] text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="text-signal mt-0.5 shrink-0">-</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Budget links */}
                {peo.budgetLinks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {peo.budgetLinks.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono-data text-signal bg-surface-inset border border-border hover:border-signal transition-colors uppercase tracking-wide"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link.label}
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </Panel>
  );
}
