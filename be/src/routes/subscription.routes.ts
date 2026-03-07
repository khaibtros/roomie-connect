import { Router } from "express";
import {
  getCurrentSubscription,
  subscribe,
  getPackages,
} from "./subscription.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// GET /api/subscription/packages - Get all packages
router.get("/packages", getPackages);

// GET /api/subscription/current - Get current subscription
router.get("/current", authMiddleware, getCurrentSubscription);

// POST /api/subscription/subscribe - Subscribe to package
router.post("/subscribe", authMiddleware, subscribe);

export default router;
