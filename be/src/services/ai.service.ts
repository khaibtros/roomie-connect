import http from "http";
import { Room, IRoom } from "../models/Room";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Structured filters extracted from user message via regex + keyword matching */
export interface SearchFilters {
  max_price: number | null;
  district: string | null;
  max_area: number | null;       // m² upper bound
  amenities: string[];           // boolean Room field names
}

// ---------------------------------------------------------------------------
// Intent Detection — regex-based, no LLM round-trip needed
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Intent Detection — regex + keyword matching (zero LLM cost)
// ---------------------------------------------------------------------------

/**
 * Vietnamese price formats: "3 triệu", "3tr", "3.5tr", "500k", raw 7+ digit numbers.
 * We treat any mentioned price as a MAX budget ("dưới / không quá").
 */
const PRICE_PATTERNS: { regex: RegExp; multiplier: number }[] = [
  { regex: /(\d+(?:[.,]\d+)?)\s*(?:tri\u1EC7u|tr)\b/i, multiplier: 1_000_000 },
  { regex: /(\d+(?:[.,]\d+)?)\s*k\b/i,                  multiplier: 1_000 },
  { regex: /(\d{7,})/,                                   multiplier: 1 },
];

/**
 * Area filter: "30m2", "30 m²", "dưới 30m"
 * Treated as an upper bound on room area.
 */
const AREA_REGEX = /(\d+)\s*m(?:2|²|\s)/i;

/**
 * District / location: "quận 7", "Q.7", "quận Bình Thạnh", "huyện Nhà Bè"
 * Captures up to 3 words after the district keyword.
 */
const DISTRICT_REGEX =
  /(?:qu\u1EADn|q\.?|huy\u1EC7n|th\u1ECB\s*x\u00E3|tx\.?)\s*(\d+|[a-zA-Z\u00C0-\u1EF9]+(?:\s[a-zA-Z\u00C0-\u1EF9]+){0,2})/i;

/**
 * Bare location: "ở hòa lạc", "tại thạch hòa", "khu vực tân xã"
 * Captures place names not prefixed by quận/huyện.
 */
const LOCATION_REGEX =
  /(?:\u1EDF|t\u1EA1i|khu(?:\s*v\u1EF1c)?)\s+([a-zA-Z\u00C0-\u1EF9]+(?:\s[a-zA-Z\u00C0-\u1EF9]+){0,3})/i;

/**
 * Keyword triggers that signal a room-search intent even without price/district.
 * Checked AFTER price+district extraction as a fallback signal.
 */
const SEARCH_KEYWORDS =
  /t\u00ecm ph\u00f2ng|\bph\u00f2ng tr\u1ecd\b|thu\u00ea ph\u00f2ng|c\u00f3 ph\u00f2ng|\bph\u00f2ng cho thu\u00ea|danh s\u00e1ch ph\u00f2ng/i;

/**
 * Amenity keyword → Mongoose boolean field name mapping.
 * Keeps all domain knowledge in one place.
 */
const AMENITY_MAP: { pattern: RegExp; field: string }[] = [
  { pattern: /m\u00e1y l\u1ea1nh|\u0111i\u1ec1u h\u00f2a/i,          field: "hasAirConditioner" },
  { pattern: /gi\u01b0\u1eddng/i,                                  field: "hasBed" },
  { pattern: /t\u1ee7 qu\u1ea7n|t\u1ee7 \u0111\u1ed3/i,             field: "hasWardrobe" },
  { pattern: /n\u00f3ng l\u1ea1nh|b\u00ecnh n\u01b0\u1edbc n\u00f3ng|m\u00e1y n\u01b0\u1edbc n\u00f3ng/i, field: "hasWaterHeater" },
  { pattern: /b\u1ebfp|nh\u00e0 b\u1ebfp/i,                          field: "hasKitchen" },
  { pattern: /t\u1ee7 l\u1ea1nh/i,                                  field: "hasFridge" },
  { pattern: /m\u00e1y gi\u1eb7t ri\u00eang/i,                        field: "hasPrivateWashing" },
  { pattern: /m\u00e1y gi\u1eb7t chung/i,                            field: "hasSharedWashing" },
  { pattern: /ch\u1ed7 \u0111\u1ec3 xe|b\u00e3i \u0111\u1ed7 xe|g\u1eedi xe/i, field: "hasParking" },
  { pattern: /thang m\u00e1y/i,                                     field: "hasElevator" },
  { pattern: /camera/i,                                             field: "hasSecurityCamera" },
  { pattern: /ph\u00f2ng ch\u00e1y|ch\u1eefa ch\u00e1y/i,             field: "hasFireSafety" },
  { pattern: /th\u00fa c\u01b0ng|pet/i,                              field: "hasPetFriendly" },
  { pattern: /s\u00e2n ph\u01a1i/i,                                  field: "hasDryingArea" },
  { pattern: /n\u1ed9i th\u1ea5t|full n\u1ed9i th\u1ea5t|\u0111\u1ea7y \u0111\u1ee7 n\u1ed9i th\u1ea5t/i, field: "isFullyFurnished" },
];

/**
 * Parse a Vietnamese user message and extract room-search filters.
 *
 * Design decision: use regex here instead of a first LLM call.
 * Reason: avoids a round-trip to the model just to extract structured data,
 * reduces latency, and is fully deterministic (no hallucination risk).
 *
 * Returns null when the message is clearly NOT a room-search query.
 */
export function detectSearchIntent(message: string): SearchFilters | null {
  let max_price: number | null = null;
  let district: string | null = null;
  let max_area: number | null = null;
  const amenities: string[] = [];

  // --- Price ---
  for (const { regex, multiplier } of PRICE_PATTERNS) {
    const m = message.match(regex);
    if (m) {
      max_price = parseFloat(m[1].replace(",", ".")) * multiplier;
      break;
    }
  }

  // --- District / Location ---
  const dm = message.match(DISTRICT_REGEX);
  if (dm) district = dm[1].trim();
  if (!district) {
    const lm = message.match(LOCATION_REGEX);
    if (lm) district = lm[1].trim();
  }

  // --- Area ---
  const am = message.match(AREA_REGEX);
  if (am) max_area = parseInt(am[1], 10);

  // --- Amenities ---
  for (const { pattern, field } of AMENITY_MAP) {
    if (pattern.test(message)) amenities.push(field);
  }

  // At least one numeric filter OR explicit search keyword required
  const hasNumericFilter = max_price !== null || district !== null || max_area !== null;
  const hasKeyword = SEARCH_KEYWORDS.test(message);

  if (!hasNumericFilter && !hasKeyword && amenities.length === 0) return null;

  return { max_price, district, max_area, amenities };
}

// ---------------------------------------------------------------------------
// MongoDB Query
// ---------------------------------------------------------------------------

/**
 * Query active rooms from MongoDB using the extracted filters.
 * Hard cap of 5 results keeps the LLM prompt small and focused.
 *
 * Design decision: DB query lives HERE, not inside the LLM prompt.
 * The LLM must never be asked to query the database — it has no DB access
 * and would hallucinate results. We query first, then inject real data.
 */
export async function queryRooms(
  filters: SearchFilters,
  limit = 5,
): Promise<IRoom[]> {
  const query: Record<string, unknown> = { status: "active" };

  if (filters.max_price !== null) {
    query.price = { $lte: filters.max_price };
  }
  if (filters.district !== null) {
    // Search both district and address fields so bare names like "hòa lạc"
    // match rooms whose address contains that place name.
    query.$or = [
      { district: { $regex: filters.district, $options: "i" } },
      { address: { $regex: filters.district, $options: "i" } },
    ];
  }
  if (filters.max_area !== null) {
    query.area = { $lte: filters.max_area };
  }
  // Each amenity is a boolean field; require all of them to be true
  for (const field of filters.amenities) {
    query[field] = true;
  }

  return Room.find(query)
    // include images so the frontend can render thumbnails in room cards
    .select("title price address district area capacity images")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<IRoom[]>();
}

// ---------------------------------------------------------------------------
// Prompt Building
// ---------------------------------------------------------------------------

/**
 * Build a grounded prompt that injects ONLY real database results.
 *
 * Anti-hallucination strategy:
 * 1. Explicitly tell the model the data came from the database.
 * 2. Forbid inventing new rooms.
 * 3. If no rooms were found, we NEVER reach this function (controller
 *    returns a static message instead — no LLM call at all).
 */
export function buildRoomPrompt(rooms: IRoom[], userMessage: string): string {
  const roomList = rooms
    .map((r, i) => {
      const price = `${(r.price / 1_000_000).toFixed(1)} triệu/tháng`;
      const area  = r.area ? `${r.area}m²` : "diện tích chưa có";
      return `${i + 1}. ${r.title} | ${price} | ${area} | ${r.address}, ${r.district}`;
    })
    .join("\n");

  return [
    "Bạn là trợ lý AI của nền tảng KnockKnock.",
    "Dưới đây là kết quả TỪ CƠ SỞ DỮ LIỆU THẬT (MongoDB).",
    "QUY TẮC BẮT BUỘC:",
    "- CHỈ được dùng thông tin trong danh sách này.",
    "- KHÔNG ĐƯỢC bịa ra bất kỳ phòng nào khác.",
    "- KHÔNG ĐƯỢC thêm tên thành phố, quận, khu vực nào ngoài thông tin có sẵn trong địa chỉ của từng phòng.",
    "- Khi nhắc đến địa chỉ, CHỈ dùng đúng địa chỉ ghi trong danh sách, không suy đoán thêm.",
    "- Nếu thông tin không có trong danh sách, nói rõ là không có.",
    "",
    `[Kết quả — ${rooms.length} phòng phù hợp]`,
    roomList,
    "",
    `Yêu cầu người dùng: "${userMessage}"`,
    "",
    "Hãy tóm tắt danh sách trên bằng tiếng Việt, thân thiện, ngắn gọn.",
  ].join("\n");
}

/**
 * General-purpose prompt for non-room-search questions.
 */
export function buildGeneralPrompt(userMessage: string): string {
  return [
    "Bạn là trợ lý AI tên KnockBot của nền tảng thuê phòng trọ KnockKnock.",
    "Trả lời bằng tiếng Việt, thân thiện, ngắn gọn.",
    "Nếu người dùng hỏi về phòng cụ thể, nhắc họ mô tả rõ khu vực hoặc ngân sách.",
    "",
    `Người dùng: "${userMessage}"`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Local LLM Call (Ollama)
// ---------------------------------------------------------------------------

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2:1.5b";

/**
 * Call the local Ollama LLM via HTTP and return the generated text.
 * Uses Node built-in http — zero extra dependencies.
 */
export function callLocalLLM(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL("/api/generate", OLLAMA_BASE_URL);
    const payload = JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false });

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
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
            reject(new Error(`Ollama returned ${res.statusCode}: ${body}`));
            return;
          }
          try {
            const data = JSON.parse(body) as { response: string };
            resolve(data.response.trim());
          } catch {
            reject(new Error("Invalid JSON from Ollama"));
          }
        });
      },
    );

    req.on("error", (err) => reject(err));
    req.write(payload);
    req.end();
  });
}
