"use client";

import type { Opportunity } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface OpportunityDrawerProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export function OpportunityDrawer({ opportunity, onClose }: OpportunityDrawerProps) {
  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{opportunity.title}</SheetTitle>
          <SheetDescription>
            {opportunity.solicitationNumber ?? opportunity.id}
          </SheetDescription>
        </SheetHeader>
        <div className="p-4 text-sm text-muted-foreground">
          Opportunity detail placeholder
        </div>
      </SheetContent>
    </Sheet>
  );
}
