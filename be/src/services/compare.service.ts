/**
 * Room Comparison Service
 *
 * Handles the COMPARE_ROOMS intent pipeline:
 *  1. Detect compare intent (rule-based, zero LLM cost)
 *  2. Extract room references from user message (by ID or title fragment)
 *  3. Fetch context rooms from recent session history
 *  4. Resolve final room list from MongoDB
 *  5. Normalise into a structured, frontend-ready payload
 *
 * Design principle: LLM is ONLY used for natural-language output.
 * All data resolution and structuring is done here in plain code.
 */

import { Types } from "mongoose";
import { Room, IRoom } from "../models/Room";
import { AiUsage } from "../models/AiUsage";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Hard cap on the number of rooms in a single comparison (keeps prompt small). */
export const MAX_COMPARE_ROOMS = 4;

/** Minimum rooms required to produce a comparison response. */
export const MIN_COMPARE_ROOMS = 2;

// MongoDB projection for room fields needed during comparison
const ROOM_COMPARISON_PROJECTION =
  "title price deposit area capacity address district images utilities " +
  "hasAirConditioner hasBed hasWardrobe hasWaterHeater hasKitchen hasFridge " +
  "hasPrivateWashing hasSharedWashing hasParking hasElevator hasSecurityCamera " +
  "hasFireSafety hasPetFriendly hasDryingArea hasSharedOwner isFullyFurnished status";

// ---------------------------------------------------------------------------
// Shared Types
// ---------------------------------------------------------------------------

/** A normalised room record for comparison — only populated fields included. */
export interface RoomComparisonData {
  id: string;
  title: string;
  price: number;
  deposit: number | null;
  area: number | null;
  capacity: number;
  address: string;
  district: string;
  /** First image URL, or empty array if none. */
  images: string[];
  /** Vietnamese labels for active amenity flags. */
  amenities: string[];
  electricityPrice: number | null;
  waterPrice: number | null;
  internetPrice: number | null;
  isFullyFurnished: boolean;
  status: string;
}

/** A typed reference to a room as extracted from free-text. */
export interface RoomReference {
  type: "id" | "title";
  value: string;
}

// ---------------------------------------------------------------------------
// Amenity mapping (field → Vietnamese label)
// ---------------------------------------------------------------------------

const AMENITY_FIELDS: ReadonlyArray<{ field: keyof IRoom; label: string }> = [
  { field: "hasAirConditioner", label: "Máy lạnh" },
  { field: "hasBed", label: "Giường" },
  { field: "hasWardrobe", label: "Tủ quần áo" },
  { field: "hasWaterHeater", label: "Nóng lạnh" },
  { field: "hasKitchen", label: "Bếp" },
  { field: "hasFridge", label: "Tủ lạnh" },
  { field: "hasPrivateWashing", label: "Máy giặt riêng" },
  { field: "hasSharedWashing", label: "Máy giặt chung" },
  { field: "hasParking", label: "Chỗ để xe" },
  { field: "hasElevator", label: "Thang máy" },
  { field: "hasSecurityCamera", label: "Camera an ninh" },
  { field: "hasFireSafety", label: "PCCC" },
  { field: "hasPetFriendly", label: "Thú cưng" },
  { field: "hasDryingArea", label: "Sân phơi" },
  { field: "hasSharedOwner", label: "Chung chủ" },
  { field: "isFullyFurnished", label: "Nội thất đầy đủ" },
];

// ---------------------------------------------------------------------------
// Stop-word list for title reference extraction
// ---------------------------------------------------------------------------

/** Words that cannot be the start of a meaningful room title fragment. */
const TITLE_STOP_WORDS = new Set([
  "này",
  "kia",
  "đó",
  "ấy",
  "nào",
  "tốt",
  "tệ",
  "rẻ",
  "đẹp",
  "rộng",
  "tiện",
  "cũ",
  "mới",
  "trên",
  "dưới",
  "vừa",
  "khác",
  "gợi",
  "được",
  "hơn",
  "nhất",
  "thích",
  "muốn",
  "ý",
  "có",
  "không",
  "phù",
  "hợp",
  "ở",
  "thuê",
  "cho",
  "với",
  "hay",
  "tôi",
  "nhé",
  "nha",
  "ạ",
  "đi",
  "nhá",
  "giúp",
  "mình",
]);

// ---------------------------------------------------------------------------
// Text normalization helpers
// ---------------------------------------------------------------------------

/**
 * Remove Vietnamese diacritics from a string.
 * "Nhà trọ Hòa Vinh" → "Nha tro Hoa Vinh"
 */
function removeDiacritics(str: string): string {
  return str
    .replace(/[àáảãạâầấẩẫậăằắẳẵặ]/g, "a")
    .replace(/[ÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶ]/g, "A")
    .replace(/[èéẻẽẹêềếểễệ]/g, "e")
    .replace(/[ÈÉẺẼẸÊỀẾỂỄỆ]/g, "E")
    .replace(/[ìíỉĩị]/g, "i")
    .replace(/[ÌÍỈĨỊ]/g, "I")
    .replace(/[òóỏõọôồốổỗộơờớởỡợ]/g, "o")
    .replace(/[ÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]/g, "O")
    .replace(/[ùúủũụưừứửữự]/g, "u")
    .replace(/[ÙÚỦŨỤƯỪỨỬỮỰ]/g, "U")
    .replace(/[ỳýỷỹỵ]/g, "y")
    .replace(/[ỲÝỶỸỴ]/g, "Y")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * Normalise a room name for matching purposes.
 * - lowercase
 * - remove diacritics
 * - treat "&" and "and" as equivalent
 * - collapse whitespace
 * - trim
 */
export function normalizeForRoomMatch(text: string): string {
  let s = text.toLowerCase();
  s = removeDiacritics(s);
  s = s.replace(/&/g, "and");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/**
 * Generate searchable aliases for a room title.
 * e.g. "Nhà trọ You & Me" → [
 *   "nha tro you and me",
 *   "you and me",
 *   "you me",
 *   "nha tro you me"
 * ]
 */
function generateRoomAliases(title: string): string[] {
  const base = normalizeForRoomMatch(title);
  const withoutPrefix = base
    .replace(/^(nha\s*tro|phong\s*tro|tro|phong)\s+/i, "")
    .trim();

  const aliases = new Set<string>();
  aliases.add(base);
  if (withoutPrefix !== base) aliases.add(withoutPrefix);

  // Also add version without "and"
  if (base.includes(" and ")) {
    aliases.add(base.replace(/ and /g, " "));
    if (withoutPrefix.includes(" and ")) {
      aliases.add(withoutPrefix.replace(/ and /g, " "));
    }
  }

  return Array.from(aliases);
}

// ---------------------------------------------------------------------------
// 1. Intent Detection
// ---------------------------------------------------------------------------

const COMPARE_INTENT_RE =
  /so\s*sánh|đối\s*chiếu|phòng\s*nào\s*(tốt|rẻ|đẹp|rộng|tiện|phù\s*hợp)\s*hơn|nên\s*chọn\s*phòng\s*nào|phòng\s*nào\s*tốt\s*hơn|so\s+sánh\s+giữa/i;

/**
 * Rule-based compare-rooms intent detector.
 * Returns true when the message clearly requests a room comparison.
 *
 * This is a standalone utility; the routing decision lives in intent.service.ts.
 */
export function detectCompareRoomsIntent(message: string): boolean {
  return COMPARE_INTENT_RE.test(message);
}

// ---------------------------------------------------------------------------
// 2. Room Reference Extraction
// ---------------------------------------------------------------------------

/**
 * Extract room references (IDs or title fragments) from a Vietnamese user message.
 *
 * Strategy:
 *  1. Scan the whole message for 24-char hex MongoDB IDs.
 *  2. Remove noise prefixes ("so sánh", "cho tôi so sánh", etc.).
 *  3. Split by VIETNAMESE conjunctions ONLY ("và", "hoặc", "với", "hay", "vs").
 *     IMPORTANT: "and" is NOT used as a split delimiter because it can be part
 *     of a room name (e.g. "You & Me" / "You and Me").
 *  4. Strip room-type prefixes ("nhà trọ", "trọ", "phòng trọ", "phòng").
 *  5. Remove trailing stop words.
 *
 * No LLM is invoked — pure rule-based extraction.
 */
export function extractRoomReferencesFromMessage(
  message: string,
): RoomReference[] {
  const refs: RoomReference[] = [];
  const seen = new Set<string>();

  const addRef = (type: "id" | "title", value: string): void => {
    const v = value.trim();
    if (!v) return;
    const key = `${type}:${v.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push({ type, value: v });
    }
  };

  // Phase 1 — full message scan for MongoDB ObjectIds
  for (const m of message.matchAll(/\b([0-9a-f]{24})\b/gi)) {
    addRef("id", m[1]);
  }

  // Phase 2 — Remove noise prefixes
  const noisePrefixes = /^so\s*sánh\s*giữa|^so\s*sánh|^cho\s*tôi\s*so\s*sánh|^gợi\s*ý/i;
  let cleaned = message.replace(noisePrefixes, "").trim();

  // Phase 3 — split by VIETNAMESE conjunctions and "vs" ONLY.
  // "and" is explicitly NOT a delimiter here to preserve room names like "You and Me".
  const segments = cleaned
    .split(/\s+(?:và|hoặc|với(?!\s+mình)|hay|vs)\s+/i)
    .map((s) => s.trim());
  const noiseWords = /^(nhà\s*trọ|phòng\s*trọ|trọ|phòng)\s+/i;

  for (const segment of segments) {
    let val = segment.replace(noiseWords, "").trim();

    // Ignore generic searches like "3 trọ gần...", "các trọ", "top trọ", "tốt nhất"
    if (
      /^(?:[0-9]+|các|những|top)\s/i.test(val) ||
      /(?:tốt nhất|gần đây)/i.test(val)
    ) {
      continue;
    }

    // Remove trailing stop words
    const words = val.split(/\s+/);
    while (
      words.length > 0 &&
      TITLE_STOP_WORDS.has(words[words.length - 1].toLowerCase())
    ) {
      words.pop();
    }

    val = words.join(" ").trim();
    if (val) {
      addRef("title", val);
    }
  }

  console.log(
    `[KnockBot] extractRoomRefs — originalMessage="${message}" extractedRefs=${JSON.stringify(refs)}`,
  );

  return refs;
}

// ---------------------------------------------------------------------------
// 3. Context Rooms from Session History
// ---------------------------------------------------------------------------

/**
 * Retrieve room IDs from the user's recent chat history (last 3 interactions
 * that returned room results). Used to resolve "phòng vừa gợi ý" references.
 *
 * @returns Up to MAX_COMPARE_ROOMS room IDs, most-recent first.
 */
export async function getContextRoomsFromHistory(
  userId: string,
): Promise<string[]> {
  const recent = await AiUsage.find({
    userId,
    "roomResults.0": { $exists: true },
  })
    .sort({ createdAt: -1 })
    .limit(3)
    .select("roomResults")
    .lean<{ roomResults: Array<{ _id?: unknown }> }[]>();

  const ids: string[] = [];
  const seen = new Set<string>();

  for (const usage of recent) {
    for (const r of usage.roomResults ?? []) {
      const id = String(r._id ?? "");
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
        if (ids.length >= MAX_COMPARE_ROOMS) return ids;
      }
    }
  }

  return ids;
}

// ---------------------------------------------------------------------------
// 4. Room Resolution
// ---------------------------------------------------------------------------

/**
 * Try to find a room by a user-provided name fragment.
 *
 * Matching strategy (in priority order):
 *  1. Diacritic-insensitive regex on room title
 *  2. Normalized alias matching (handles "&" ↔ "and")
 *
 * Returns null if no match found.
 */
export async function findRoomByName(
  query: string,
): Promise<IRoom | null> {
  const normalizedQuery = normalizeForRoomMatch(query);

  // Strategy 1: Build diacritic-insensitive regex AND handle &/and equivalence
  const regexPattern = query
    // First normalize & to "and" for regex building, then make it match both
    .replace(/&/g, "(?:&|and)")
    .replace(/\band\b/gi, "(?:&|and)")
    .replace(/a|á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, "[aáàảãạăắằẳẵặâấầẩẫậ]")
    .replace(/e|é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, "[eéèẻẽẹêếềểễệ]")
    .replace(/i|í|ì|ỉ|ĩ|ị/gi, "[iíìỉĩị]")
    .replace(/o|ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, "[oóòỏõọôốồổỗộơớờởỡợ]")
    .replace(/u|ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, "[uúùủũụưứừửữự]")
    .replace(/y|ý|ỳ|ỷ|ỹ|ỵ/gi, "[yýỳỷỹỵ]")
    .replace(/d|đ/gi, "[dđ]");

  const byTitle = await Room.findOne({
    title: { $regex: regexPattern, $options: "i" },
    status: "active",
  })
    .select(ROOM_COMPARISON_PROJECTION)
    .lean<IRoom>();

  if (byTitle) return byTitle;

  // Strategy 2: Fetch all active rooms and match by normalized aliases
  const allRooms = await Room.find({ status: "active" })
    .select(ROOM_COMPARISON_PROJECTION)
    .lean<IRoom[]>();

  for (const room of allRooms) {
    const aliases = generateRoomAliases(room.title);
    for (const alias of aliases) {
      // Check if query is a substring of alias or vice versa
      if (alias.includes(normalizedQuery) || normalizedQuery.includes(alias)) {
        return room;
      }
    }
  }

  return null;
}

/**
 * Resolve room references to active Room documents.
 *
 * Resolution order:
 *  1. Explicit MongoDB IDs from `refs`
 *  2. Title fragments from `refs` — uses findRoomByName with fuzzy matching
 *  3. Context rooms from session history (ONLY when user specified < 2 names)
 *
 * Only `active` rooms are included. Hidden / deleted rooms are excluded.
 * Results are capped at MAX_COMPARE_ROOMS even if more refs are given.
 */
export async function resolveRoomsForComparison(
  refs: RoomReference[],
  contextRoomIds: string[],
): Promise<{ resolved: IRoom[]; missing: string[] }> {
  const resolved: IRoom[] = [];
  const missing: string[] = [];
  const seenIds = new Set<string>();

  const addRoom = (room: IRoom): void => {
    const id = String(room._id);
    if (!seenIds.has(id) && resolved.length < MAX_COMPARE_ROOMS) {
      seenIds.add(id);
      resolved.push(room);
    }
  };

  // Phase 1 — resolve by explicit ObjectId
  const validIdRefs = refs
    .filter((r) => r.type === "id" && Types.ObjectId.isValid(r.value))
    .map((r) => r.value);

  if (validIdRefs.length > 0) {
    const byId = await Room.find({
      _id: { $in: validIdRefs },
      status: "active",
    })
      .select(ROOM_COMPARISON_PROJECTION)
      .lean<IRoom[]>();

    for (const r of byId) addRoom(r);
  }

  // Phase 2 — resolve by title fragment using fuzzy matching
  for (const ref of refs.filter((r) => r.type === "title")) {
    if (resolved.length >= MAX_COMPARE_ROOMS) break;

    const matched = await findRoomByName(ref.value);
    if (matched) {
      addRoom(matched);
    } else {
      missing.push(ref.value);
    }
  }

  console.log(
    `[KnockBot] resolveRooms — resolved=${resolved.map((r) => r.title)} missing=${JSON.stringify(missing)}`,
  );

  // Phase 3 — supplement from context ONLY if user did not specify >= 2 valid names
  if (refs.length < 2 && resolved.length < MIN_COMPARE_ROOMS && contextRoomIds.length > 0) {
    const needed = MAX_COMPARE_ROOMS - resolved.length;
    const supplementIds = contextRoomIds
      .filter((id) => !seenIds.has(id) && Types.ObjectId.isValid(id))
      .slice(0, needed);

    if (supplementIds.length > 0) {
      const fromContext = await Room.find({
        _id: { $in: supplementIds },
        status: "active",
      })
        .select(ROOM_COMPARISON_PROJECTION)
        .lean<IRoom[]>();

      for (const r of fromContext) addRoom(r);
    }
  }

  return { resolved, missing };
}

// ---------------------------------------------------------------------------
// 5. Comparison Payload Builder
// ---------------------------------------------------------------------------

/**
 * Normalise an array of Room documents into structured, frontend-safe payloads.
 *
 * - Only fields with actual data are populated (no null fabrication).
 * - Amenities are translated to Vietnamese labels.
 * - Utility prices are extracted from the nested utilities sub-document.
 */
export function buildRoomComparisonPayload(
  rooms: IRoom[],
): RoomComparisonData[] {
  return rooms.map((room) => {
    const amenities = AMENITY_FIELDS.filter(
      ({ field }) => (room as unknown as Record<string, unknown>)[field] === true,
    ).map(({ label }) => label);

    return {
      id: String(room._id),
      title: room.title,
      price: room.price,
      deposit: room.deposit ?? null,
      area: room.area ?? null,
      capacity: room.capacity,
      address: room.address,
      district: room.district,
      images: room.images ?? [],
      amenities,
      electricityPrice: room.utilities?.electricityPrice ?? null,
      waterPrice: room.utilities?.waterPrice ?? null,
      internetPrice: room.utilities?.internetPrice ?? null,
      isFullyFurnished: room.isFullyFurnished ?? false,
      status: room.status,
    };
  });
}
