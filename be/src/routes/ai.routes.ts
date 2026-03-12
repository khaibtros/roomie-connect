import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { User } from "../models/User";
import { AiUsage } from "../models/AiUsage";
import { handleChat } from "./ai.controller";

/**
 * AI Chat Routes
 *
 * POST /api/ai/chat          — Smart search: detect intent → query rooms → LLM reply
 * GET  /api/ai/history       — Retrieve the user's AI chat history
 * GET  /api/ai/tokens        — Get the user's remaining AI token balance
 *
 * All routes require JWT authentication.
 */

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/ai/chat — requires JWT (deducts 1 token per message)
// ---------------------------------------------------------------------------
router.post("/chat", authMiddleware, handleChat);

// ---------------------------------------------------------------------------
// GET /api/ai/history — Retrieve the user's AI chat history
// ---------------------------------------------------------------------------
router.get(
  "/history",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      const history = await AiUsage.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await AiUsage.countDocuments({ userId });

      res.json({
        history,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("AI history error:", error);
      res.status(500).json({ error: "Failed to retrieve chat history" });
    }
  },
);

// ---------------------------------------------------------------------------
// DELETE /api/ai/history — Permanently delete all AI chat history for the user
// ---------------------------------------------------------------------------
router.delete(
  "/history",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const result = await AiUsage.deleteMany({ userId });
      console.log(
        `[AiHistory] Cleared ${result.deletedCount} records for userId=${userId}`,
      );
      res.json({ success: true, deleted: result.deletedCount });
    } catch (error) {
      console.error("AI clear history error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to clear chat history" });
    }
  },
);

// ---------------------------------------------------------------------------
// GET /api/ai/tokens — Get the user's remaining KnockCoin balance
// ---------------------------------------------------------------------------
router.get(
  "/tokens",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const user = await User.findById(userId).select("knockCoin");

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        tokens: user.knockCoin ?? 0,
        maxTokens: Infinity,
      });
    } catch (error) {
      console.error("AI tokens error:", error);
      res.status(500).json({ error: "Failed to retrieve token balance" });
    }
  },
);

export default router;
