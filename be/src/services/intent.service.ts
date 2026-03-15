/**
 * Intent Classification Service — Two-Tier Strategy
 *
 * Tier 1: Rule-based keyword matching (zero latency, zero LLM cost).
 *         Returns a definitive intent for clear-cut messages.
 *
 * Tier 2: Mini LLM classifier (fallback only).
 *         Uses a minimal classification prompt — NOT the main generation model.
 *         Only called when Tier 1 returns null.
 *
 * Critical ordering: FIND_ROOMMATE is checked BEFORE FIND_ROOM because
 * roommate messages often contain "phòng", which would otherwise match FIND_ROOM.
 */

export type Intent =
  | "FIND_ROOM"
  | "FIND_ROOMMATE"
  | "COMPARE_ROOMS"
  | "GENERAL_QA"
  | "SMALL_TALK"
  | "UNKNOWN";

// ---------------------------------------------------------------------------
// Tier 1 — Rule-based patterns
// ---------------------------------------------------------------------------

/**
 * COMPARE_ROOMS must be checked BEFORE FIND_ROOM because "so sánh phòng" contains
 * "phòng" which would otherwise match FIND_ROOM.
 * ROOMMATE must be checked BEFORE ROOM for the same reason.
 *
 * Every pattern is a multi-word phrase. Single words like "ở" or "tìm" are
 * NEVER used as standalone patterns to prevent false positives.
 */
const COMPARE_ROOMS_RULE_RE =
  /so\s*sánh|đối\s*chiếu|phòng\s*nào\s*(?:tốt|rẻ|đẹp|rộng|tiện|phù\s*hợp)\s*hơn|nên\s*chọn\s*phòng\s*nào|so\s+sánh\s+giữa/i;

/**
 * ROOMMATE must be checked BEFORE ROOM — phrases like "ở ghép", "ghép phòng",
 * "bạn cùng phòng" all contain "phòng" which would otherwise match FIND_ROOM.
 *
 * Every pattern is a multi-word phrase. Single words like "ở" or "tìm" are
 * NEVER used as standalone patterns to prevent false positives.
 */
const ROOMMATE_RULE_RE =
  /ở\s*ghép|bạn\s*cùng\s*phòng|bạn\s*ở\s*cùng|bạn\s*phòng\b|roommate|share\s*phòng|ghép\s*phòng|tìm\s*người\s*ở\s*cùng|người\s*ở\s*cùng|cần\s*người\s*ở\s*chung|tìm\s*người\s*ghép|tìm\s*bạn\s*ghép|ghép\s*trọ|tìm\s*bạn\s*chung\s*phòng|ở\s*chung\s*với|tìm\s*bạn\s*ở/i;

/**
 * ROOM patterns — only matched AFTER roommate patterns have been eliminated.
 * Each pattern requires at least a two-word phrase involving "phòng" to avoid
 * matching generic mentions of the word.
 */
const ROOM_RULE_RE =
  /tìm\s*phòng|phòng\s*trọ\b|thuê\s*phòng|có\s*phòng\b|phòng\s*cho\s*thuê|danh\s*sách\s*phòng|xem\s*phòng|giá\s*phòng|phòng\s*trống|phòng\s*dưới/i;

/** Simple greetings / acknowledgements that need no DB or LLM logic. */
const SMALL_TALK_RE =
  /^(xin\s*chào|hello|hi\b|chào\s*bạn?|cảm\s*ơn|thanks|tạm\s*biệt|bye|ok\b|oke\b|được\s*rồi|được|cảm\s*ơn\s*bạn)[.!?,\s]*$/i;

/**
 * Tier 1: Fast, synchronous classification.
 * Returns null when no pattern fires → caller must escalate to Tier 2.
 */
export function classifyIntentFast(message: string): Intent | null {
  if (COMPARE_ROOMS_RULE_RE.test(message)) return "COMPARE_ROOMS";
  if (ROOMMATE_RULE_RE.test(message)) return "FIND_ROOMMATE";
  if (ROOM_RULE_RE.test(message)) return "FIND_ROOM";
  if (SMALL_TALK_RE.test(message)) return "SMALL_TALK";
  return null;
}

// ---------------------------------------------------------------------------
// Tier 2 — Mini LLM classifier (fallback only)
// ---------------------------------------------------------------------------

const VALID_INTENTS: Intent[] = [
  "FIND_ROOM",
  "FIND_ROOMMATE",
  "COMPARE_ROOMS",
  "GENERAL_QA",
  "SMALL_TALK",
  "UNKNOWN",
];

/**
 * Minimal classification prompt — must NOT trigger the main generation pipeline.
 * Trả về đúng 1 nhãn, không giải thích. Giữ prompt ngắn nhất có thể.
 */
function buildClassifierPrompt(message: string): string {
  return [
    "Phân loại tin nhắn sau vào ĐÚNG MỘT nhãn. Chỉ trả lời nhãn, không giải thích.",
    "Nhãn có thể dùng: FIND_ROOM, FIND_ROOMMATE, COMPARE_ROOMS, GENERAL_QA, SMALL_TALK, UNKNOWN",
    `Tin nhắn: "${message.slice(0, 300)}"`,
    "Nhãn:",
  ].join("\n");
}

/**
 * Tier 2: LLM-based fallback classifier.
 * Uses a dynamic import to avoid a circular dependency with ai.service.ts.
 * Fails safely — returns UNKNOWN on any error.
 */
export async function classifyIntentWithLLM(message: string): Promise<Intent> {
  try {
    // Dynamic import breaks the potential circular dep: intent → ai → intent
    const { callLocalLLM } = await import("./ai.service");
    const raw = await callLocalLLM(buildClassifierPrompt(message));
    const upper = raw.trim().toUpperCase();
    // Match the first valid intent label found anywhere in the response
    return VALID_INTENTS.find((i) => upper.startsWith(i) || upper.includes(i)) ?? "UNKNOWN";
  } catch {
    // LLM unavailable or timed out — degrade gracefully
    return "UNKNOWN";
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify the user's intent using a two-tier strategy.
 *
 * Guarantees:
 * - Never throws.
 * - Empty / whitespace-only messages → always UNKNOWN (never hits LLM).
 * - Tier 2 (LLM) is only invoked when Tier 1 returns null.
 * - Tier 2 failure → "UNKNOWN" (never crashes the pipeline).
 */
export async function classifyIntent(message: string): Promise<Intent> {
  // Guard: empty messages must NEVER reach the LLM classifier
  if (!message || !message.trim()) return "UNKNOWN";

  const fast = classifyIntentFast(message);
  if (fast !== null) return fast;
  return classifyIntentWithLLM(message);
}
