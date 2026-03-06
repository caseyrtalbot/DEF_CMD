"use client";

import type { Opportunity } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import { useAddToPipeline } from "@/hooks";

interface OpportunityDrawerProps {
  opportunity: Opportunity;
  onClose: () => void;
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <p
        className={`text-xs text-foreground mt-0.5 ${mono ? "font-mono-data" : ""}`}
      >
        {value ?? "\u2014"}
      </p>
    </div>
  );
}

const TYPE_BADGE_COLORS: Record<Opportunity["type"], string> = {
  presolicitation: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  solicitation: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  award: "bg-green-500/20 text-green-400 border-green-500/30",
  combined: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const TYPE_LABELS: Record<Opportunity["type"], string> = {
  presolicitation: "PRE-SOL",
  solicitation: "SOL",
  award: "AWARD",
  combined: "COMBINED",
};

export function OpportunityDrawer({
  opportunity,
  onClose,
}: OpportunityDrawerProps) {
  const addToPipeline = useAddToPipeline();

  const handleAddToPipeline = () => {
    addToPipeline.mutate({ opportunityId: opportunity.id, stage: "tracking" });
  };

  const pop = opportunity.placeOfPerformance;
  const popString = pop
    ? [pop.city, pop.state, pop.zip, pop.country]
        .filter(Boolean)
        .join(", ") || null
    : null;

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-[500px] sm:w-[600px] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-sm leading-tight pr-8">
            {opportunity.title}
          </SheetTitle>
          <SheetDescription className="font-mono-data text-xs">
            {opportunity.solicitationNumber ?? opportunity.id}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          {/* Add to Pipeline */}
          <Button
            size="sm"
            onClick={handleAddToPipeline}
            disabled={addToPipeline.isPending}
            className="w-full"
          >
            {addToPipeline.isPending ? "Adding..." : "Add to Pipeline"}
          </Button>

          {/* Status Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] ${TYPE_BADGE_COLORS[opportunity.type]}`}
            >
              {TYPE_LABELS[opportunity.type]}
            </Badge>
            {opportunity.setAside && (
              <Badge
                variant="outline"
                className="text-[10px] border-purple-500/30 text-purple-400"
              >
                {opportunity.setAside}
              </Badge>
            )}
            <DeadlineBadge deadline={opportunity.responseDeadline} />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <DetailField label="Agency" value={opportunity.agency} />
            <DetailField label="Office" value={opportunity.office} />
            <DetailField
              label="Solicitation #"
              value={opportunity.solicitationNumber}
              mono
            />
            <DetailField label="Posted Date" value={opportunity.postedDate} />
            <DetailField
              label="Response Deadline"
              value={opportunity.responseDeadline}
            />
            <DetailField
              label="Classification Code"
              value={opportunity.classificationCode}
              mono
            />
          </div>

          {/* NAICS Codes */}
          {opportunity.naicsCodes.length > 0 && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                NAICS Codes
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {opportunity.naicsCodes.map((naics) => (
                  <Badge
                    key={naics.code}
                    variant="outline"
                    className="text-[10px] font-mono-data"
                  >
                    {naics.code}
                    {naics.description ? ` - ${naics.description}` : ""}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Point of Contact */}
          {opportunity.pointOfContact.length > 0 && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Point of Contact
              </span>
              <div className="space-y-2 mt-1">
                {opportunity.pointOfContact.map((poc, i) => (
                  <div key={`${poc.name}-${i}`} className="text-xs">
                    <p className="text-foreground font-medium">{poc.name}</p>
                    {poc.email && (
                      <p className="text-cyan-400 text-[11px]">{poc.email}</p>
                    )}
                    {poc.phone && (
                      <p className="text-muted-foreground text-[11px]">
                        {poc.phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Place of Performance */}
          {popString && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Place of Performance
              </span>
              <p className="text-xs text-foreground mt-0.5">{popString}</p>
            </div>
          )}

          {/* Resource Links */}
          {opportunity.resourceLinks.length > 0 && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Resource Links
              </span>
              <div className="space-y-1 mt-1">
                {opportunity.resourceLinks.map((link, i) => (
                  <a
                    key={`link-${i}`}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[11px] text-blue-400 hover:underline truncate"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {opportunity.description && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Description
              </span>
              <p className="text-xs text-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                {opportunity.description}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
