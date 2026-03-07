import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { User } from "../models/User";
import { AiUsage } from "../models/AiUsage";
import { IRoom } from "../models/Room";
import {
  detectSearchIntent,
  queryRooms,
  buildRoomPrompt,
  buildGeneralPrompt,
  callLocalLLM,
} from "../services/ai.service";

/**
 * POST /api/ai/chat  (requires JWT)
 *
 * Flow:
 * 1. Verify JWT + check AI token balance.
 * 2. Regex intent detection (price / district / area / amenities).
 * 3. Search intent → query MongoDB (real data only) → inject into LLM prompt.
 * 4. No rooms found → static reply; no LLM call (prevents hallucination).
 * 5. No search intent → general LLM chat.
 * 6. Deduct 1 AI token server-side; persist turn to AiUsage for history.
 */
export async function handleChat(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.userId!;
    const { message } = req.body;

    // --- Input validation ---
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ success: false, error: "Message is required" });
      return;
    }

    // Strip HTML tags to prevent prompt / log injection
    const sanitized = message.replace(/<[^>]*>/g, "").trim().slice(0, 2000);

    // --- AI token balance check ---
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    if (!user.aiTokens || user.aiTokens.tokens <= 0) {
      res.status(402).json({
        success: false,
        error: "Bạn đã hết token AI. Vui lòng nạp thêm để tiếp tục.",
      });
      return;
    }

    // --- Step 1: Detect intent ---
    const filters = detectSearchIntent(sanitized);
    let reply: string;
    let rooms: IRoom[] = [];

    if (filters) {
      // --- Step 2: Query real DB data (LLM must NOT be asked to invent rooms) ---
      rooms = await queryRooms(filters);

      if (rooms.length === 0) {
        // No results — skip LLM entirely to prevent hallucinated listings
        reply =
          "Rất tiếc, mình không tìm thấy phòng nào phù hợp với yêu cầu của bạn. " +
          "Bạn thử điều chỉnh khu vực hoặc ngân sách nhé!";
      } else {
        // --- Step 3: Inject verified DB data into prompt ---
        const prompt = buildRoomPrompt(rooms, sanitized);
        reply = await callLocalLLM(prompt);
      }
    } else {
      // --- Fallback: general AI chat ---
      const prompt = buildGeneralPrompt(sanitized);
      reply = await callLocalLLM(prompt);
    }

    // --- Deduct 1 token (server-side is authoritative) ---
    user.aiTokens.tokens = Math.max(0, user.aiTokens.tokens - 1);
    await user.save();

    // --- Persist turn for chat history restore ---
    await AiUsage.create({
      userId,
      prompt: sanitized,
      response: reply,
      tokensUsed: 1,
      roomResults: rooms.length > 0 ? rooms : undefined,
    });

    res.json({
      success: true,
      data: reply,
      rooms,                              // frontend renders clickable room cards
      tokensRemaining: user.aiTokens.tokens,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("AI Chat error:", msg);

    if (msg.includes("ECONNREFUSED")) {
      res.status(503).json({
        success: false,
        error: "Dịch vụ AI đang offline. Vui lòng thử lại sau.",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại.",
    });
  }
}
