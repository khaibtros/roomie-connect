import { IncomingMessage } from "http";
import https from "https";
import { Room, IRoom } from "../models/Room";
import { RoommateProfile, IRoommateProfile } from "../models/RoommateProfile";
import { parseBudget } from "./budget.parser";
import type { RoommateCriteria } from "./roommate.extractor";

// ---------------------------------------------------------------------------
// Re-export prompt builders from PromptFactory for backward compatibility
// ---------------------------------------------------------------------------
export {
  buildRoomPrompt,
  buildRoommatePrompt,
  buildSmallTalkPrompt,
  buildGeneralQAPrompt,
} from "./prompt.factory";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Structured filters for FIND_ROOM queries. */
export interface RoomSearchFilters {
  maxPrice: number | null;
  maxArea: number | null;
  amenities: string[];
  /** MongoDB regex fragment for location scope (from location resolver). */
  locationRegex: string;
}

// ---------------------------------------------------------------------------
// Room Filter Extraction — regex + keyword matching (zero LLM cost)
// ---------------------------------------------------------------------------

/**
 * Area filter: "30m2", "30 m²", "dưới 30m"
 * Treated as an upper bound on room area.
 */
const AREA_REGEX = /(\d+)\s*m(?:2|²|\s)/i;

/**
 * Amenity keyword → Mongoose boolean field name mapping.
 */
const AMENITY_MAP: { pattern: RegExp; field: string }[] = [
  { pattern: /máy lạnh|điều hòa/i, field: "hasAirConditioner" },
  { pattern: /giường/i, field: "hasBed" },
  { pattern: /tủ quần|tủ đồ/i, field: "hasWardrobe" },
  { pattern: /nóng lạnh|bình nước nóng|máy nước nóng/i, field: "hasWaterHeater" },
  { pattern: /bếp|nhà bếp/i, field: "hasKitchen" },
  { pattern: /tủ lạnh/i, field: "hasFridge" },
  { pattern: /máy giặt riêng/i, field: "hasPrivateWashing" },
  { pattern: /máy giặt chung/i, field: "hasSharedWashing" },
  { pattern: /chỗ để xe|bãi đỗ xe|gửi xe/i, field: "hasParking" },
  { pattern: /thang máy/i, field: "hasElevator" },
  { pattern: /camera/i, field: "hasSecurityCamera" },
  { pattern: /phòng cháy|chữa cháy/i, field: "hasFireSafety" },
  { pattern: /thú cưng|pet/i, field: "hasPetFriendly" },
  { pattern: /sân phơi/i, field: "hasDryingArea" },
  { pattern: /nội thất|full nội thất|đầy đủ nội thất/i, field: "isFullyFurnished" },
];

/**
 * Extract structured room-search filters from a Vietnamese user message.
 * Location is NOT extracted here — handled by location.resolver.ts.
 * Budget is delegated to budget.parser.ts.
 *
 * @param message — sanitised user message.
 * @param locationRegex — pre-resolved MongoDB regex from location resolver.
 */
export function extractRoomFilters(
  message: string,
  locationRegex: string,
): RoomSearchFilters {
  const maxPrice = parseBudget(message);

  let maxArea: number | null = null;
  const am = message.match(AREA_REGEX);
  if (am) maxArea = parseInt(am[1], 10);

  const amenities: string[] = [];
  for (const { pattern, field } of AMENITY_MAP) {
    if (pattern.test(message)) amenities.push(field);
  }

  return { maxPrice, maxArea, amenities, locationRegex };
}

// ---------------------------------------------------------------------------
// MongoDB Query
// ---------------------------------------------------------------------------

/**
 * Query active rooms from MongoDB using the extracted filters.
 * Hard cap of 5 results keeps the LLM prompt small and focused.
 *
 * Location scoping is determined by the pre-resolved locationRegex
 * from the location resolver — no inline location logic here.
 */
export async function queryRooms(
  filters: RoomSearchFilters,
  limit = 5,
): Promise<IRoom[]> {
  const query: Record<string, unknown> = { status: "active" };

  if (filters.maxPrice !== null) {
    query.price = { $lte: filters.maxPrice };
  }
  if (filters.maxArea !== null) {
    query.area = { $lte: filters.maxArea };
  }
  for (const field of filters.amenities) {
    query[field] = true;
  }

  // Location scope — always enforced via resolved regex
  query.$and = [
    {
      $or: [
        { address: { $regex: filters.locationRegex, $options: "i" } },
        { district: { $regex: filters.locationRegex, $options: "i" } },
      ],
    },
  ];

  return Room.find(query)
    .select("title price address district area capacity images")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<IRoom[]>();
}

// ---------------------------------------------------------------------------
// Roommate DB Query
// ---------------------------------------------------------------------------

// Roommate filter extraction is now in roommate.extractor.ts.
// Re-export the type for backward compatibility.
export type { RoommateCriteria as RoommateFilters } from "./roommate.extractor";

/**
 * Query roommate profiles from MongoDB using extracted criteria.
 */
export async function queryRoommates(
  filters: RoommateCriteria,
  limit = 5,
): Promise<IRoommateProfile[]> {
  const query: Record<string, unknown> = { isPublic: true };

  if (filters.district) {
    query.preferredDistrict = { $regex: filters.district, $options: "i" };
  }
  if (filters.maxBudget) {
    query.budgetMin = { $lte: filters.maxBudget };
  }

  // Preference filters — use $in so multiple acceptable enum values can match
  if (filters.smoking?.length) {
    query["preferences.smoking"] = { $in: filters.smoking };
  }
  if (filters.pets?.length) {
    query["preferences.pets"] = { $in: filters.pets };
  }
  if (filters.genderPreference) {
    query["preferences.genderPreference"] = filters.genderPreference;
  }
  if (filters.sleepTime) {
    query["preferences.sleepTime"] = filters.sleepTime;
  }
  if (filters.socialHabit) {
    query["preferences.socialHabit"] = filters.socialHabit;
  }
  if (filters.cookingHabit?.length) {
    query["preferences.cookingHabit"] = { $in: filters.cookingHabit };
  }
  if (filters.guests?.length) {
    query["preferences.guests"] = { $in: filters.guests };
  }
  if (filters.alcohol?.length) {
    query["preferences.alcohol"] = { $in: filters.alcohol };
  }
  if (filters.roomCleaning) {
    query["preferences.roomCleaning"] = filters.roomCleaning;
  }

  return RoommateProfile.find(query)
    .select("userId bio budgetMin budgetMax preferredDistrict university lookingFor preferences")
    .populate("userId", "fullName avatarUrl")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<IRoommateProfile[]>();
}

// ---------------------------------------------------------------------------
// LLM Call — Multi-model router: DeepSeek (primary) → Gemini (fallback)
// ---------------------------------------------------------------------------

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const DEEPSEEK_TIMEOUT = 15_000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_TIMEOUT = 12_000;

// -- Response types (no `any`) ------------------------------------------------

interface GeminiPart {
  text?: string;
}
interface GeminiContent {
  parts?: GeminiPart[];
}
interface GeminiCandidate {
  content?: GeminiContent;
}
interface GeminiErrorBody {
  error?: { message?: string };
}
interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

interface DeepSeekChoice {
  message?: { content?: string };
}
interface DeepSeekErrorBody {
  error?: { message?: string };
}
interface DeepSeekResponse {
  choices?: DeepSeekChoice[];
}

// -- DeepSeek -----------------------------------------------------------------

export function callDeepSeek(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!DEEPSEEK_API_KEY) {
      reject(new Error("Missing DEEPSEEK_API_KEY"));
      return;
    }

    const payload = JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 250,
      top_p: 0.9,
    });

    console.log(`[LLM] provider=deepseek model=${DEEPSEEK_MODEL}`);

    const req = https.request(
      {
        hostname: "api.deepseek.com",
        port: 443,
        path: "/v1/chat/completions",
        method: "POST",
        timeout: DEEPSEEK_TIMEOUT,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res: IncomingMessage) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString();

          if (res.statusCode !== 200) {
            console.error(
              `[LLM] DeepSeek non-200 status ${res.statusCode}: ${body.slice(0, 200)}`,
            );
            let apiMessage = "";
            try {
              const parsed: DeepSeekErrorBody = JSON.parse(body);
              apiMessage =
                typeof parsed?.error?.message === "string"
                  ? parsed.error.message.trim()
                  : "";
            } catch {
              // ignore
            }
            reject(
              new Error(
                `DeepSeek returned HTTP ${res.statusCode}${apiMessage ? `: ${apiMessage}` : ""}`,
              ),
            );
            return;
          }

          let data: DeepSeekResponse;
          try {
            data = JSON.parse(body) as DeepSeekResponse;
          } catch {
            console.error(`[LLM] DeepSeek invalid JSON: ${body.slice(0, 200)}`);
            reject(new Error("DeepSeek returned invalid JSON"));
            return;
          }

          const raw = data?.choices?.[0]?.message?.content;
          const text = typeof raw === "string" ? raw.trim() : "";

          if (!text) {
            console.error(`[LLM] DeepSeek empty response: ${body.slice(0, 200)}`);
            reject(new Error("DeepSeek returned an empty response field"));
            return;
          }

          console.log(`[LLM] response received (${text.length} chars)`);
          resolve(text);
        });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      console.error(`[LLM] DeepSeek request timed out after ${DEEPSEEK_TIMEOUT}ms`);
      reject(new Error(`DeepSeek request timed out after ${DEEPSEEK_TIMEOUT}ms`));
    });

    req.on("error", (err: Error) => {
      console.error(`[LLM] DeepSeek connection error: ${err.message}`);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

// -- Gemini -------------------------------------------------------------------

export function callGemini(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!GEMINI_API_KEY) {
      reject(new Error("Missing GEMINI_API_KEY"));
      return;
    }

    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        GEMINI_MODEL,
      )}:generateContent`,
    );
    url.searchParams.set("key", GEMINI_API_KEY);

    const payload = JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 200,
      },
    });

    console.log(`[LLM] provider=gemini model=${GEMINI_MODEL}`);

    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        timeout: GEMINI_TIMEOUT,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res: IncomingMessage) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString();

          if (res.statusCode !== 200) {
            console.error(
              `[LLM] Gemini non-200 status ${res.statusCode}: ${body.slice(0, 200)}`,
            );
            let apiMessage = "";
            try {
              const parsed: GeminiErrorBody = JSON.parse(body);
              apiMessage =
                typeof parsed?.error?.message === "string"
                  ? parsed.error.message.trim()
                  : "";
            } catch {
              // ignore
            }
            reject(
              new Error(
                `Gemini returned HTTP ${res.statusCode}${apiMessage ? `: ${apiMessage}` : ""}`,
              ),
            );
            return;
          }

          let data: GeminiResponse;
          try {
            data = JSON.parse(body) as GeminiResponse;
          } catch {
            console.error(`[LLM] Gemini invalid JSON: ${body.slice(0, 200)}`);
            reject(new Error("Gemini returned invalid JSON"));
            return;
          }

          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          const text = typeof raw === "string" ? raw.trim() : "";

          if (!text) {
            console.error(`[LLM] Gemini empty response: ${body.slice(0, 200)}`);
            reject(new Error("Gemini returned an empty response field"));
            return;
          }

          console.log(`[LLM] response received (${text.length} chars)`);
          resolve(text);
        });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      console.error(`[LLM] Gemini request timed out after ${GEMINI_TIMEOUT}ms`);
      reject(new Error(`Gemini request timed out after ${GEMINI_TIMEOUT}ms`));
    });

    req.on("error", (err: Error) => {
      console.error(`[LLM] Gemini connection error: ${err.message}`);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

// -- Multi-model router: DeepSeek → retry → Gemini fallback ------------------

/**
 * Primary entry point for LLM calls.
 *
 * Flow: DeepSeek → retry DeepSeek once → Gemini fallback.
 * Throws only when every provider has been exhausted.
 */
export async function callLLM(prompt: string): Promise<string> {
  // Attempt 1 — DeepSeek
  try {
    return await callDeepSeek(prompt);
  } catch (err) {
    console.error(
      `[LLM] DeepSeek attempt 1 failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Attempt 2 — DeepSeek retry
  console.log("[LLM] retrying DeepSeek");
  try {
    return await callDeepSeek(prompt);
  } catch (err) {
    console.error(
      `[LLM] DeepSeek attempt 2 failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Attempt 3 — Gemini fallback
  console.log("[LLM] fallback to Gemini");
  return callGemini(prompt);
}

/** @deprecated Use {@link callLLM} instead. Kept for backward compatibility. */
export const callLocalLLM = callLLM;
