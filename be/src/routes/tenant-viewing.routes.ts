import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createViewingRequest,
  getTenantViewings,
  cancelViewingRequest,
  submitTenantDecision,
} from "./tenant-viewing.controller";

const router = Router();

router.use(authMiddleware);

router.get("/tenant", getTenantViewings);
router.post("/request", createViewingRequest);
router.post("/:id/decision", submitTenantDecision);
router.delete("/:id", cancelViewingRequest);

export default router;
