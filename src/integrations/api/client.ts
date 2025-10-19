export type BlockType = "career" | "academic";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000";

async function http<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    ...(init || {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function apiStartSession(): Promise<{ session_id: string }> {
  return await http(`/api/session/start`, {});
}

export interface ApiItem {
  id: string;
  type: "mcq" | "text" | "video";
  question: string;
  options?: string[];
  difficulty?: number;
}

export async function apiNextItem(sessionId: string, block: BlockType): Promise<{ item: ApiItem }> {
  return await http(`/api/cat/next`, { session_id: sessionId, block });
}

export async function apiSubmit(
  sessionId: string,
  block: BlockType,
  itemId: string,
  response: any
): Promise<{ updated_theta: number; next_recommended_block?: BlockType | "cognitive" | "complete" }> {
  return await http(`/api/cat/submit`, { session_id: sessionId, block, item_id: itemId, response });
}

export async function apiFinalize(sessionId: string): Promise<{ subscores: Record<string, number> }> {
  return await http(`/api/assessment/finalize`, { session_id: sessionId });
}

export interface Recommendation {
  title: string;
  match: number;
  description: string;
  category: string;
}

export async function apiRecommendations(subscores: Record<string, number>): Promise<{ careers: Recommendation[]; majors: string[] }> {
  return await http(`/api/recommendations`, { subscores });
}


