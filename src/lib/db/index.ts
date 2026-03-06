import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { runMigrations } from "./migrations";
import type {
  SavedOpportunity,
  SavedSearch,
  SearchFilters,
  TrackedEntity,
  EntityRelationship,
  AlertRule,
} from "@/lib/types";

// --- Preferences type (not in types.ts) ---

export interface Preferences {
  defaultNaics: string[];
  refreshRates: Record<string, number>;
  panelLayout: Record<string, unknown>;
}

// --- Database singleton ---

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = join(dataDir, "govcon.db");
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);

  dbInstance = db;
  return db;
}

// --- Row types (snake_case from DB) ---

interface PipelineItemRow {
  id: string;
  opportunity_id: string;
  title: string | null;
  agency: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SavedSearchRow {
  id: string;
  name: string;
  filters: string;
  notify: number;
  created_at: string;
  updated_at: string;
}

interface TrackedEntityRow {
  id: string;
  uei: string;
  name: string;
  relationship: string;
  notes: string | null;
  created_at: string;
}

interface AlertRuleRow {
  id: string;
  type: string;
  config: string;
  enabled: number;
  created_at: string;
}

interface PreferencesRow {
  id: string;
  default_naics: string;
  refresh_rates: string;
  panel_layout: string;
  created_at: string;
  updated_at: string;
}

// --- Row → Model mappers ---

function toSavedOpportunity(row: PipelineItemRow): SavedOpportunity {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    title: row.title,
    agency: row.agency,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSavedSearch(row: SavedSearchRow): SavedSearch {
  return {
    id: row.id,
    name: row.name,
    filters: JSON.parse(row.filters) as SearchFilters,
    notify: row.notify === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTrackedEntity(row: TrackedEntityRow): TrackedEntity {
  return {
    id: row.id,
    uei: row.uei,
    name: row.name,
    relationship: row.relationship as EntityRelationship,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function toAlertRule(row: AlertRuleRow): AlertRule {
  return {
    id: row.id,
    type: row.type as AlertRule["type"],
    config: JSON.parse(row.config) as Record<string, unknown>,
    enabled: row.enabled === 1,
    createdAt: row.created_at,
  };
}

function toPreferences(row: PreferencesRow): Preferences {
  return {
    defaultNaics: JSON.parse(row.default_naics) as string[],
    refreshRates: JSON.parse(row.refresh_rates) as Record<string, number>,
    panelLayout: JSON.parse(row.panel_layout) as Record<string, unknown>,
  };
}

// --- Saved Opportunities ---

export function getSavedOpportunities(): SavedOpportunity[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM pipeline_items ORDER BY created_at DESC")
    .all() as PipelineItemRow[];
  return rows.map(toSavedOpportunity);
}

export function createSavedOpportunity(
  opportunityId: string,
  title?: string,
  agency?: string,
  notes?: string
): SavedOpportunity {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO pipeline_items (id, opportunity_id, title, agency, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, opportunityId, title ?? null, agency ?? null, notes ?? null, now, now);

  const row = db
    .prepare("SELECT * FROM pipeline_items WHERE id = ?")
    .get(id) as PipelineItemRow;
  return toSavedOpportunity(row);
}

export function updateSavedOpportunity(
  id: string,
  updates: { notes?: string }
): void {
  const db = getDb();
  if (updates.notes === undefined) return;

  db.prepare(
    "UPDATE pipeline_items SET notes = ?, updated_at = ? WHERE id = ?"
  ).run(updates.notes, new Date().toISOString(), id);
}

export function deleteSavedOpportunity(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM pipeline_items WHERE id = ?").run(id);
}

// --- Saved Searches ---

export function getSavedSearches(): SavedSearch[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM saved_searches ORDER BY created_at DESC")
    .all() as SavedSearchRow[];
  return rows.map(toSavedSearch);
}

export function createSavedSearch(
  name: string,
  filters: SearchFilters
): SavedSearch {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO saved_searches (id, name, filters, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, name, JSON.stringify(filters), now, now);

  const row = db
    .prepare("SELECT * FROM saved_searches WHERE id = ?")
    .get(id) as SavedSearchRow;
  return toSavedSearch(row);
}

export function deleteSavedSearch(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM saved_searches WHERE id = ?").run(id);
}

// --- Tracked Entities ---

export function getTrackedEntities(): TrackedEntity[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM tracked_entities ORDER BY created_at DESC")
    .all() as TrackedEntityRow[];
  return rows.map(toTrackedEntity);
}

export function createTrackedEntity(
  uei: string,
  name: string,
  relationship: EntityRelationship
): TrackedEntity {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO tracked_entities (id, uei, name, relationship, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, uei, name, relationship, now);

  const row = db
    .prepare("SELECT * FROM tracked_entities WHERE id = ?")
    .get(id) as TrackedEntityRow;
  return toTrackedEntity(row);
}

export function deleteTrackedEntity(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM tracked_entities WHERE id = ?").run(id);
}

// --- Alert Rules ---

export function getAlertRules(): AlertRule[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM alert_rules ORDER BY created_at DESC")
    .all() as AlertRuleRow[];
  return rows.map(toAlertRule);
}

// --- Preferences ---

export function getPreferences(): Preferences {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM preferences WHERE id = 'default'")
    .get() as PreferencesRow | undefined;

  if (!row) {
    db.prepare(
      "INSERT INTO preferences (id) VALUES ('default')"
    ).run();
    return getPreferences();
  }

  return toPreferences(row);
}

export function updatePreferences(
  updates: Partial<Preferences>
): void {
  const db = getDb();

  // Ensure default row exists
  getPreferences();

  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (updates.defaultNaics !== undefined) {
    setClauses.push("default_naics = ?");
    values.push(JSON.stringify(updates.defaultNaics));
  }
  if (updates.refreshRates !== undefined) {
    setClauses.push("refresh_rates = ?");
    values.push(JSON.stringify(updates.refreshRates));
  }
  if (updates.panelLayout !== undefined) {
    setClauses.push("panel_layout = ?");
    values.push(JSON.stringify(updates.panelLayout));
  }

  if (setClauses.length === 0) return;

  setClauses.push("updated_at = ?");
  values.push(new Date().toISOString());

  db.prepare(
    `UPDATE preferences SET ${setClauses.join(", ")} WHERE id = 'default'`
  ).run(...values);
}
