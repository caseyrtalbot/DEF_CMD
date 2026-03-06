import { useQuery } from "@tanstack/react-query";
import type { FederalOrg, PaginatedResponse } from "@/lib/types";

async function fetchHierarchySearch(
  query: string,
  type?: string,
  parentId?: string,
  limit = 25,
  offset = 0
): Promise<PaginatedResponse<FederalOrg>> {
  const params = new URLSearchParams();
  params.set("q", query);
  if (type) params.set("type", type);
  if (parentId) params.set("parentId", parentId);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const res = await fetch(`/api/hierarchy?${params}`);
  if (!res.ok) throw new Error("Failed to fetch federal hierarchy");
  return res.json();
}

async function fetchOrgTree(
  rootOrgKey?: string,
  limit = 100,
  offset = 0
): Promise<PaginatedResponse<FederalOrg>> {
  const params = new URLSearchParams();
  params.set("mode", "tree");
  if (rootOrgKey) params.set("rootOrgKey", rootOrgKey);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const res = await fetch(`/api/hierarchy?${params}`);
  if (!res.ok) throw new Error("Failed to fetch org tree");
  return res.json();
}

export function useHierarchySearch(
  query: string,
  type?: string,
  parentId?: string,
  limit = 25,
  offset = 0,
  enabled = false
) {
  return useQuery({
    queryKey: ["hierarchy", "search", query, type, parentId, limit, offset],
    queryFn: () => fetchHierarchySearch(query, type, parentId, limit, offset),
    enabled,
  });
}

export function useOrgTree(
  rootOrgKey?: string,
  limit = 100,
  offset = 0,
  enabled = false
) {
  return useQuery({
    queryKey: ["hierarchy", "tree", rootOrgKey, limit, offset],
    queryFn: () => fetchOrgTree(rootOrgKey, limit, offset),
    enabled,
  });
}
