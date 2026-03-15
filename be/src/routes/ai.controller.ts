import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { User } from "../models/User";
import type { IUser } from "../models/User";
import type { HydratedDocument } from "mongoose";
import { AiUsage } from "../models/AiUsage";
import { IRoom } from "../models/Room";
import { IRoommateProfile } from "../models/RoommateProfile";
import {
  extractRoomFilters,
  queryRooms,
  queryRoommates,
  callLocalLLM,
} from "../services/ai.service";
import {
  buildRoomPrompt,
  buildRoommatePrompt,
  buildSmallTalkPrompt,
  buildGeneralQAPrompt,
  buildComparisonPrompt,
} from "../services/prompt.factory";
import {
  extractRoomReferencesFromMessage,
  getContextRoomsFromHistory,
  resolveRoomsForComparison,
  buildRoomComparisonPayload,
  MIN_COMPARE_ROOMS,
  MAX_COMPARE_ROOMS,
  type RoomComparisonData,
} from "../services/compare.service";
import { classifyIntent, Intent } from "../services/intent.service";
import {
  resolveSupportedLocations,
} from "../services/location.resolver";
import {
  loadMemory,
  loadRoommateMemory,
  updateMemory,
  MemoryUpdate,
} from "../services/memory.service";
import { shouldChargeToken } from "../services/token.service";
import { ResponseType } from "../services/response.types";
import {
  hasSufficientCriteria,
  extractRoommateCriteria,
  CLARIFICATION_REPLY,
} from "../services/roommate.extractor";

// ---------------------------------------------------------------------------
// Structured log
// ---------------------------------------------------------------------------
interface AIChatLog {
  userId: string;
  message: string;
  detectedIntent: Intent;
  llmUsed: boolean;
  hasResults: boolean;
  knockCoinCharged: boolean;
  responseType: ResponseType;
  success: boolean;
  durationMs: number;
}

function emitLog(log: AIChatLog): void {
  console.log(`[KnockBot] ${JSON.stringify(log)}`);
}

// Response types that should NOT save to AiUsage or increment the free counter.
// These are purely client-side errors or config/validation issues.
const NON_COUNTABLE_TYPES: ReadonlySet<ResponseType> = new Set([
  ResponseType.VALIDATION,
  ResponseType.SYSTEM_ERROR,
]);

// ---------------------------------------------------------------------------
// POST /api/ai/chat — Main AI Pipeline (Single Exit Point)
//
// All paths set `reply` + `responseType`, then fall through to the unified
// persist/respond block. This guarantees:
//  • AiUsage is always persisted (so history survives reload)
//  • aiFreeChatUsed is always incremented for every countable interaction
//    (CLARIFICATION, OUT_OF_SCOPE, DB_EMPTY, DB_SUCCESS, LLM_SUCCESS)
//  • Only VALIDATION and SYSTEM_ERROR are exempt (not counted, not saved)
//
// Flow:
//  1. Validate input           → VALIDATION (respond immediately, no persist)
//  2. Load user + token guard  → 402 (respond immediately, no persist)
//  3. Classify intent          → sets reply + responseType = CLARIFICATION
//  4. Route by intent          → sets reply + responseType
//  5. Safeguard empty reply    → SYSTEM_ERROR (respond immediately, no persist)
//  6. Coin charge decision
//  7. Persist + respond (unified exit point)
// ---------------------------------------------------------------------------
export async function handleChat(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const userId = req.userId!;

  // Pipeline state
  let detectedIntent: Intent = "UNKNOWN";
  let llmUsed = false;
  let hasResults = false;
  let knockCoinCharged = false;
  let responseType: ResponseType = ResponseType.SYSTEM_ERROR;
  let sanitized = "";
  let reply = "";
  let rooms: IRoom[] = [];
  let roommates: IRoommateProfile[] = [];
  let compareRooms: RoomComparisonData[] = [];
  const memoryUpdates: MemoryUpdate = {};
  // user is set after DB lookup; we need it in the final block
  let user: HydratedDocument<IUser> | null = null;

  try {
    const { message } = req.body ?? {};

    // ══════════════════════════════════════════════════════════════════════
    // STEP 1: Input validation — respond immediately, never saved
    // ══════════════════════════════════════════════════════════════════════
    if (!message || typeof message !== "string" || !message.trim()) {
      res.json({
        success: true,
        data:
          "Bạn có thể nhập nội dung cần hỗ trợ không? " +
          "Ví dụ: 'Tìm phòng ở Thạch Hòa dưới 3 triệu' hoặc 'Tìm bạn ghép phòng khu vực Tân Xã'.",
        rooms: [],
        roommates: [],
        responseType: ResponseType.VALIDATION,
      });
      return;
    }

    sanitized = message.replace(/<[^>]*>/g, "").trim().slice(0, 2000);
    if (!sanitized) {
      res.json({
        success: true,
        data: "Tin nhắn không hợp lệ. Bạn vui lòng nhập lại nội dung cần hỗ trợ nhé!",
        rooms: [],
        roommates: [],
        responseType: ResponseType.VALIDATION,
      });
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 2: Load user + token guard
    // ══════════════════════════════════════════════════════════════════════
    user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const FREE_CHAT_LIMIT = 2;
    const COIN_COST = 50;
    const isFree = (user.aiFreeChatUsed ?? 0) < FREE_CHAT_LIMIT;
    const cost = isFree ? 0 : COIN_COST;

    if (!isFree && user.knockCoin < cost) {
      res.status(402).json({
        success: false,
        error: "Bạn đã hết KnockCoin. Vui lòng nạp thêm để tiếp tục.",
      });
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 3: Intent classification
    // ══════════════════════════════════════════════════════════════════════
    detectedIntent = await classifyIntent(sanitized);

    if (detectedIntent === "UNKNOWN") {
      reply =
        "Xin lỗi, mình chưa hiểu rõ yêu cầu của bạn. " +
        "Bạn có thể mô tả rõ hơn không? Ví dụ: 'Tìm phòng ở Thạch Hòa dưới 3 triệu' " +
        "hoặc 'Tìm bạn ghép phòng khu vực Tân Xã'.";
      responseType = ResponseType.CLARIFICATION;
      // Fall through to unified persist block
    } else {
      // ══════════════════════════════════════════════════════════════════════
      // STEP 4: Route by intent
      // ══════════════════════════════════════════════════════════════════════

      // ──────────────────────────── FIND_ROOM ────────────────────────────
      if (detectedIntent === "FIND_ROOM") {
        const locResult = resolveSupportedLocations(sanitized);
        if (!locResult.supported) {
          reply = locResult.reason;
          responseType = ResponseType.OUT_OF_SCOPE;
        } else {
          const filters = extractRoomFilters(sanitized, locResult.regexFilter);
          rooms = await queryRooms(filters);

          if (rooms.length === 0) {
            responseType = ResponseType.DB_EMPTY;
            reply =
              "Rất tiếc, mình không tìm thấy phòng nào phù hợp tại " +
              locResult.wards.join(" và ") +
              " với yêu cầu của bạn. Bạn thử điều chỉnh ngân sách hoặc tiêu chí nhé!";
          } else {
            responseType = ResponseType.DB_SUCCESS;
            hasResults = true;
            llmUsed = true;
            reply = await callLocalLLM(buildRoomPrompt(rooms, sanitized));
          }

          if (locResult.wards.length === 1)
            memoryUpdates.location = locResult.wards[0];
          if (filters.maxPrice) memoryUpdates.budget = filters.maxPrice;
        }

        // ─────────────────────────── FIND_ROOMMATE ──────────────────────
      } else if (detectedIntent === "FIND_ROOMMATE") {
        if (!hasSufficientCriteria(sanitized)) {
          reply = CLARIFICATION_REPLY;
          responseType = ResponseType.CLARIFICATION;
        } else {
          const locResult = resolveSupportedLocations(sanitized);
          if (!locResult.supported) {
            reply = locResult.reason;
            responseType = ResponseType.OUT_OF_SCOPE;
          } else {
            const storedPrefs = await loadRoommateMemory(userId);
            const criteria = extractRoommateCriteria(sanitized, storedPrefs);
            roommates = await queryRoommates(criteria);

            if (roommates.length === 0) {
              responseType = ResponseType.DB_EMPTY;
              reply =
                "Rất tiếc, mình chưa tìm thấy ai phù hợp tại " +
                locResult.wards.join(" và ") +
                ". Bạn thử điều chỉnh khu vực, ngân sách hoặc yêu cầu lối sống nhé!";
            } else {
              responseType = ResponseType.DB_SUCCESS;
              hasResults = true;
              llmUsed = true;
              reply = await callLocalLLM(
                buildRoommatePrompt(roommates, sanitized),
              );
            }

            if (criteria.district) memoryUpdates.location = criteria.district;
            if (criteria.maxBudget) memoryUpdates.budget = criteria.maxBudget;
            if (criteria.genderPreference)
              memoryUpdates.genderPreference = criteria.genderPreference;
            memoryUpdates.roommatePreferences = {};
            if (criteria.smoking) {
              memoryUpdates.roommatePreferences.smoking =
                criteria.smoking.includes("no_smoke_ok") ? "no" : "yes";
            }
            if (criteria.sleepTime) {
              memoryUpdates.roommatePreferences.sleepHabit = criteria.sleepTime;
            }
            if (criteria.genderPreference) {
              memoryUpdates.roommatePreferences.gender =
                criteria.genderPreference;
            }
          }
        }

        // ─────────────────────── COMPARE_ROOMS ──────────────────
      } else if (detectedIntent === "COMPARE_ROOMS") {
        const refs = extractRoomReferencesFromMessage(sanitized);
        const contextIds = await getContextRoomsFromHistory(userId);

        console.log(
          `[KnockBot] compare_rooms — refs=${JSON.stringify(refs)} contextIds=${JSON.stringify(contextIds.slice(0, MAX_COMPARE_ROOMS))}`,
        );

        const resolvedRooms = await resolveRoomsForComparison(refs, contextIds);

        console.log(
          `[KnockBot] compare_rooms — resolved ${resolvedRooms.length} room(s)`,
        );

        if (resolvedRooms.length < MIN_COMPARE_ROOMS) {
          reply =
            "Mình cần ít nhất 2 phòng để có thể so sánh. " +
            "Bạn có thể cho mình biết rõ tên hoặc ID của các phòng muốn so sánh không? " +
            "Hoặc bạn có thể tìm phòng trước, rồi mình sẽ giúp so sánh nhé!";
          responseType = ResponseType.CLARIFICATION;
        } else {
          compareRooms = buildRoomComparisonPayload(resolvedRooms);
          rooms = resolvedRooms;
          hasResults = true;
          llmUsed = true;
          reply = await callLocalLLM(
            buildComparisonPrompt(compareRooms, sanitized),
          );
          responseType = ResponseType.DB_SUCCESS;
        }

        // ─────────────────────── SMALL_TALK ────────────────────
      } else if (detectedIntent === "SMALL_TALK") {
        llmUsed = true;
        reply = await callLocalLLM(buildSmallTalkPrompt(sanitized));
        responseType = reply
          ? ResponseType.LLM_SUCCESS
          : ResponseType.SYSTEM_ERROR;
        hasResults = !!reply;

        // ──────────────────────────── GENERAL_QA ────────────────────────
      } else {
        const memory = await loadMemory(userId);
        const scopedMemory = memory
          ? { location: memory.location, budget: memory.budget }
          : null;
        llmUsed = true;
        reply = await callLocalLLM(
          buildGeneralQAPrompt(sanitized, scopedMemory),
        );
        responseType = reply
          ? ResponseType.LLM_SUCCESS
          : ResponseType.SYSTEM_ERROR;
        hasResults = !!reply;
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 5: Safeguard — empty reply from LLM path
    // ══════════════════════════════════════════════════════════════════════
    if (!reply) {
      responseType = ResponseType.SYSTEM_ERROR;
      console.error(
        `[KnockBot] Empty reply — userId=${userId} intent=${detectedIntent}`,
      );
      emitLog({
        userId,
        message: sanitized,
        detectedIntent,
        llmUsed,
        hasResults: false,
        knockCoinCharged: false,
        responseType,
        success: false,
        durationMs: Date.now() - startTime,
      });
      res.status(500).json({
        success: false,
        error: "AI không trả lời được. Vui lòng thử lại.",
      });
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 6: Coin charge decision
    // ══════════════════════════════════════════════════════════════════════
    const charge = shouldChargeToken(responseType);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 7: Unified persist block
    //
    // Runs for ALL responses EXCEPT VALIDATION and SYSTEM_ERROR.
    // • Increments aiFreeChatUsed (persists free-chat consumption)
    // • Deducts KnockCoin if chargeable and past free limit
    // • Saves AiUsage (so chat history survives reload / clear)
    // ══════════════════════════════════════════════════════════════════════
    if (!NON_COUNTABLE_TYPES.has(responseType)) {
      // Increment free-chat counter for every countable response
      if (charge && !isFree) {
        user.knockCoin = Math.max(0, user.knockCoin - cost);
        knockCoinCharged = true;
      }
      user.aiFreeChatUsed = (user.aiFreeChatUsed ?? 0) + 1;
      await user.save();

      // Persist to AiUsage so history loads correctly on page reload
      await AiUsage.create({
        userId,
        prompt: sanitized,
        response: reply,
        tokensUsed: knockCoinCharged ? cost : 0,
        intent: detectedIntent,
        llmUsed,
        responseType,
        roomResults: rooms.length > 0 ? rooms : undefined,
        roommateResults: roommates.length > 0 ? roommates : undefined,
        compareResults: compareRooms.length > 0
          ? (compareRooms as unknown as Record<string, unknown>[])
          : undefined,
      });

      // Update memory (fire-and-forget, only relevant for room/roommate intents)
      updateMemory(userId, detectedIntent, memoryUpdates).catch(() => {});
    }

    // ══════════════════════════════════════════════════════════════════════
    // STEP 8: Respond
    // ══════════════════════════════════════════════════════════════════════
    emitLog({
      userId,
      message: sanitized,
      detectedIntent,
      llmUsed,
      hasResults,
      knockCoinCharged,
      responseType,
      success: true,
      durationMs: Date.now() - startTime,
    });

    res.json({
      success: true,
      data: reply,
      rooms,
      roommates,
      compareResults: compareRooms.length > 0 ? compareRooms : undefined,
      responseType,
      tokensRemaining: user.knockCoin,
    });
  } catch (error: unknown) {
    // ══════════════════════════════════════════════════════════════════════
    // SYSTEM_ERROR — genuine exception (DB crash, network, unexpected throw)
    // ══════════════════════════════════════════════════════════════════════
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[KnockBot] SYSTEM_ERROR userId=${userId}: ${msg}`);

    emitLog({
      userId,
      message: sanitized,
      detectedIntent,
      llmUsed,
      hasResults,
      knockCoinCharged: false,
      responseType: ResponseType.SYSTEM_ERROR,
      success: false,
      durationMs: Date.now() - startTime,
    });

    if (msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
      res.status(503).json({
        success: false,
        error: "Dịch vụ AI đang offline. Vui lòng thử lại sau.",
      });
      return;
    }
    if (
      msg.includes("HTTP") ||
      msg.includes("empty response") ||
      msg.includes("invalid JSON")
    ) {
      res.status(502).json({
        success: false,
        error: "AI không trả lời được. Vui lòng thử lại.",
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: "Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại.",
    });
  }
}
