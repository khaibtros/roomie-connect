import { Router } from "express";
import authRoutes from "./auth.routes";
import roomsRoutes from "./rooms.routes";
import roommatesRoutes from "./roommates.routes";
import notificationsRoutes from "./notifications.routes";
import walletRoutes from "./wallet.routes";
import chatRoutes from "./chat.routes";
import adminRoutes from "./admin.routes";
import favoritesRoutes from "./favorites.routes";
import aiRoutes from "./ai.routes";
import subscriptionRoutes from "./subscription.routes";
import landlordViewingRoutes from "./landlord-viewing.routes";
import tenantViewingRoutes from "./tenant-viewing.routes";
import adminViewingRoutes from "./admin-viewing.routes";
import coinRoutes from "./coin.routes";

const router = Router();

// ---------------------------------------------------------------------------
// Public routes — NO auth required
// Order matters: these must be mounted BEFORE any auth middleware so they
// are reachable without a JWT token.
// ---------------------------------------------------------------------------
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "roomie-connect-api",
  });
});

router.use("/auth", authRoutes);  // register / login — public
router.use("/ai",   aiRoutes);    // /ai/chat is public; /ai/history|tokens carry their own authMiddleware

// ---------------------------------------------------------------------------
// Protected routes — each route file applies authMiddleware internally
// ---------------------------------------------------------------------------
router.use("/rooms",         roomsRoutes);
router.use("/roommates",     roommatesRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/wallet",        walletRoutes);
router.use("/chat",          chatRoutes);
router.use("/admin",         adminRoutes);
router.use("/admin",         adminViewingRoutes);
router.use("/favorites",     favoritesRoutes);
router.use("/subscription",  subscriptionRoutes);
router.use("/landlord/viewings", landlordViewingRoutes);
router.use("/viewings",      tenantViewingRoutes);
router.use("/coin",          coinRoutes);

export default router;
