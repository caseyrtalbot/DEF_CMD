# GovCon Command Center Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Bloomberg-terminal-style federal contract intelligence dashboard with real-time data from four federal APIs.

**Architecture:** Next.js 14 App Router with server-side API proxying, SQLite for local persistence, React Query for real-time polling. All federal API calls happen server-side to protect the API key.

**Tech Stack:** Next.js 14, TypeScript, TailwindCSS, shadcn/ui, better-sqlite3, @tanstack/react-query, recharts, @dnd-kit (drag-and-drop), JetBrains Mono + Inter fonts

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `.env.local`, `.gitignore`, `.env.example`

**Step 1: Initialize Next.js project**

Run:
```bash
cd ~/Projects/govcon-command-center
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```
Expected: Project scaffolded with src/app directory

**Step 2: Install core dependencies**

Run:
```bash
cd ~/Projects/govcon-command-center
npm install better-sqlite3 @tanstack/react-query recharts @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns
npm install -D @types/better-sqlite3
```

**Step 3: Install shadcn/ui**

Run:
```bash
cd ~/Projects/govcon-command-center
npx shadcn@latest init -d
```

Then install components we'll need:
```bash
npx shadcn@latest add badge button card dialog dropdown-menu input scroll-area separator sheet tabs tooltip
```

**Step 4: Create .env.local with API key**

Create `.env.local`:
```
SAM_GOV_API_KEY=your-api-key-here
```

Create `.env.example`:
```
SAM_GOV_API_KEY=your-sam-gov-api-key
```

**Step 5: Add .env.local to .gitignore**

Verify `.gitignore` contains `.env*.local`. If not, add it.

**Step 6: Set up fonts and base dark theme**

Replace `src/app/globals.css` with Bloomberg terminal dark theme:
```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@font-face {
  font-family: 'JetBrains Mono';
  src: url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
}

:root {
  --background: 233 100% 3%;
  --foreground: 214 32% 91%;
  --card: 222 47% 6%;
  --card-foreground: 214 32% 91%;
  --popover: 222 47% 6%;
  --popover-foreground: 214 32% 91%;
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 217 33% 17%;
  --secondary-foreground: 214 32% 91%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 45%;
  --accent: 217 33% 17%;
  --accent-foreground: 214 32% 91%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 217 33% 12%;
  --input: 217 33% 12%;
  --ring: 217 91% 60%;
  --radius: 0.25rem;

  /* Semantic colors */
  --amber: 38 92% 50%;
  --green: 160 84% 39%;
  --cyan: 188 94% 43%;
  --red: 0 84% 60%;
  --blue: 217 91% 60%;
}

* {
  @apply border-border;
}

body {
  @apply bg-background text-foreground;
  font-family: 'Inter', system-ui, sans-serif;
}

/* Bloomberg-style scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: hsl(var(--background));
}
::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground));
}

/* Monospace numbers */
.font-mono-data {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}

/* Panel header style */
.panel-header {
  @apply text-xs font-semibold uppercase tracking-widest text-muted-foreground;
}

/* Pulse animation for live indicator */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.pulse-dot {
  animation: pulse-dot 2s ease-in-out infinite;
}
```

**Step 7: Set up base layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "GovCon Command Center",
  description: "Federal contract intelligence dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Create `src/app/providers.tsx`:
```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchInterval: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

**Step 8: Verify dev server starts**

Run:
```bash
cd ~/Projects/govcon-command-center && npm run dev
```
Expected: Server starts on localhost:3000

**Step 9: Initialize git and commit**

Run:
```bash
cd ~/Projects/govcon-command-center && git init && git add -A && git commit -m "feat: scaffold Next.js project with dark Bloomberg theme"
```

---

## Task 2: TypeScript Types & Normalized Models

**Files:**
- Create: `src/lib/types.ts`

**Step 1: Define all shared types**

Create `src/lib/types.ts`:
```typescript
// === Normalized Models (what the UI sees) ===

export interface Opportunity {
  id: string;
  title: string;
  solicitationNumber: string | null;
  type: "presolicitation" | "solicitation" | "award" | "combined";
  postedDate: string;
  responseDeadline: string | null;
  agency: string;
  office: string | null;
  naicsCodes: NaicsCode[];
  setAside: string | null;
  classificationCode: string | null;
  placeOfPerformance: PlaceOfPerformance | null;
  pointOfContact: PointOfContact[];
  resourceLinks: string[];
  description: string | null;
}

export interface NaicsCode {
  code: string;
  description: string;
}

export interface PlaceOfPerformance {
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
}

export interface PointOfContact {
  type: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface Award {
  id: string;
  piid: string;
  agencyId: string;
  agencyName: string;
  vendorName: string;
  vendorUei: string | null;
  awardAmount: number;
  obligatedAmount: number;
  signedDate: string;
  effectiveDate: string;
  completionDate: string | null;
  naicsCode: string | null;
  competitionType: string | null;
  setAside: string | null;
  contractType: string | null;
  description: string | null;
}

export interface SpendingRecord {
  id: string;
  name: string;
  code: string;
  amount: number;
}

export interface SpendingByTime {
  period: string;
  amount: number;
}

export interface Entity {
  uei: string;
  cageCode: string | null;
  legalBusinessName: string;
  registrationStatus: string;
  physicalAddress: {
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
  };
  naicsCodes: NaicsCode[];
  socioeconomicStatuses: string[];
  businessType: string | null;
  profitStructure: string | null;
  pointOfContact: PointOfContact | null;
}

// === Pipeline (local data) ===

export type PipelineStage =
  | "tracking"
  | "bid_no_bid"
  | "drafting"
  | "submitted"
  | "awarded"
  | "lost";

export interface PipelineItem {
  id: string;
  opportunityId: string;
  stage: PipelineStage;
  notes: string | null;
  decisionDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  opportunity?: Opportunity;
}

// === Saved Searches ===

export interface SearchFilters {
  keywords?: string;
  naicsCodes?: string[];
  agencies?: string[];
  setAsides?: string[];
  postedFrom?: string;
  postedTo?: string;
  opportunityType?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  notify: boolean;
  createdAt: string;
  updatedAt: string;
}

// === Tracked Entities ===

export type EntityRelationship = "competitor" | "teaming_partner" | "incumbent";

export interface TrackedEntity {
  id: string;
  uei: string;
  name: string;
  relationship: EntityRelationship;
  notes: string | null;
  createdAt: string;
}

// === Alert Rules ===

export type AlertType =
  | "deadline_approaching"
  | "incumbent_award"
  | "new_presolicitation"
  | "saved_search_match";

export interface AlertRule {
  id: string;
  type: AlertType;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  relatedId: string | null;
  read: boolean;
  createdAt: string;
}

// === API Response Wrappers ===

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

**Step 2: Commit**

```bash
cd ~/Projects/govcon-command-center && git add src/lib/types.ts && git commit -m "feat: add TypeScript types for normalized data models"
```

---

## Task 3: Federal API Client Layer

**Files:**
- Create: `src/lib/api/sam-opportunities.ts`
- Create: `src/lib/api/sam-awards.ts`
- Create: `src/lib/api/usaspending.ts`
- Create: `src/lib/api/sam-entities.ts`
- Create: `src/lib/api/index.ts`

**Step 1: SAM.gov Opportunities client**

Create `src/lib/api/sam-opportunities.ts`:
```typescript
import type { Opportunity, NaicsCode, PointOfContact, SearchFilters } from "../types";

const BASE_URL = "https://api.sam.gov/opportunities/v2/search";

function getApiKey(): string {
  const key = process.env.SAM_GOV_API_KEY;
  if (!key) throw new Error("SAM_GOV_API_KEY environment variable is not set");
  return key;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function normalizeType(raw: string): Opportunity["type"] {
  const lower = raw.toLowerCase();
  if (lower.includes("presolicitation")) return "presolicitation";
  if (lower.includes("solicitation")) return "solicitation";
  if (lower.includes("award")) return "award";
  return "combined";
}

interface SamOpportunityRaw {
  noticeId: string;
  title: string;
  solicitationNumber?: string;
  postedDate: string;
  type: string;
  responseDeadLine?: string;
  typeOfSetAside?: string;
  naicsCode?: Array<{ code: string; description: string }>;
  classificationCode?: Array<{ code: string; description: string }>;
  pointOfContact?: Array<{
    type: string;
    fullName: string;
    email?: string;
    phone?: string;
  }>;
  placeOfPerformance?: {
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  resourceLinks?: Array<{ href: string }>;
  description?: string;
  department?: string;
  office?: string;
}

function normalizeOpportunity(raw: SamOpportunityRaw): Opportunity {
  return {
    id: raw.noticeId,
    title: raw.title,
    solicitationNumber: raw.solicitationNumber ?? null,
    type: normalizeType(raw.type),
    postedDate: raw.postedDate,
    responseDeadline: raw.responseDeadLine ?? null,
    agency: raw.department ?? "Unknown",
    office: raw.office ?? null,
    naicsCodes: (raw.naicsCode ?? []) as NaicsCode[],
    setAside: raw.typeOfSetAside ?? null,
    classificationCode: raw.classificationCode?.[0]?.code ?? null,
    placeOfPerformance: raw.placeOfPerformance
      ? {
          city: raw.placeOfPerformance.city ?? null,
          state: raw.placeOfPerformance.state ?? null,
          zip: raw.placeOfPerformance.zip ?? null,
          country: raw.placeOfPerformance.country ?? null,
        }
      : null,
    pointOfContact: (raw.pointOfContact ?? []).map(
      (poc): PointOfContact => ({
        type: poc.type,
        name: poc.fullName,
        email: poc.email ?? null,
        phone: poc.phone ?? null,
      })
    ),
    resourceLinks: (raw.resourceLinks ?? []).map((l) => l.href),
    description: raw.description ?? null,
  };
}

export async function searchOpportunities(
  filters: SearchFilters,
  limit = 25,
  offset = 0
): Promise<{ data: Opportunity[]; total: number }> {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", getApiKey());
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  if (filters.keywords) url.searchParams.set("title", filters.keywords);
  if (filters.naicsCodes?.length) url.searchParams.set("naicsCode", filters.naicsCodes[0]);
  if (filters.agencies?.length) url.searchParams.set("deptname", filters.agencies[0]);
  if (filters.setAsides?.length) url.searchParams.set("typeOfSetAside", filters.setAsides[0]);
  if (filters.postedFrom) url.searchParams.set("postedFrom", formatDate(filters.postedFrom));
  if (filters.postedTo) url.searchParams.set("postedTo", formatDate(filters.postedTo));
  if (filters.opportunityType) url.searchParams.set("ptype", filters.opportunityType);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`SAM.gov API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return {
    data: (json.opportunitiesData ?? []).map(normalizeOpportunity),
    total: json.totalRecords ?? 0,
  };
}

export async function getOpportunityById(noticeId: string): Promise<Opportunity | null> {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", getApiKey());
  url.searchParams.set("noticeid", noticeId);
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
  const items = json.opportunitiesData ?? [];
  return items.length > 0 ? normalizeOpportunity(items[0]) : null;
}
```

**Step 2: SAM.gov Contract Awards client (replaces deprecated FPDS)**

Create `src/lib/api/sam-awards.ts`:
```typescript
import type { Award } from "../types";

const BASE_URL = "https://api.sam.gov/opportunities/v2/search";

function getApiKey(): string {
  const key = process.env.SAM_GOV_API_KEY;
  if (!key) throw new Error("SAM_GOV_API_KEY environment variable is not set");
  return key;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

interface SamAwardRaw {
  noticeId: string;
  title: string;
  solicitationNumber?: string;
  postedDate: string;
  department?: string;
  office?: string;
  naicsCode?: Array<{ code: string; description: string }>;
  typeOfSetAside?: string;
  awardee?: string;
  awardNumber?: string;
  awardAmount?: number;
  awardDate?: string;
  description?: string;
}

function normalizeAward(raw: SamAwardRaw): Award {
  return {
    id: raw.noticeId,
    piid: raw.awardNumber ?? raw.solicitationNumber ?? raw.noticeId,
    agencyId: "",
    agencyName: raw.department ?? "Unknown",
    vendorName: raw.awardee ?? "Unknown",
    vendorUei: null,
    awardAmount: raw.awardAmount ?? 0,
    obligatedAmount: raw.awardAmount ?? 0,
    signedDate: raw.awardDate ?? raw.postedDate,
    effectiveDate: raw.awardDate ?? raw.postedDate,
    completionDate: null,
    naicsCode: raw.naicsCode?.[0]?.code ?? null,
    competitionType: null,
    setAside: raw.typeOfSetAside ?? null,
    contractType: null,
    description: raw.title,
  };
}

export async function searchAwards(
  filters: {
    naicsCode?: string;
    agency?: string;
    vendor?: string;
    postedFrom?: string;
    postedTo?: string;
  },
  limit = 25,
  offset = 0
): Promise<{ data: Award[]; total: number }> {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", getApiKey());
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("ptype", "a");

  if (filters.naicsCode) url.searchParams.set("naicsCode", filters.naicsCode);
  if (filters.agency) url.searchParams.set("deptname", filters.agency);
  if (filters.vendor) url.searchParams.set("title", filters.vendor);
  if (filters.postedFrom) url.searchParams.set("postedFrom", formatDate(filters.postedFrom));
  if (filters.postedTo) url.searchParams.set("postedTo", formatDate(filters.postedTo));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`SAM.gov Awards API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return {
    data: (json.opportunitiesData ?? []).map(normalizeAward),
    total: json.totalRecords ?? 0,
  };
}
```

**Step 3: USASpending client**

Create `src/lib/api/usaspending.ts`:
```typescript
import type { SpendingRecord, SpendingByTime } from "../types";

const BASE_URL = "https://api.usaspending.gov/api/v2";

async function postJson<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`USASpending API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

interface SpendingCategoryResponse {
  page_metadata: { total: number; hasNext: boolean };
  results: Array<{ code: string; description: string; amount: number; id?: number }>;
}

export async function getSpendingByAgency(
  startDate: string,
  endDate: string,
  page = 1,
  limit = 20
): Promise<{ data: SpendingRecord[]; total: number }> {
  const json = await postJson<SpendingCategoryResponse>(
    "/search/spending_by_category/awarding_agency",
    {
      filters: {
        time_period: [{ start_date: startDate, end_date: endDate, date_type: "action_date" }],
      },
      page,
      limit,
    }
  );

  return {
    data: json.results.map((r) => ({
      id: r.code,
      name: r.description,
      code: r.code,
      amount: r.amount,
    })),
    total: json.page_metadata.total,
  };
}

export async function getSpendingByNaics(
  startDate: string,
  endDate: string,
  page = 1,
  limit = 20
): Promise<{ data: SpendingRecord[]; total: number }> {
  const json = await postJson<SpendingCategoryResponse>(
    "/search/spending_by_category/naics",
    {
      filters: {
        time_period: [{ start_date: startDate, end_date: endDate, date_type: "action_date" }],
      },
      page,
      limit,
    }
  );

  return {
    data: json.results.map((r) => ({
      id: r.code,
      name: r.description,
      code: r.code,
      amount: r.amount,
    })),
    total: json.page_metadata.total,
  };
}

export async function getSpendingOverTime(
  startDate: string,
  endDate: string,
  group: "month" | "quarter" | "fiscal_year" = "month"
): Promise<SpendingByTime[]> {
  const json = await postJson<{
    results: Array<{ time_period: { fiscal_year: string; month?: string; quarter?: string }; aggregated_amount: number }>;
  }>("/search/spending_over_time/", {
    filters: {
      time_period: [{ start_date: startDate, end_date: endDate, date_type: "action_date" }],
    },
    group,
  });

  return json.results.map((r) => ({
    period: r.time_period.month
      ? `${r.time_period.fiscal_year}-${r.time_period.month}`
      : r.time_period.quarter
        ? `${r.time_period.fiscal_year} Q${r.time_period.quarter}`
        : r.time_period.fiscal_year,
    amount: r.aggregated_amount,
  }));
}

export async function searchAwardSpending(
  filters: {
    agencies?: string[];
    naicsCodes?: string[];
    keywords?: string;
    startDate?: string;
    endDate?: string;
  },
  page = 1,
  limit = 25
): Promise<{ data: SpendingRecord[]; total: number }> {
  const apiFilters: Record<string, unknown> = {};

  if (filters.startDate && filters.endDate) {
    apiFilters.time_period = [
      { start_date: filters.startDate, end_date: filters.endDate, date_type: "action_date" },
    ];
  }
  if (filters.agencies?.length) {
    apiFilters.agencies = filters.agencies.map((name) => ({
      type: "awarding",
      tier: "toptier",
      name,
    }));
  }
  if (filters.keywords) {
    apiFilters.keywords = [filters.keywords];
  }

  const json = await postJson<SpendingCategoryResponse>(
    "/search/spending_by_category/awarding_agency",
    { filters: apiFilters, page, limit }
  );

  return {
    data: json.results.map((r) => ({
      id: r.code,
      name: r.description,
      code: r.code,
      amount: r.amount,
    })),
    total: json.page_metadata.total,
  };
}
```

**Step 4: SAM.gov Entity client**

Create `src/lib/api/sam-entities.ts`:
```typescript
import type { Entity, NaicsCode, PointOfContact } from "../types";

const BASE_URL = "https://api.sam.gov/entity-information/v3/entities";

function getApiKey(): string {
  const key = process.env.SAM_GOV_API_KEY;
  if (!key) throw new Error("SAM_GOV_API_KEY environment variable is not set");
  return key;
}

interface SamEntityRaw {
  entityRegistration?: {
    ueiSAM?: string;
    cageCode?: string;
    legalBusinessName?: string;
    registrationStatus?: string;
    physicalAddress?: {
      city?: string;
      stateOrProvinceCode?: string;
      zipCode?: string;
      countryCode?: string;
    };
    profitStructureDesc?: string;
  };
  coreData?: {
    businessTypeList?: Array<{ businessTypeDesc?: string }>;
    sbaBusinessTypeList?: Array<{ sbaBusinessTypeDesc?: string }>;
    naicsCodeList?: Array<{ naicsCode?: string; naicsDescription?: string }>;
    pointsOfContact?: {
      governmentBusinessPOC?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        usPhone?: string;
      };
    };
  };
}

function normalizeEntity(raw: SamEntityRaw): Entity {
  const reg = raw.entityRegistration ?? {};
  const core = raw.coreData ?? {};

  const naicsList = (core.naicsCodeList ?? [])
    .filter((n) => n.naicsCode)
    .map((n): NaicsCode => ({
      code: n.naicsCode!,
      description: n.naicsDescription ?? "",
    }));

  const sbaStatuses = (core.sbaBusinessTypeList ?? [])
    .map((s) => s.sbaBusinessTypeDesc)
    .filter(Boolean) as string[];

  const poc = core.pointsOfContact?.governmentBusinessPOC;

  return {
    uei: reg.ueiSAM ?? "",
    cageCode: reg.cageCode ?? null,
    legalBusinessName: reg.legalBusinessName ?? "Unknown",
    registrationStatus: reg.registrationStatus ?? "Unknown",
    physicalAddress: {
      city: reg.physicalAddress?.city ?? null,
      state: reg.physicalAddress?.stateOrProvinceCode ?? null,
      zip: reg.physicalAddress?.zipCode ?? null,
      country: reg.physicalAddress?.countryCode ?? null,
    },
    naicsCodes: naicsList,
    socioeconomicStatuses: sbaStatuses,
    businessType: core.businessTypeList?.[0]?.businessTypeDesc ?? null,
    profitStructure: reg.profitStructureDesc ?? null,
    pointOfContact: poc
      ? ({
          type: "Government Business POC",
          name: `${poc.firstName ?? ""} ${poc.lastName ?? ""}`.trim(),
          email: poc.email ?? null,
          phone: poc.usPhone ?? null,
        } as PointOfContact)
      : null,
  };
}

export async function searchEntities(
  query: string,
  limit = 25,
  offset = 0
): Promise<{ data: Entity[]; total: number }> {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", getApiKey());
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("includeSections", "entityRegistration,coreData");
  url.searchParams.set("q", query);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`SAM.gov Entity API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return {
    data: (json.entityData ?? []).map(normalizeEntity),
    total: json.totalRecords ?? 0,
  };
}

export async function getEntityByUei(uei: string): Promise<Entity | null> {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", getApiKey());
  url.searchParams.set("ueiSAM", uei);
  url.searchParams.set("includeSections", "entityRegistration,coreData");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
  const items = json.entityData ?? [];
  return items.length > 0 ? normalizeEntity(items[0]) : null;
}

export async function getEntitiesByNaics(
  naicsCode: string,
  limit = 25,
  offset = 0
): Promise<{ data: Entity[]; total: number }> {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", getApiKey());
  url.searchParams.set("naicsCode", naicsCode);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("includeSections", "entityRegistration,coreData");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`SAM.gov Entity API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return {
    data: (json.entityData ?? []).map(normalizeEntity),
    total: json.totalRecords ?? 0,
  };
}
```

**Step 5: Create barrel export**

Create `src/lib/api/index.ts`:
```typescript
export * from "./sam-opportunities";
export * from "./sam-awards";
export * from "./usaspending";
export * from "./sam-entities";
```

**Step 6: Commit**

```bash
cd ~/Projects/govcon-command-center && git add src/lib/ && git commit -m "feat: add federal API client layer with normalized models"
```

---

## Task 4: SQLite Database Layer

**Files:**
- Create: `src/lib/db/index.ts`
- Create: `src/lib/db/migrations.ts`

**Step 1: Create database initialization and migrations**

Create `src/lib/db/migrations.ts`:
```typescript
import Database from "better-sqlite3";

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filters TEXT NOT NULL,
      notify INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pipeline_items (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'tracking',
      notes TEXT,
      decision_date TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tracked_entities (
      id TEXT PRIMARY KEY,
      uei TEXT NOT NULL,
      name TEXT NOT NULL,
      relationship TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alert_rules (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      config TEXT NOT NULL DEFAULT '{}',
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS preferences (
      id TEXT PRIMARY KEY DEFAULT 'default',
      default_naics TEXT DEFAULT '["541511","541512","541519"]',
      refresh_rates TEXT DEFAULT '{"opportunities":60000,"awards":300000,"spending":300000}',
      panel_layout TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_pipeline_stage ON pipeline_items(stage);
    CREATE INDEX IF NOT EXISTS idx_pipeline_opportunity ON pipeline_items(opportunity_id);
    CREATE INDEX IF NOT EXISTS idx_tracked_entities_uei ON tracked_entities(uei);
  `);
}
```

**Step 2: Create database singleton and CRUD operations**

Create `src/lib/db/index.ts`:
```typescript
import Database from "better-sqlite3";
import path from "path";
import { runMigrations } from "./migrations";
import type {
  PipelineItem,
  PipelineStage,
  SavedSearch,
  SearchFilters,
  TrackedEntity,
  EntityRelationship,
  AlertRule,
  AlertType,
} from "../types";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "data", "govcon.db");
    const fs = require("fs");
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    runMigrations(db);
  }
  return db;
}

function generateId(): string {
  return crypto.randomUUID();
}

// === Pipeline Items ===

export function getPipelineItems(): PipelineItem[] {
  const rows = getDb().prepare("SELECT * FROM pipeline_items ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: row.id as string,
    opportunityId: row.opportunity_id as string,
    stage: row.stage as PipelineStage,
    notes: row.notes as string | null,
    decisionDate: row.decision_date as string | null,
    tags: JSON.parse((row.tags as string) || "[]"),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export function getPipelineItemsByStage(stage: PipelineStage): PipelineItem[] {
  const rows = getDb()
    .prepare("SELECT * FROM pipeline_items WHERE stage = ? ORDER BY updated_at DESC")
    .all(stage) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: row.id as string,
    opportunityId: row.opportunity_id as string,
    stage: row.stage as PipelineStage,
    notes: row.notes as string | null,
    decisionDate: row.decision_date as string | null,
    tags: JSON.parse((row.tags as string) || "[]"),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export function createPipelineItem(opportunityId: string, stage: PipelineStage = "tracking"): PipelineItem {
  const id = generateId();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      "INSERT INTO pipeline_items (id, opportunity_id, stage, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(id, opportunityId, stage, now, now);
  return { id, opportunityId, stage, notes: null, decisionDate: null, tags: [], createdAt: now, updatedAt: now };
}

export function updatePipelineItem(
  id: string,
  updates: { stage?: PipelineStage; notes?: string; decisionDate?: string; tags?: string[] }
): void {
  const sets: string[] = ["updated_at = datetime('now')"];
  const values: unknown[] = [];

  if (updates.stage !== undefined) { sets.push("stage = ?"); values.push(updates.stage); }
  if (updates.notes !== undefined) { sets.push("notes = ?"); values.push(updates.notes); }
  if (updates.decisionDate !== undefined) { sets.push("decision_date = ?"); values.push(updates.decisionDate); }
  if (updates.tags !== undefined) { sets.push("tags = ?"); values.push(JSON.stringify(updates.tags)); }

  values.push(id);
  getDb().prepare(`UPDATE pipeline_items SET ${sets.join(", ")} WHERE id = ?`).run(...values);
}

export function deletePipelineItem(id: string): void {
  getDb().prepare("DELETE FROM pipeline_items WHERE id = ?").run(id);
}

// === Saved Searches ===

export function getSavedSearches(): SavedSearch[] {
  const rows = getDb().prepare("SELECT * FROM saved_searches ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    filters: JSON.parse(row.filters as string) as SearchFilters,
    notify: Boolean(row.notify),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export function createSavedSearch(name: string, filters: SearchFilters): SavedSearch {
  const id = generateId();
  const now = new Date().toISOString();
  getDb()
    .prepare("INSERT INTO saved_searches (id, name, filters, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, name, JSON.stringify(filters), now, now);
  return { id, name, filters, notify: true, createdAt: now, updatedAt: now };
}

export function deleteSavedSearch(id: string): void {
  getDb().prepare("DELETE FROM saved_searches WHERE id = ?").run(id);
}

// === Tracked Entities ===

export function getTrackedEntities(): TrackedEntity[] {
  const rows = getDb().prepare("SELECT * FROM tracked_entities ORDER BY created_at DESC").all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: row.id as string,
    uei: row.uei as string,
    name: row.name as string,
    relationship: row.relationship as EntityRelationship,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
  }));
}

export function createTrackedEntity(
  uei: string,
  name: string,
  relationship: EntityRelationship
): TrackedEntity {
  const id = generateId();
  const now = new Date().toISOString();
  getDb()
    .prepare("INSERT INTO tracked_entities (id, uei, name, relationship, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, uei, name, relationship, now);
  return { id, uei, name, relationship, notes: null, createdAt: now };
}

export function deleteTrackedEntity(id: string): void {
  getDb().prepare("DELETE FROM tracked_entities WHERE id = ?").run(id);
}

// === Alert Rules ===

export function getAlertRules(): AlertRule[] {
  const rows = getDb().prepare("SELECT * FROM alert_rules WHERE enabled = 1").all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: row.id as string,
    type: row.type as AlertType,
    config: JSON.parse(row.config as string),
    enabled: Boolean(row.enabled),
    createdAt: row.created_at as string,
  }));
}

// === Preferences ===

export interface Preferences {
  defaultNaics: string[];
  refreshRates: Record<string, number>;
  panelLayout: Record<string, unknown>;
}

export function getPreferences(): Preferences {
  const row = getDb().prepare("SELECT * FROM preferences WHERE id = 'default'").get() as Record<string, unknown> | undefined;
  if (!row) {
    getDb().prepare("INSERT INTO preferences (id) VALUES ('default')").run();
    return {
      defaultNaics: ["541511", "541512", "541519"],
      refreshRates: { opportunities: 60000, awards: 300000, spending: 300000 },
      panelLayout: {},
    };
  }
  return {
    defaultNaics: JSON.parse(row.default_naics as string),
    refreshRates: JSON.parse(row.refresh_rates as string),
    panelLayout: JSON.parse(row.panel_layout as string),
  };
}

export function updatePreferences(updates: Partial<Preferences>): void {
  const sets: string[] = ["updated_at = datetime('now')"];
  const values: unknown[] = [];

  if (updates.defaultNaics) { sets.push("default_naics = ?"); values.push(JSON.stringify(updates.defaultNaics)); }
  if (updates.refreshRates) { sets.push("refresh_rates = ?"); values.push(JSON.stringify(updates.refreshRates)); }
  if (updates.panelLayout) { sets.push("panel_layout = ?"); values.push(JSON.stringify(updates.panelLayout)); }

  values.push("default");
  getDb().prepare(`UPDATE preferences SET ${sets.join(", ")} WHERE id = ?`).run(...values);
}
```

**Step 3: Add data/ to .gitignore**

Append to `.gitignore`:
```
data/
```

**Step 4: Commit**

```bash
cd ~/Projects/govcon-command-center && git add src/lib/db/ .gitignore && git commit -m "feat: add SQLite database layer with CRUD operations"
```

---

## Task 5: Next.js API Routes

**Files:**
- Create: `src/app/api/opportunities/route.ts`
- Create: `src/app/api/awards/route.ts`
- Create: `src/app/api/spending/route.ts`
- Create: `src/app/api/entities/route.ts`
- Create: `src/app/api/pipeline/route.ts`
- Create: `src/app/api/pipeline/[id]/route.ts`
- Create: `src/app/api/saved-searches/route.ts`
- Create: `src/app/api/preferences/route.ts`

**Step 1: Opportunities route**

Create `src/app/api/opportunities/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { searchOpportunities } from "@/lib/api/sam-opportunities";
import type { SearchFilters } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filters: SearchFilters = {};

    if (params.get("keywords")) filters.keywords = params.get("keywords")!;
    if (params.get("naicsCodes")) filters.naicsCodes = params.get("naicsCodes")!.split(",");
    if (params.get("agencies")) filters.agencies = params.get("agencies")!.split(",");
    if (params.get("setAsides")) filters.setAsides = params.get("setAsides")!.split(",");
    if (params.get("postedFrom")) filters.postedFrom = params.get("postedFrom")!;
    if (params.get("postedTo")) filters.postedTo = params.get("postedTo")!;
    if (params.get("type")) filters.opportunityType = params.get("type")!;

    const limit = parseInt(params.get("limit") ?? "25", 10);
    const offset = parseInt(params.get("offset") ?? "0", 10);

    const result = await searchOpportunities(filters, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Awards route**

Create `src/app/api/awards/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { searchAwards } from "@/lib/api/sam-awards";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filters = {
      naicsCode: params.get("naicsCode") ?? undefined,
      agency: params.get("agency") ?? undefined,
      vendor: params.get("vendor") ?? undefined,
      postedFrom: params.get("postedFrom") ?? undefined,
      postedTo: params.get("postedTo") ?? undefined,
    };

    const limit = parseInt(params.get("limit") ?? "25", 10);
    const offset = parseInt(params.get("offset") ?? "0", 10);

    const result = await searchAwards(filters, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 3: Spending route**

Create `src/app/api/spending/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSpendingByAgency, getSpendingByNaics, getSpendingOverTime } from "@/lib/api/usaspending";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const view = params.get("view") ?? "agency";
    const startDate = params.get("startDate") ?? "2025-10-01";
    const endDate = params.get("endDate") ?? new Date().toISOString().split("T")[0];
    const page = parseInt(params.get("page") ?? "1", 10);

    if (view === "agency") {
      const result = await getSpendingByAgency(startDate, endDate, page);
      return NextResponse.json(result);
    } else if (view === "naics") {
      const result = await getSpendingByNaics(startDate, endDate, page);
      return NextResponse.json(result);
    } else if (view === "time") {
      const group = (params.get("group") as "month" | "quarter" | "fiscal_year") ?? "month";
      const result = await getSpendingOverTime(startDate, endDate, group);
      return NextResponse.json({ data: result });
    }

    return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 4: Entities route**

Create `src/app/api/entities/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { searchEntities, getEntityByUei } from "@/lib/api/sam-entities";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const uei = params.get("uei");
    const query = params.get("q");

    if (uei) {
      const entity = await getEntityByUei(uei);
      return entity
        ? NextResponse.json(entity)
        : NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    if (query) {
      const limit = parseInt(params.get("limit") ?? "25", 10);
      const offset = parseInt(params.get("offset") ?? "0", 10);
      const result = await searchEntities(query, limit, offset);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Provide 'uei' or 'q' parameter" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 5: Pipeline routes**

Create `src/app/api/pipeline/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getPipelineItems, createPipelineItem } from "@/lib/db";
import type { PipelineStage } from "@/lib/types";

export async function GET() {
  try {
    const items = getPipelineItems();
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { opportunityId, stage } = body as { opportunityId: string; stage?: PipelineStage };

    if (!opportunityId) {
      return NextResponse.json({ error: "opportunityId is required" }, { status: 400 });
    }

    const item = createPipelineItem(opportunityId, stage);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

Create `src/app/api/pipeline/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { updatePipelineItem, deletePipelineItem } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    updatePipelineItem(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deletePipelineItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 6: Saved searches route**

Create `src/app/api/saved-searches/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSavedSearches, createSavedSearch, deleteSavedSearch } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json(getSavedSearches());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, filters } = await req.json();
    if (!name || !filters) {
      return NextResponse.json({ error: "name and filters required" }, { status: 400 });
    }
    const search = createSavedSearch(name, filters);
    return NextResponse.json(search, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    deleteSavedSearch(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 7: Preferences route**

Create `src/app/api/preferences/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getPreferences, updatePreferences } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json(getPreferences());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    updatePreferences(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 8: Commit**

```bash
cd ~/Projects/govcon-command-center && git add src/app/api/ && git commit -m "feat: add Next.js API routes for all data sources and local CRUD"
```

---

## Task 6: React Query Hooks

**Files:**
- Create: `src/hooks/use-opportunities.ts`
- Create: `src/hooks/use-awards.ts`
- Create: `src/hooks/use-spending.ts`
- Create: `src/hooks/use-pipeline.ts`
- Create: `src/hooks/use-keyboard-shortcuts.ts`
- Create: `src/hooks/index.ts`

**Step 1: Opportunities hook**

Create `src/hooks/use-opportunities.ts`:
```typescript
import { useQuery } from "@tanstack/react-query";
import type { Opportunity, SearchFilters } from "@/lib/types";

async function fetchOpportunities(
  filters: SearchFilters,
  limit: number,
  offset: number
): Promise<{ data: Opportunity[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.keywords) params.set("keywords", filters.keywords);
  if (filters.naicsCodes?.length) params.set("naicsCodes", filters.naicsCodes.join(","));
  if (filters.agencies?.length) params.set("agencies", filters.agencies.join(","));
  if (filters.setAsides?.length) params.set("setAsides", filters.setAsides.join(","));
  if (filters.postedFrom) params.set("postedFrom", filters.postedFrom);
  if (filters.postedTo) params.set("postedTo", filters.postedTo);
  if (filters.opportunityType) params.set("type", filters.opportunityType);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const res = await fetch(`/api/opportunities?${params}`);
  if (!res.ok) throw new Error("Failed to fetch opportunities");
  return res.json();
}

export function useOpportunities(filters: SearchFilters, limit = 25, offset = 0) {
  return useQuery({
    queryKey: ["opportunities", filters, limit, offset],
    queryFn: () => fetchOpportunities(filters, limit, offset),
    refetchInterval: 60 * 1000,
  });
}
```

**Step 2: Awards hook**

Create `src/hooks/use-awards.ts`:
```typescript
import { useQuery } from "@tanstack/react-query";
import type { Award } from "@/lib/types";

async function fetchAwards(filters: {
  naicsCode?: string;
  agency?: string;
  vendor?: string;
}): Promise<{ data: Award[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.naicsCode) params.set("naicsCode", filters.naicsCode);
  if (filters.agency) params.set("agency", filters.agency);
  if (filters.vendor) params.set("vendor", filters.vendor);

  const res = await fetch(`/api/awards?${params}`);
  if (!res.ok) throw new Error("Failed to fetch awards");
  return res.json();
}

export function useAwards(filters: { naicsCode?: string; agency?: string; vendor?: string } = {}) {
  return useQuery({
    queryKey: ["awards", filters],
    queryFn: () => fetchAwards(filters),
    refetchInterval: 5 * 60 * 1000,
  });
}
```

**Step 3: Spending hook**

Create `src/hooks/use-spending.ts`:
```typescript
import { useQuery } from "@tanstack/react-query";
import type { SpendingRecord, SpendingByTime } from "@/lib/types";

async function fetchSpending(
  view: "agency" | "naics" | "time",
  startDate: string,
  endDate: string
): Promise<{ data: SpendingRecord[] | SpendingByTime[] }> {
  const params = new URLSearchParams({ view, startDate, endDate });
  const res = await fetch(`/api/spending?${params}`);
  if (!res.ok) throw new Error("Failed to fetch spending");
  return res.json();
}

export function useSpending(
  view: "agency" | "naics" | "time" = "agency",
  startDate = "2025-10-01",
  endDate = new Date().toISOString().split("T")[0]
) {
  return useQuery({
    queryKey: ["spending", view, startDate, endDate],
    queryFn: () => fetchSpending(view, startDate, endDate),
    refetchInterval: 5 * 60 * 1000,
  });
}
```

**Step 4: Pipeline hook with mutations**

Create `src/hooks/use-pipeline.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PipelineItem, PipelineStage } from "@/lib/types";

async function fetchPipeline(): Promise<PipelineItem[]> {
  const res = await fetch("/api/pipeline");
  if (!res.ok) throw new Error("Failed to fetch pipeline");
  return res.json();
}

export function usePipeline() {
  return useQuery({
    queryKey: ["pipeline"],
    queryFn: fetchPipeline,
  });
}

export function useAddToPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ opportunityId, stage }: { opportunityId: string; stage?: PipelineStage }) => {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId, stage }),
      });
      if (!res.ok) throw new Error("Failed to add to pipeline");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}

export function useUpdatePipelineItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; stage?: PipelineStage; notes?: string; decisionDate?: string; tags?: string[] }) => {
      const res = await fetch(`/api/pipeline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update pipeline item");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}

export function useDeletePipelineItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pipeline/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete pipeline item");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline"] }),
  });
}
```

**Step 5: Keyboard shortcuts hook**

Create `src/hooks/use-keyboard-shortcuts.ts`:
```typescript
import { useEffect } from "react";

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (isInput && e.key !== "Escape") return;

      const handler = shortcuts[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
```

**Step 6: Barrel export**

Create `src/hooks/index.ts`:
```typescript
export { useOpportunities } from "./use-opportunities";
export { useAwards } from "./use-awards";
export { useSpending } from "./use-spending";
export { usePipeline, useAddToPipeline, useUpdatePipelineItem, useDeletePipelineItem } from "./use-pipeline";
export { useKeyboardShortcuts } from "./use-keyboard-shortcuts";
```

**Step 7: Commit**

```bash
cd ~/Projects/govcon-command-center && git add src/hooks/ && git commit -m "feat: add React Query hooks for all data sources and pipeline mutations"
```

---

## Task 7: Command Center Dashboard Shell

**Files:**
- Create: `src/components/dashboard/header.tsx`
- Create: `src/components/dashboard/panel.tsx`
- Create: `src/components/dashboard/command-center.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Panel wrapper component**

Create `src/components/dashboard/panel.tsx`:
```tsx
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
```

**Step 2: Header component**

Create `src/components/dashboard/header.tsx`:
```tsx
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
```

**Step 3: Command Center layout**

Create `src/components/dashboard/command-center.tsx`:
```tsx
"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Header } from "./header";
import { Panel } from "./panel";
import { OpportunityFeed } from "../panels/opportunity-feed";
import { PipelineTracker } from "../panels/pipeline-tracker";
import { RecentAwards } from "../panels/recent-awards";
import { SpendingTrends } from "../panels/spending-trends";
import { AlertsPanel } from "../panels/alerts-panel";
import { OpportunityDrawer } from "../drawers/opportunity-drawer";
import { useKeyboardShortcuts } from "@/hooks";
import type { Opportunity, SearchFilters } from "@/lib/types";

export function CommandCenter() {
  const [globalFilters, setGlobalFilters] = useState<SearchFilters>({
    naicsCodes: ["541511"],
  });
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showAlerts, setShowAlerts] = useState(true);
  const searchFocusRef = useRef<(() => void) | null>(null);

  const handleSearch = useCallback((query: string) => {
    setGlobalFilters((prev) => ({ ...prev, keywords: query || undefined }));
  }, []);

  const shortcuts = useMemo(
    () => ({
      "/": () => searchFocusRef.current?.(),
      Escape: () => setSelectedOpportunity(null),
      r: () => window.dispatchEvent(new CustomEvent("refresh-all")),
    }),
    []
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        onSearch={handleSearch}
        alertCount={0}
        onToggleAlerts={() => setShowAlerts((s) => !s)}
        onToggleSettings={() => {}}
        searchFocusRef={searchFocusRef}
      />

      <div className="flex-1 grid grid-rows-[1fr_1fr] grid-cols-[2fr_3fr] gap-px bg-border overflow-hidden">
        {/* Top Left: Opportunity Feed */}
        <div className="row-span-1 col-span-1">
          <OpportunityFeed
            filters={globalFilters}
            onSelect={setSelectedOpportunity}
          />
        </div>

        {/* Top Right: Pipeline Tracker */}
        <div className="row-span-1 col-span-1">
          <PipelineTracker />
        </div>

        {/* Bottom Left: Recent Awards */}
        <div className="row-span-1 col-span-1">
          <RecentAwards naicsCode={globalFilters.naicsCodes?.[0]} />
        </div>

        {/* Bottom Right: Spending + Alerts */}
        <div className="row-span-1 col-span-1 grid grid-cols-[1fr_1fr] gap-px bg-border">
          <SpendingTrends />
          <AlertsPanel />
        </div>
      </div>

      {/* Opportunity Detail Drawer */}
      {selectedOpportunity && (
        <OpportunityDrawer
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </div>
  );
}
```

**Step 4: Update page.tsx**

Replace `src/app/page.tsx`:
```tsx
import { CommandCenter } from "@/components/dashboard/command-center";

export default function Home() {
  return <CommandCenter />;
}
```

**Step 5: Commit**

```bash
cd ~/Projects/govcon-command-center && git add src/components/dashboard/ src/app/page.tsx && git commit -m "feat: add command center dashboard shell with panel layout"
```

---

## Task 8: Opportunity Feed Panel

**Files:**
- Create: `src/components/panels/opportunity-feed.tsx`
- Create: `src/components/ui/deadline-badge.tsx`

**Step 1: Deadline badge component**

Create `src/components/ui/deadline-badge.tsx`:
```tsx
import { differenceInDays, parseISO } from "date-fns";

export function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return <span className="text-[10px] text-muted-foreground">No deadline</span>;

  const days = differenceInDays(parseISO(deadline), new Date());

  let color = "text-green-500";
  if (days <= 3) color = "text-red-500";
  else if (days <= 7) color = "text-amber-500";
  else if (days <= 14) color = "text-amber-400";

  if (days < 0) {
    return <span className="text-[10px] text-muted-foreground line-through">Closed</span>;
  }

  return (
    <span className={`text-[10px] font-mono-data font-semibold ${color}`}>
      {days === 0 ? "TODAY" : days === 1 ? "1 DAY" : `${days} DAYS`}
    </span>
  );
}
```

**Step 2: Opportunity Feed panel**

Create `src/components/panels/opportunity-feed.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Panel } from "../dashboard/panel";
import { DeadlineBadge } from "../ui/deadline-badge";
import { Badge } from "@/components/ui/badge";
import { useOpportunities } from "@/hooks";
import type { Opportunity, SearchFilters } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  presolicitation: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  solicitation: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  award: "bg-green-500/20 text-green-500 border-green-500/30",
  combined: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
};

interface OpportunityFeedProps {
  filters: SearchFilters;
  onSelect: (opp: Opportunity) => void;
}

export function OpportunityFeed({ filters, onSelect }: OpportunityFeedProps) {
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  const activeFilters = { ...filters, opportunityType: typeFilter };
  const { data, isLoading, dataUpdatedAt } = useOpportunities(activeFilters);

  const types = ["p", "o", "a"] as const;
  const typeLabels: Record<string, string> = { p: "PRE-SOL", o: "SOL", a: "AWARD" };

  return (
    <Panel
      title="Opportunities"
      lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
      isLoading={isLoading}
      className="h-full"
      actions={
        <div className="flex gap-1">
          <button
            onClick={() => setTypeFilter(undefined)}
            className={`px-1.5 py-0.5 text-[10px] font-mono-data rounded ${
              !typeFilter ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ALL
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? undefined : t)}
              className={`px-1.5 py-0.5 text-[10px] font-mono-data rounded ${
                typeFilter === t ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {typeLabels[t]}
            </button>
          ))}
        </div>
      }
    >
      {isLoading && !data ? (
        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
          Loading opportunities...
        </div>
      ) : (
        <div className="divide-y divide-border">
          {data?.data.map((opp) => (
            <button
              key={opp.id}
              onClick={() => onSelect(opp)}
              className="w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{opp.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {opp.agency} {opp.office ? `· ${opp.office}` : ""}
                  </p>
                </div>
                <DeadlineBadge deadline={opp.responseDeadline} />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="outline" className={`text-[9px] px-1 py-0 ${TYPE_COLORS[opp.type] ?? ""}`}>
                  {opp.type.toUpperCase()}
                </Badge>
                {opp.naicsCodes[0] && (
                  <span className="text-[9px] font-mono-data text-muted-foreground">
                    {opp.naicsCodes[0].code}
                  </span>
                )}
                {opp.setAside && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-cyan-500/30 text-cyan-500">
                    {opp.setAside}
                  </Badge>
                )}
              </div>
            </button>
          ))}
          {data?.data.length === 0 && (
            <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
              No opportunities found
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
```

**Step 3: Commit**

```bash
cd ~/Projects/govcon-command-center && git add src/components/ && git commit -m "feat: add opportunity feed panel with type filters and deadline badges"
```

---

## Task 9: Pipeline Tracker Panel (Kanban)

**Files:**
- Create: `src/components/panels/pipeline-tracker.tsx`

**Step 1: Pipeline Kanban panel**

Create `src/components/panels/pipeline-tracker.tsx`:
```tsx
"use client";

import { Panel } from "../dashboard/panel";
import { DeadlineBadge } from "../ui/deadline-badge";
import { usePipeline, useUpdatePipelineItem, useDeletePipelineItem } from "@/hooks";
import type { PipelineItem, PipelineStage } from "@/lib/types";

const STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: "tracking", label: "TRACK", color: "border-t-blue-500" },
  { key: "bid_no_bid", label: "BID/NO-BID", color: "border-t-amber-500" },
  { key: "drafting", label: "DRAFT", color: "border-t-cyan-500" },
  { key: "submitted", label: "SUBMIT", color: "border-t-purple-500" },
  { key: "awarded", label: "WON", color: "border-t-green-500" },
  { key: "lost", label: "LOST", color: "border-t-red-500" },
];

export function PipelineTracker() {
  const { data: items, isLoading, dataUpdatedAt } = usePipeline();
  const updateMutation = useUpdatePipelineItem();
  const deleteMutation = useDeletePipelineItem();

  const itemsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = (items ?? []).filter((item) => item.stage === stage.key);
      return acc;
    },
    {} as Record<PipelineStage, PipelineItem[]>
  );

  function handleDrop(itemId: string, newStage: PipelineStage) {
    updateMutation.mutate({ id: itemId, stage: newStage });
  }

  return (
    <Panel
      title="Pipeline"
      lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
      isLoading={isLoading}
      className="h-full"
    >
      <div className="flex h-full divide-x divide-border">
        {STAGES.map((stage) => (
          <div
            key={stage.key}
            className={`flex-1 flex flex-col min-w-0 border-t-2 ${stage.color}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const itemId = e.dataTransfer.getData("text/plain");
              if (itemId) handleDrop(itemId, stage.key);
            }}
          >
            <div className="px-2 py-1.5 border-b border-border">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                {stage.label}
              </span>
              <span className="ml-1 text-[9px] font-mono-data text-muted-foreground">
                {itemsByStage[stage.key]?.length ?? 0}
              </span>
            </div>
            <div className="flex-1 overflow-auto p-1 space-y-1">
              {itemsByStage[stage.key]?.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                  className="p-2 bg-background border border-border rounded-sm cursor-grab active:cursor-grabbing hover:border-muted-foreground/30 transition-colors group"
                >
                  <p className="text-[10px] text-foreground truncate">
                    {item.opportunityId}
                  </p>
                  {item.notes && (
                    <p className="text-[9px] text-muted-foreground truncate mt-0.5">{item.notes}</p>
                  )}
                  {item.decisionDate && (
                    <div className="mt-1">
                      <DeadlineBadge deadline={item.decisionDate} />
                    </div>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="hidden group-hover:block absolute top-1 right-1 text-[9px] text-red-500 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
```

**Step 2: Commit**

```bash
cd ~/Projects/govcon-command-center && git add src/components/panels/pipeline-tracker.tsx && git commit -m "feat: add pipeline kanban tracker with drag-and-drop"
```

---

## Task 10: Recent Awards Panel

**Files:**
- Create: `src/components/panels/recent-awards.tsx`

**Step 1: Awards panel**

Create `src/components/panels/recent-awards.tsx`:
```tsx
"use client";

import { Panel } from "../dashboard/panel";
import { Badge } from "@/components/ui/badge";
import { useAwards } from "@/hooks";

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

interface RecentAwardsProps {
  naicsCode?: string;
}

export function RecentAwards({ naicsCode }: RecentAwardsProps) {
  const { data, isLoading, dataUpdatedAt } = useAwards({ naicsCode });

  return (
    <Panel
      title="Recent Awards"
      lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
      isLoading={isLoading}
      className="h-full"
    >
      {isLoading && !data ? (
        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
          Loading awards...
        </div>
      ) : (
        <div className="divide-y divide-border">
          {data?.data.map((award) => (
            <div key={award.id} className="px-3 py-2 hover:bg-secondary/50 transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{award.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {award.agencyName}
                  </p>
                </div>
                <span className="text-xs font-mono-data text-green-500 font-semibold whitespace-nowrap">
                  {formatCurrency(award.awardAmount)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-mono-data text-cyan-500">
                  {award.vendorName}
                </span>
                {award.naicsCode && (
                  <span className="text-[9px] font-mono-data text-muted-foreground">
                    {award.naicsCode}
                  </span>
                )}
                {award.setAside && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 text-amber-500">
                    {award.setAside}
                  </Badge>
                )}
                {award.competitionType && (
                  <span className="text-[9px] text-muted-foreground">{award.competitionType}</span>
                )}
              </div>
              <div className="text-[9px] font-mono-data text-muted-foreground mt-0.5">
                {award.signedDate} · PIID: {award.piid}
              </div>
            </div>
          ))}
          {data?.data.length === 0 && (
            <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
              No recent awards found
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
```

**Step 2: Commit**

```bash
cd ~/Projects/govcon-command-center && git add src/components/panels/recent-awards.tsx && git commit -m "feat: add recent awards panel with vendor and amount display"
```

---

## Task 11: Spending Trends Panel

**Files:**
- Create: `src/components/panels/spending-trends.tsx`

**Step 1: Spending panel with charts**

Create `src/components/panels/spending-trends.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Panel } from "../dashboard/panel";
import { useSpending } from "@/hooks";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { SpendingRecord, SpendingByTime } from "@/lib/types";

type SpendingView = "agency" | "naics" | "time";

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

const BAR_COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function SpendingTrends() {
  const [view, setView] = useState<SpendingView>("agency");
  const { data, isLoading, dataUpdatedAt } = useSpending(view);

  const chartData =
    view === "time"
      ? (data?.data as SpendingByTime[])?.map((d) => ({ name: d.period, value: d.amount })) ?? []
      : (data?.data as SpendingRecord[])?.slice(0, 8).map((d) => ({ name: d.name, value: d.amount })) ?? [];

  const views: { key: SpendingView; label: string }[] = [
    { key: "agency", label: "AGENCY" },
    { key: "naics", label: "NAICS" },
    { key: "time", label: "TREND" },
  ];

  return (
    <Panel
      title="Spending"
      lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
      isLoading={isLoading}
      className="h-full"
      actions={
        <div className="flex gap-1">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-1.5 py-0.5 text-[10px] font-mono-data rounded ${
                view === v.key ? "bg-cyan-500/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      }
    >
      {isLoading && !data ? (
        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
          Loading spending data...
        </div>
      ) : chartData.length > 0 ? (
        <div className="p-2 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
              <XAxis
                type="number"
                tickFormatter={formatCompact}
                tick={{ fontSize: 9, fill: "hsl(215, 20%, 45%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 9, fill: "hsl(214, 32%, 91%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatCompact(value), "Amount"]}
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 6%)",
                  border: "1px solid hsl(217, 33%, 12%)",
                  borderRadius: "2px",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "hsl(214, 32%, 91%)" }}
              />
              <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
          No spending data available
        </div>
      )}
    </Panel>
  );
}
```

**Step 2: Commit**

```bash
cd ~/Projects/govcon-command-center && git add src/components/panels/spending-trends.tsx && git commit -m "feat: add spending trends panel with bar charts"
```

---

## Task 12: Alerts Panel

**Files:**
- Create: `src/components/panels/alerts-panel.tsx`

**Step 1: Alerts panel**

Create `src/components/panels/alerts-panel.tsx`:
```tsx
"use client";

import { Panel } from "../dashboard/panel";
import { usePipeline } from "@/hooks";
import { differenceInDays, parseISO } from "date-fns";
import type { Alert } from "@/lib/types";

export function AlertsPanel() {
  const { data: pipelineItems } = usePipeline();

  // Generate alerts from pipeline deadlines
  const alerts: Alert[] = (pipelineItems ?? [])
    .filter((item) => item.decisionDate)
    .map((item) => {
      const days = differenceInDays(parseISO(item.decisionDate!), new Date());
      return {
        id: `deadline-${item.id}`,
        type: "deadline_approaching" as const,
        title: days <= 0 ? "Deadline passed" : days <= 7 ? "Deadline approaching" : "Upcoming deadline",
        message: `${item.opportunityId} — ${days <= 0 ? "overdue" : `${days} days remaining`}`,
        relatedId: item.opportunityId,
        read: false,
        createdAt: new Date().toISOString(),
      };
    })
    .filter((a) => {
      const days = differenceInDays(parseISO((pipelineItems ?? []).find((p) => `deadline-${p.id}` === a.id)?.decisionDate ?? ""), new Date());
      return days <= 30;
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const alertColors: Record<string, string> = {
    deadline_approaching: "border-l-amber-500",
    incumbent_award: "border-l-green-500",
    new_presolicitation: "border-l-blue-500",
    saved_search_match: "border-l-cyan-500",
  };

  return (
    <Panel title="Alerts" className="h-full">
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-xs text-muted-foreground">
          <p>No active alerts</p>
          <p className="text-[10px] mt-1">Pipeline deadlines and saved search matches appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`px-3 py-2 border-l-2 ${alertColors[alert.type] ?? "border-l-muted"} hover:bg-secondary/50 transition-colors cursor-pointer`}
            >
              <p className="text-[10px] font-semibold text-foreground">{alert.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{alert.message}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
```

**Step 2: Commit**

```bash
cd ~/Projects/govcon-command-center && git add src/components/panels/alerts-panel.tsx && git commit -m "feat: add alerts panel with deadline tracking"
```

---

## Task 13: Opportunity Detail Drawer

**Files:**
- Create: `src/components/drawers/opportunity-drawer.tsx`

**Step 1: Detail drawer**

Create `src/components/drawers/opportunity-drawer.tsx`:
```tsx
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeadlineBadge } from "../ui/deadline-badge";
import { useAddToPipeline } from "@/hooks";
import type { Opportunity } from "@/lib/types";

interface OpportunityDrawerProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export function OpportunityDrawer({ opportunity, onClose }: OpportunityDrawerProps) {
  const addToPipeline = useAddToPipeline();

  function handleTrack() {
    addToPipeline.mutate({ opportunityId: opportunity.id });
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] sm:w-[600px] bg-card border-l border-border overflow-auto">
        <SheetHeader>
          <SheetTitle className="text-sm font-medium text-foreground pr-4">
            {opportunity.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleTrack}
              disabled={addToPipeline.isPending}
              className="text-xs h-7 bg-blue-600 hover:bg-blue-700"
            >
              {addToPipeline.isPending ? "Adding..." : "Add to Pipeline"}
            </Button>
          </div>

          {/* Status Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{opportunity.type.toUpperCase()}</Badge>
            {opportunity.setAside && (
              <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-500">
                {opportunity.setAside}
              </Badge>
            )}
            <DeadlineBadge deadline={opportunity.responseDeadline} />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <DetailField label="Agency" value={opportunity.agency} />
            <DetailField label="Office" value={opportunity.office} />
            <DetailField label="Solicitation #" value={opportunity.solicitationNumber} mono />
            <DetailField label="Posted" value={opportunity.postedDate} mono />
            <DetailField label="Response Deadline" value={opportunity.responseDeadline} mono />
            <DetailField label="Classification" value={opportunity.classificationCode} mono />
          </div>

          {/* NAICS Codes */}
          {opportunity.naicsCodes.length > 0 && (
            <div>
              <span className="panel-header text-[10px]">NAICS Codes</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {opportunity.naicsCodes.map((n) => (
                  <span key={n.code} className="text-[10px] font-mono-data px-1.5 py-0.5 bg-secondary rounded">
                    {n.code} — {n.description}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Point of Contact */}
          {opportunity.pointOfContact.length > 0 && (
            <div>
              <span className="panel-header text-[10px]">Point of Contact</span>
              <div className="mt-1 space-y-2">
                {opportunity.pointOfContact.map((poc, i) => (
                  <div key={i} className="text-xs">
                    <p className="text-foreground">{poc.name}</p>
                    {poc.email && (
                      <p className="text-cyan-500 font-mono-data text-[10px]">{poc.email}</p>
                    )}
                    {poc.phone && (
                      <p className="text-muted-foreground font-mono-data text-[10px]">{poc.phone}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Place of Performance */}
          {opportunity.placeOfPerformance && (
            <div>
              <span className="panel-header text-[10px]">Place of Performance</span>
              <p className="text-xs text-foreground mt-1">
                {[
                  opportunity.placeOfPerformance.city,
                  opportunity.placeOfPerformance.state,
                  opportunity.placeOfPerformance.zip,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}

          {/* Resource Links */}
          {opportunity.resourceLinks.length > 0 && (
            <div>
              <span className="panel-header text-[10px]">Links</span>
              <div className="mt-1 space-y-1">
                {opportunity.resourceLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[10px] text-blue-400 hover:text-blue-300 font-mono-data truncate"
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
              <span className="panel-header text-[10px]">Description</span>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">
                {opportunity.description}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
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
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <p className={`text-xs text-foreground mt-0.5 ${mono ? "font-mono-data" : ""}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
cd ~/Projects/govcon-command-center && git add src/components/drawers/ && git commit -m "feat: add opportunity detail drawer with pipeline action"
```

---

## Task 14: Final Assembly & Verification

**Step 1: Verify all imports resolve**

Run:
```bash
cd ~/Projects/govcon-command-center && npx tsc --noEmit
```
Expected: No type errors (or only minor ones to fix)

**Step 2: Fix any type errors found**

Address each error individually.

**Step 3: Verify dev server runs**

Run:
```bash
cd ~/Projects/govcon-command-center && npm run dev
```
Expected: Compiles and serves on localhost:3000

**Step 4: Test API routes with curl**

```bash
curl "http://localhost:3000/api/opportunities?naicsCodes=541511&limit=5" | head -c 500
curl "http://localhost:3000/api/spending?view=agency" | head -c 500
curl "http://localhost:3000/api/pipeline" | head -c 500
```

**Step 5: Final commit**

```bash
cd ~/Projects/govcon-command-center && git add -A && git commit -m "feat: complete GovCon Command Center v1.0"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Project scaffolding | package.json, globals.css, layout.tsx |
| 2 | TypeScript types | src/lib/types.ts |
| 3 | Federal API clients | src/lib/api/*.ts |
| 4 | SQLite database layer | src/lib/db/*.ts |
| 5 | Next.js API routes | src/app/api/**/route.ts |
| 6 | React Query hooks | src/hooks/*.ts |
| 7 | Dashboard shell | src/components/dashboard/*.tsx |
| 8 | Opportunity Feed panel | src/components/panels/opportunity-feed.tsx |
| 9 | Pipeline Kanban panel | src/components/panels/pipeline-tracker.tsx |
| 10 | Recent Awards panel | src/components/panels/recent-awards.tsx |
| 11 | Spending Trends panel | src/components/panels/spending-trends.tsx |
| 12 | Alerts panel | src/components/panels/alerts-panel.tsx |
| 13 | Opportunity Drawer | src/components/drawers/opportunity-drawer.tsx |
| 14 | Assembly & verification | Build verification, API tests |
