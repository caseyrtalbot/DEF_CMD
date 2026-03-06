import { NAVY_PEOS } from "./navy";
import { ARMY_PEOS } from "./army";
import { AIRFORCE_PEOS } from "./airforce";
import { SPACEFORCE_PEOS } from "./spaceforce";
import { DEFENSEWIDE_PEOS } from "./defensewide";
import type { PeoData, PeoEntry, ServiceBranch } from "./types";

export * from "./types";
export { NAVY_PEOS } from "./navy";
export { ARMY_PEOS } from "./army";
export { AIRFORCE_PEOS } from "./airforce";
export { SPACEFORCE_PEOS } from "./spaceforce";
export { DEFENSEWIDE_PEOS } from "./defensewide";

export const PEO_DATA: PeoData = {
  navy: NAVY_PEOS,
  army: ARMY_PEOS,
  airforce: AIRFORCE_PEOS,
  spaceforce: SPACEFORCE_PEOS,
  defensewide: DEFENSEWIDE_PEOS,
};

export const ALL_PEOS: PeoEntry[] = [
  ...NAVY_PEOS,
  ...ARMY_PEOS,
  ...AIRFORCE_PEOS,
  ...SPACEFORCE_PEOS,
  ...DEFENSEWIDE_PEOS,
];

export function getPeosByBranch(branch: string): PeoEntry[] {
  if (branch === "all") return ALL_PEOS;
  const mapping: Record<string, ServiceBranch> = {
    navy: "navy",
    army: "army",
    usaf: "airforce",
    darpa: "defensewide",
    mda: "defensewide",
    socom: "defensewide",
    disa: "defensewide",
    dla: "defensewide",
  };
  const key = mapping[branch];
  if (!key) return ALL_PEOS;
  return PEO_DATA[key];
}

export function getPeoById(id: string): PeoEntry | undefined {
  return ALL_PEOS.find((p) => p.id === id);
}

export function searchPeos(query: string): PeoEntry[] {
  const q = query.toLowerCase();
  return ALL_PEOS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.fullName.toLowerCase().includes(q) ||
      p.categories.some((c) => c.toLowerCase().includes(q)) ||
      p.keyPrograms.some((prog) => prog.name.toLowerCase().includes(q))
  );
}
