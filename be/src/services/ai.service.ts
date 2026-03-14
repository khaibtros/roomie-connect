import http from "http";
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
// LLM Call (Gemini or Ollama)
// ---------------------------------------------------------------------------

type AIProvider = "gemini" | "ollama";

function getAIProvider(): AIProvider {
  const raw = (process.env.AI_PROVIDER || "gemini").toLowerCase().trim();
  return raw === "ollama" ? "ollama" : "gemini";
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

function callGeminiLLM(prompt: string): Promise<string> {
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
        maxOutputTokens: 400,
      },
    });

    console.log(`[LLM] provider=gemini model=${GEMINI_MODEL}`);

    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        timeout: 12000,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
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
              const parsed = JSON.parse(body) as any;
              apiMessage =
                typeof parsed?.error?.message === "string"
                  ? (parsed.error.message as string).trim()
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

          let data: any;
          try {
            data = JSON.parse(body);
          } catch {
            console.error(`[LLM] Gemini invalid JSON: ${body.slice(0, 200)}`);
            reject(new Error("Gemini returned invalid JSON"));
            return;
          }

          const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text &&
            typeof data.candidates[0].content.parts[0].text === "string"
              ? (data.candidates[0].content.parts[0].text as string).trim()
              : "";

          if (!text) {
            console.error(`[LLM] Gemini empty response: ${body.slice(0, 200)}`);
            reject(new Error("Gemini returned an empty response field"));
            return;
          }

          resolve(text);
        });
      },
    );

    req.on("error", (err) => {
      console.error(`[LLM] Gemini connection error: ${(err as Error).message}`);
      reject(err);
    });
    req.write(payload);
    req.end();
  });
}

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";

/**
 * Call the local Ollama LLM via HTTP and return the generated text.
 * Uses Node built-in http — zero extra dependencies.
 *
 * Safeguards:
 * - Non-200 HTTP status → explicit error with status code + body snippet.
 * - Malformed JSON → explicit parse error.
 * - Missing or empty `response` field → explicit error (prevents saving undefined
 *   to Mongoose and avoids downstream validation failures).
 * - Returned value is always a non-empty string or the promise rejects.
 */
export function callLocalLLM(prompt: string): Promise<string> {
  // Default: use Gemini (cloud). Set AI_PROVIDER=ollama to use local Ollama.
  const provider = getAIProvider();
  if (provider === "gemini") {
    return callGeminiLLM(prompt);
  }
  return new Promise((resolve, reject) => {
    const url = new URL("/api/generate", OLLAMA_BASE_URL);
    const payload = JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.4,   // ổn định hơn cho hệ thống tìm trọ
        top_p: 0.9,
        num_predict: 400,   // giới hạn token output
      },
    });

    console.log(`[LLM] Sending request to ${OLLAMA_BASE_URL} model=${OLLAMA_MODEL}`);

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
        timeout: 5000, // safeguard timeout 5s
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString();

          // Safeguard A1: reject on non-200 HTTP status
          if (res.statusCode !== 200) {
            console.error(`[LLM] Non-200 status ${res.statusCode}: ${body.slice(0, 200)}`);
            reject(new Error(`Ollama returned HTTP ${res.statusCode}`));
            return;
          }

          // Safeguard A2: reject on unparseable JSON
          let data: { response?: unknown };
          try {
            data = JSON.parse(body) as { response?: unknown };
          } catch {
            console.error(`[LLM] Failed to parse JSON response: ${body.slice(0, 200)}`);
            reject(new Error("Ollama returned invalid JSON"));
            return;
          }

          // Safeguard A3: ensure response field is a non-empty string
          const text = typeof data.response === "string" ? data.response.trim() : "";
          if (!text) {
            console.error(`[LLM] response field missing or empty in: ${body.slice(0, 200)}`);
            reject(new Error("Ollama returned an empty response field"));
            return;
          }

          console.log(`[LLM] Response received (${text.length} chars)`);
          resolve(text);
        });
      },
    );

    req.on("error", (err) => {
      console.error(`[LLM] Connection error: ${(err as Error).message}`);
      reject(err);
    });
    req.write(payload);
    req.end();
  });
}
