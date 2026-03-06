# GovCon Command Center — Design Document

**Date:** 2026-03-05
**Status:** Approved

## Overview

A Bloomberg-terminal-style federal contract intelligence dashboard. Single-user, real-time data from four federal APIs, lightweight local persistence for pipeline tracking and preferences.

## Architecture

- **Framework:** Next.js 14 (App Router, Server Components)
- **Database:** SQLite via better-sqlite3 (local file, zero ops)
- **Styling:** TailwindCSS + shadcn/ui, dark Bloomberg terminal aesthetic
- **Data fetching:** React Query with configurable polling intervals
- **All federal API calls server-side** — API key never exposed to browser

```
Browser (React Query polling)
  ↕
Next.js API Routes (normalize + proxy)
  ↕
SAM.gov API | FPDS ATOM | USASpending API | SAM.gov Entity API
  ↕
SQLite (pipeline, saved searches, preferences, tracked entities, alert rules)
```

## Data Sources

### SAM.gov Opportunities API (`api.sam.gov/opportunities/v2`)
- Search by NAICS, keyword, set-aside, agency, posted date
- Statuses: presolicitation, solicitation, award, combined synopsis
- Rate limit: 10 req/sec with API key

### FPDS ATOM Feeds (`www.fpds.gov/ezsearch/LATEST`)
- Contract awards, modifications, IDVs
- Query by NAICS, agency, vendor, date range, dollar amount
- Incumbent identification, pricing intelligence, recompete timing

### USASpending.gov API (`api.usaspending.gov/api/v2`)
- Spending by agency, NAICS, recipient, geography
- Aggregate trends over time
- No auth required

### SAM.gov Entity API (`api.sam.gov/entity-information/v3`)
- Vendor lookup: UEI, CAGE code, capabilities, socioeconomic status
- Same API key as opportunities

### Normalized Models
All sources transformed server-side into:
- `Opportunity` — anything you can bid on
- `Award` — anything that's been won
- `SpendingRecord` — where money is flowing
- `Entity` — vendor/contractor profile

## Dashboard Layout (Command Center)

Single-page, six panels, all visible simultaneously.

```
┌──────────────────────────────────┬───────────────────────────────────┐
│  OPPORTUNITY FEED (40%)          │  PIPELINE TRACKER (60%)           │
│  Live SAM.gov, filterable        │  Kanban: Track → Bid/No-Bid →    │
│  NAICS, agency, set-aside,       │  Drafting → Submitted → Won/Lost │
│  keyword, deadline               │  Drag-and-drop, notes, tags      │
├──────────────────────────────────┼─────────────────┬─────────────────┤
│  RECENT AWARDS (40%)             │ SPENDING (30%)  │ ALERTS (30%)    │
│  FPDS feed, click for vendor     │ Charts by       │ Saved search    │
│  profile + full contract detail  │ agency/NAICS/   │ matches,        │
│                                  │ time series     │ deadlines,      │
│                                  │                 │ incumbent acts  │
└──────────────────────────────────┴─────────────────┴─────────────────┘
```

## Visual Design

- **Theme:** Dark — near-black (#0a0a0f), navy panels (#111827), thin 1px borders (#1e293b)
- **Typography:** JetBrains Mono (data), Inter (UI labels), 12-13px body
- **Accents:** Amber (deadlines), Green (awards/won), Blue (solicitations), Red (expiring/lost), Cyan (analytics)
- **Style:** No shadows, no rounded cards. Uppercase letter-spaced panel headers. Right-aligned monospace numbers. Thin dark scrollbars. Subtle row hover highlights.
- **Polish:** Live "last updated" pulse indicators, keyboard shortcuts, resizable panels, styled scrollbars, comma-formatted currency

## SQLite Schema

```sql
saved_searches    (id, name, filters JSON, notify, timestamps)
pipeline_items    (id, opportunity_id, stage, notes, decision_date, tags JSON, timestamps)
tracked_entities  (id, uei, name, relationship, notes, created_at)
alert_rules       (id, type, config JSON, enabled, created_at)
preferences       (id, default_naics JSON, refresh_rates JSON, panel_layout JSON, timestamps)
```

Pipeline items link to SAM.gov by opportunity_id — always fetch live data, overlay local notes/stage.

## Key Interactions

- **Global search** (`/` hotkey): queries all four APIs in parallel, results grouped by type
- **Opportunity detail drawer**: slides right, shows full data + related awards + incumbent + agency spending
- **Pipeline kanban**: drag between stages, color-coded deadline urgency
- **Award click-through**: full contract detail + vendor profile from Entity API
- **Spending charts**: toggle agency/NAICS/vendor/time views, click to drill down
- **Alerts**: saved search matches, deadline warnings, incumbent activity

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `Esc` | Close drawer |
| `1-5` | Focus panel |
| `r` | Refresh all |
| `n` | New saved search |
| `?` | Shortcut reference |

## Configuration

- NAICS codes configurable (default: 541511, 541512, 541519 for IT/Software/Cyber)
- Per-panel polling intervals configurable
- Panel sizes resizable and persisted
- All preferences stored in SQLite preferences table

## Future Phases (Not in Scope)

- PEO / budget justification document tracking
- Congressional appropriations monitoring
- State/local procurement portal scraping
- Multi-user / team collaboration
- Email/Slack/SMS notification channels
