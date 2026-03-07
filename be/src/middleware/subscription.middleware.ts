import { Request, Response, NextFunction } from "express";
import { hasActiveSubscription } from "../routes/subscription.controller";

export const checkSubscriptionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const landlordId = (req as any).userId;

    if (!landlordId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    console.log(`🔍 Checking subscription for landlord: ${landlordId}`);

    const hasSubscription = await hasActiveSubscription(landlordId);

    if (!hasSubscription) {
      console.log(`⚠️ No active subscription for: ${landlordId}`);
      res.status(403).json({
        error: "Active subscription required to post rooms",
        code: "NO_SUBSCRIPTION",
      });
      return;
    }

    console.log(`✅ Valid subscription found for: ${landlordId}`);
    next();
  } catch (error) {
    console.error("❌ Subscription check error:", error);
    res.status(500).json({ error: "Failed to verify subscription" });
  }
};
