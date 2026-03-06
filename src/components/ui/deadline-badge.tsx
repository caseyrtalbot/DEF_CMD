import { differenceInDays, parseISO } from "date-fns";

export function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return <span className="text-[10px] text-muted-foreground">No deadline</span>;

  const days = differenceInDays(parseISO(deadline), new Date());

  let color = "text-data-green";
  if (days <= 3) color = "text-data-red";
  else if (days <= 7) color = "text-data-amber";
  else if (days <= 14) color = "text-data-amber";

  if (days < 0) {
    return <span className="text-[10px] text-muted-foreground line-through">Closed</span>;
  }

  return (
    <span className={`text-[10px] font-mono-data font-semibold ${color}`}>
      {days === 0 ? "TODAY" : days === 1 ? "1 DAY" : `${days} DAYS`}
    </span>
  );
}
