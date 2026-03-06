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

export interface SavedOpportunity {
  id: string;
  opportunityId: string;
  title: string | null;
  agency: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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

// === Federal Hierarchy (SAM.gov org tree) ===

export interface FederalOrg {
  orgKey: string;
  name: string;
  code: string;
  level: number;
  parentOrgKey: string | null;
  type: string;
  agencyCode: string | null;
  children?: FederalOrg[];
}

// === SBIR/STTR Topics ===

export interface SbirTopic {
  topicNumber: string;
  topicTitle: string;
  agency: string;
  branch: string;
  program: "SBIR" | "STTR";
  phase: string;
  description: string;
  openDate: string | null;
  closeDate: string | null;
  solicitation: string | null;
}

// === Contract Awards (SAM.gov FPDS replacement) ===

export interface ContractAward {
  id: string;
  piid: string;
  agencyName: string;
  subAgencyName: string | null;
  vendorName: string;
  vendorUei: string | null;
  awardAmount: number;
  obligatedAmount: number;
  signedDate: string;
  naicsCode: string | null;
  psc: string | null;
  setAside: string | null;
  competitionType: string | null;
  description: string | null;
}

// === Federal Register (DFARS/acquisition rules) ===

export interface FederalRegisterDocument {
  id: string;
  documentNumber: string;
  title: string;
  type: "rule" | "proposed_rule" | "notice" | "presidential_document";
  abstractText: string | null;
  publicationDate: string;
  agencies: string[];
  htmlUrl: string;
  pdfUrl: string | null;
  commentsDue: string | null;
  significantRule: boolean;
}

// === Product Service Codes (SAM.gov PSC) ===

export interface ProductServiceCode {
  code: string;
  description: string;
  parentCode: string | null;
  status: "active" | "inactive";
}

// === Regulations.gov (proposed rules & comments) ===

export interface RegulationDocument {
  id: string;
  documentId: string;
  title: string;
  type: "Rule" | "Proposed Rule" | "Notice" | "Other";
  agency: string;
  postedDate: string;
  commentsDue: string | null;
  commentCount: number;
  summary: string | null;
  htmlUrl: string;
}
