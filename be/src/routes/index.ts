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
import contractRoutes from "./contracts.routes";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "roomie-connect-api",
  });
});

// Mount routes
router.use("/auth", authRoutes);
router.use("/rooms", roomsRoutes);
router.use("/roommates", roommatesRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/wallet", walletRoutes);
router.use("/chat", chatRoutes);
router.use("/admin", adminRoutes);
router.use("/favorites", favoritesRoutes);
router.use("/ai", aiRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/contracts", contractRoutes);

export default router;
