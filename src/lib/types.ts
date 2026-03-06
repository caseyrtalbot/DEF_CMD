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

export type EntityRelationship = "competitor" | "teaming_partner" | "incumbent";

export interface TrackedEntity {
  id: string;
  uei: string;
  name: string;
  relationship: EntityRelationship;
  notes: string | null;
  createdAt: string;
}

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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
