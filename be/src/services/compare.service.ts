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
]);

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
 *  2. Split message by Vietnamese conjunctions (và, hoặc, với, hay) to isolate
 *     each room mention segment, then extract the word(s) after "phòng".
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

  // Phase 2 — split by conjunctions and extract "phòng <title>" per segment
  const segments = message
    .split(/\s+(?:và|hoặc|với|hay)\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const phongMatch = segment.match(/phòng\s+(.+)/i);
    if (!phongMatch) continue;

    // Take up to 3 words after "phòng"; stop at trailing stop words
    const rawWords = phongMatch[1].trim().split(/\s+/).slice(0, 3);
    while (
      rawWords.length > 0 &&
      TITLE_STOP_WORDS.has(rawWords[rawWords.length - 1].toLowerCase())
    ) {
      rawWords.pop();
    }

    const fragment = rawWords.join(" ");
    const firstWord = rawWords[0]?.toLowerCase() ?? "";

    // Skip if empty or first word is a stop word
    if (fragment && !TITLE_STOP_WORDS.has(firstWord)) {
      addRef("title", fragment);
    }
  }

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
 * Resolve room references to active Room documents.
 *
 * Resolution order:
 *  1. Explicit MongoDB IDs from `refs`
 *  2. Title fragments from `refs` (case-insensitive substring match)
 *  3. Context rooms from session history (used when resolved count < MIN_COMPARE_ROOMS)
 *
 * Only `active` rooms are included. Hidden / deleted rooms are excluded.
 * Results are capped at MAX_COMPARE_ROOMS even if more refs are given.
 */
export async function resolveRoomsForComparison(
  refs: RoomReference[],
  contextRoomIds: string[],
): Promise<IRoom[]> {
  const resolved: IRoom[] = [];
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

  // Phase 2 — resolve by title fragment
  for (const ref of refs.filter((r) => r.type === "title")) {
    if (resolved.length >= MAX_COMPARE_ROOMS) break;

    const byTitle = await Room.findOne({
      title: { $regex: ref.value, $options: "i" },
      status: "active",
    })
      .select(ROOM_COMPARISON_PROJECTION)
      .lean<IRoom>();

    if (byTitle) addRoom(byTitle);
  }

  // Phase 3 — supplement from context when too few rooms were explicitly named
  if (resolved.length < MIN_COMPARE_ROOMS && contextRoomIds.length > 0) {
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

  return resolved;
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
