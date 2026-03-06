export interface PeoProgram {
  name: string;
  status: string;
  budget: string;
}

export interface PeoSubOffice {
  office: string;
  name: string;
  desc: string;
}

export interface PeoLeader {
  name: string;
  title: string;
}

export interface PeoBudgetLink {
  label: string;
  url: string;
}

export interface PeoEntry {
  id: string;
  name: string;
  fullName: string;
  parent: string;
  location: string;
  budget: string;
  budgetNote: string;
  categories: string[];
  keyPrograms: PeoProgram[];
  modernization: string[];
  subOffices: PeoSubOffice[];
  leadership: PeoLeader[];
  budgetLinks: PeoBudgetLink[];
}

export type ServiceBranch = "navy" | "army" | "airforce" | "spaceforce" | "defensewide";

export interface PeoData {
  navy: PeoEntry[];
  army: PeoEntry[];
  airforce: PeoEntry[];
  spaceforce: PeoEntry[];
  defensewide: PeoEntry[];
}
