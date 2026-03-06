# Spending Chart Redesign

## Problems

1. **TREND cursor bug**: Recharts `cursor` prop renders SVG `<rect>` with `color-mix()` fill. CSS color functions don't work in SVG fill attributes — renders as solid black in light mode, sloppy highlight in dark mode.
2. **NAICS label density**: Y-axis `width=80` with `fontSize=8` for names like "Research and Development in the Physical, Engineering and Life Sciences" — labels overlap and become unreadable.
3. **Scaling**: TREND shows trailing near-zero months (Apr-Jun) that compress meaningful data. No min-height per bar in horizontal views.

## File to modify

`src/components/panels/spending-trends.tsx` — single file, all changes scoped here.

## Current data shape

The `useSpending(view)` hook returns `{ data: { data: SpendingRecord[] | SpendingByTime[] } }`.

- CMD/NAICS views: `SpendingRecord[]` — `{ id, name, code, amount }`
- TREND view: `SpendingByTime[]` — `{ period, amount }` where period is `"2026-01"`, `"2026-02"`, etc.

Branch color comes from `branch.color` prop (hex string like `"#d4a843"`).

## Design

### CMD + NAICS views: Replace Recharts with Spark Table

Remove the horizontal `<BarChart layout="vertical">` entirely. Replace with a pure HTML/CSS ranked list.

**Row layout** (~24px height each, 10 rows max):
```
 1  Air Force          ████████████████████  $11.4B
 2  Navy               ███████████████████   $10.8B
 3  Army               ██████████████████    $9.5B
```

**Row structure** (single flex row):
- Rank: `text-[10px] font-mono-data text-muted-foreground w-4 shrink-0` — right-aligned number
- Name: `text-[10px] truncate w-[100px] shrink-0` — left-aligned, fixed width
- Spark bar container: `flex-1 h-[10px] bg-surface-inset` — holds inner div with `width` as `(amount / maxAmount * 100)%`, `backgroundColor: branchColor`, opacity fades by rank (index 0 = 0.8, each step -0.05)
- Value: `text-[10px] font-mono-data text-foreground w-[52px] text-right shrink-0` — formatted with `formatCompact()`

**NAICS name abbreviation** — apply before rendering:
- "Manufacturing" → "Mfg"
- "Services" → "Svc"
- "and Repairing" → ""
- Strip parenthetical text: `(except ...)`, `(formerly ...)`
- Cap display at ~25 chars with ellipsis

**CMD name abbreviation** (existing logic, keep):
- "Department of the " → ""
- "Defense " → "D/"

### TREND view: Fix existing bar chart

Keep Recharts `<BarChart>` but fix the interaction and scaling:

1. **Kill cursor**: `cursor={false}` on `<Tooltip>` — eliminates black rect
2. **Hover effect**: Track `activeIndex` state. On `<Bar onMouseEnter/onMouseLeave>`, set/clear it. Each `<Cell>` gets `fillOpacity={activeIndex === null ? 0.8 : activeIndex === index ? 1.0 : 0.35}`
3. **Custom tooltip content**: Use Recharts `content` prop with a custom component — just the dollar value as text, no box. Style: `text-[11px] font-mono-data font-bold` with `text-shadow: 0 1px 3px rgba(0,0,0,0.5)` for readability on both themes.
4. **Filter dead months**: Before rendering, drop trailing entries where `amount < maxAmount * 0.01`
5. **X-axis format**: Convert `"2026-01"` → `"JAN"`, `"2026-02"` → `"FEB"` using `Date` month parsing
6. **Bar sizing**: Remove `maxBarSize={24}`, add `barCategoryGap="15%"` so bars fill available width with tight gutters
7. **Keep** `<ResponsiveContainer>` for the TREND view only (it works fine for simple vertical bar charts)

## Verification

After implementing, check all three views (CMD, NAICS, TREND) in both light and dark mode:
- CMD: spark table renders with ranked bars, values right-aligned
- NAICS: no text overlap, abbreviated names readable
- TREND: no black rect on hover, bars fill width, dead months filtered
