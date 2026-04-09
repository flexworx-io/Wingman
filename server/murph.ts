/**
 * Murph.AI HSE (Human Social Entity) API Client
 * Integrates with Murph.AI for AI-to-AI agent orchestration
 */

const MURPH_API_BASE = process.env.MURPH_API_URL || "https://api.murph.ai/v1";
const MURPH_API_KEY = process.env.MURPH_API_KEY || "";

interface MurphHSE {
  id: string;
  name: string;
  personality: Record<string, number>;
  socialModes: string[];
  interests: string[];
  trustLevel: number;
  status: "active" | "paused" | "archived";
  createdAt: string;
}

interface MurphConversation {
  id: string;
  hseAId: string;
  hseBId: string;
  status: "initiating" | "in_progress" | "completed" | "failed";
  compatibilityScore?: number;
  summary?: string;
  transcript: Array<{ role: string; content: string; timestamp: string }>;
  outcome?: "matched" | "no_match" | "pending" | "human_intro_requested";
}

interface MurphDiscoveryResult {
  hseId: string;
  compatibilityScore: number;
  sharedTraits: string[];
  recommendedApproach: string;
}

async function murphRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  if (!MURPH_API_KEY) {
    // Return mock data when API key not configured
    return getMockResponse<T>(method, path, body);
  }

  const response = await fetch(`${MURPH_API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MURPH_API_KEY}`,
      "X-Platform": "wingman-vip",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Murph API error ${response.status}: ${error}`);
  }

  return response.json() as Promise<T>;
}

// ─── HSE MANAGEMENT ───────────────────────────────────────────────────────────
export async function createHSE(data: {
  name: string;
  personality: Record<string, number>;
  socialModes: string[];
  interests: string[];
  tagline?: string;
  catchphrase?: string;
}): Promise<MurphHSE> {
  return murphRequest<MurphHSE>("POST", "/hse", data);
}

export async function getHSE(hseId: string): Promise<MurphHSE> {
  return murphRequest<MurphHSE>("GET", `/hse/${hseId}`);
}

export async function updateHSE(
  hseId: string,
  data: Partial<MurphHSE>
): Promise<MurphHSE> {
  return murphRequest<MurphHSE>("PATCH", `/hse/${hseId}`, data);
}

export async function deleteHSE(hseId: string): Promise<void> {
  return murphRequest<void>("DELETE", `/hse/${hseId}`);
}

// ─── DISCOVERY ────────────────────────────────────────────────────────────────
export async function discoverCompatibleHSEs(
  hseId: string,
  options: {
    socialMode?: string;
    limit?: number;
    minCompatibility?: number;
  } = {}
): Promise<MurphDiscoveryResult[]> {
  return murphRequest<MurphDiscoveryResult[]>("POST", `/hse/${hseId}/discover`, {
    socialMode: options.socialMode || "all",
    limit: options.limit || 10,
    minCompatibility: options.minCompatibility || 0.5,
  });
}

// ─── INTRODUCTIONS ────────────────────────────────────────────────────────────
export async function initiateIntroduction(
  hseAId: string,
  hseBId: string,
  context?: string
): Promise<MurphConversation> {
  return murphRequest<MurphConversation>("POST", "/conversations", {
    hseAId,
    hseBId,
    context: context || "General social connection",
    mode: "introduction",
  });
}

export async function getConversation(
  conversationId: string
): Promise<MurphConversation> {
  return murphRequest<MurphConversation>("GET", `/conversations/${conversationId}`);
}

export async function getConversationTranscript(
  conversationId: string
): Promise<Array<{ role: string; content: string; timestamp: string }>> {
  const conv = await getConversation(conversationId);
  return conv.transcript || [];
}

// ─── GROUP COORDINATION ───────────────────────────────────────────────────────
export async function createGroupSession(
  hseIds: string[],
  topic: string,
  mode: string
): Promise<{ sessionId: string; status: string }> {
  return murphRequest<{ sessionId: string; status: string }>(
    "POST",
    "/groups",
    { hseIds, topic, mode }
  );
}

// ─── COMPATIBILITY SCORING ────────────────────────────────────────────────────
export async function calculateCompatibility(
  hseAId: string,
  hseBId: string
): Promise<{ score: number; breakdown: Record<string, number>; sharedTraits: string[] }> {
  return murphRequest<{ score: number; breakdown: Record<string, number>; sharedTraits: string[] }>(
    "POST",
    "/compatibility",
    { hseAId, hseBId }
  );
}

// ─── MOCK RESPONSES (when API key not configured) ─────────────────────────────
function getMockResponse<T>(method: string, path: string, body?: unknown): T {
  const id = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (path.startsWith("/hse") && method === "POST" && !path.includes("/discover")) {
    return {
      id,
      name: (body as any)?.name || "Wingman",
      personality: (body as any)?.personality || {},
      socialModes: (body as any)?.socialModes || ["friendship"],
      interests: (body as any)?.interests || [],
      trustLevel: 1,
      status: "active",
      createdAt: new Date().toISOString(),
    } as T;
  }

  if (path.includes("/discover")) {
    return Array.from({ length: 5 }, (_, i) => ({
      hseId: `mock_hse_${i}`,
      compatibilityScore: 0.95 - i * 0.08,
      sharedTraits: ["openness", "curiosity", "warmth"].slice(0, 3 - i),
      recommendedApproach: "Start with shared interests in technology and creativity",
    })) as T;
  }

  if (path.startsWith("/conversations") && method === "POST") {
    return {
      id,
      hseAId: (body as any)?.hseAId || "mock_a",
      hseBId: (body as any)?.hseBId || "mock_b",
      status: "in_progress",
      compatibilityScore: 0.87,
      summary: "Initial introduction in progress. Both agents showing strong compatibility signals.",
      transcript: [
        { role: "hse_a", content: "Hello! I am excited to connect with you!", timestamp: new Date().toISOString() },
        { role: "hse_b", content: "Likewise! I noticed we share a passion for creative pursuits.", timestamp: new Date().toISOString() },
      ],
      outcome: "pending",
    } as T;
  }

  if (path.startsWith("/compatibility")) {
    return {
      score: 0.87,
      breakdown: { openness: 0.92, curiosity: 0.88, warmth: 0.85, humor: 0.79 },
      sharedTraits: ["openness", "curiosity", "warmth", "humor"],
    } as T;
  }

  if (path.startsWith("/groups")) {
    return { sessionId: id, status: "active" } as T;
  }

  return { id, status: "ok" } as T;
}
