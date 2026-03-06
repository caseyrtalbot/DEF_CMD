import type { SbirTopic } from "@/lib/types";

const BASE_URL = "https://api.www.sbir.gov/public/api/solicitation";

interface SbirRawTopic {
  topicNumber?: string;
  topicTitle?: string;
  agency?: string;
  branch?: string;
  program?: string;
  phase?: string;
  openDate?: string;
  closeDate?: string;
  solicitation?: string;
  topicDescription?: string;
}

interface SbirErrorResponse {
  Code?: string;
  Message?: string;
  message?: string;
}

function normalizeProgram(raw: string | undefined): "SBIR" | "STTR" {
  const upper = (raw ?? "").toUpperCase();
  if (upper.includes("STTR")) return "STTR";
  return "SBIR";
}

function normalizeTopic(raw: SbirRawTopic): SbirTopic {
  return {
    topicNumber: raw.topicNumber ?? "",
    topicTitle: raw.topicTitle ?? "",
    agency: raw.agency ?? "",
    branch: raw.branch ?? "",
    program: normalizeProgram(raw.program),
    phase: raw.phase ?? "",
    description: raw.topicDescription ?? "",
    openDate: raw.openDate ?? null,
    closeDate: raw.closeDate ?? null,
    solicitation: raw.solicitation ?? null,
  };
}

export async function searchTopics(
  keyword?: string,
  agency?: string,
  status?: string
): Promise<SbirTopic[]> {
  const params = new URLSearchParams();
  params.set("rows", "50");
  params.set("start", "0");

  if (keyword) {
    params.set("keyword", keyword);
  }
  if (agency) {
    params.set("agency", agency);
  }
  if (status) {
    params.set("status", status);
  }

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let detail = response.statusText;
    try {
      const err: SbirErrorResponse = JSON.parse(body);
      detail = err.Message ?? err.message ?? detail;
    } catch {
      // use statusText
    }
    throw new Error(`SBIR.gov API error: ${response.status} — ${detail}`);
  }

  const data: SbirRawTopic[] = await response.json();
  const topics = Array.isArray(data) ? data : [];

  return topics.map(normalizeTopic);
}
