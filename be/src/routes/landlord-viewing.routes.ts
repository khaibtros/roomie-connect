import { Router } from "express";
import { authMiddleware, landlordOnly } from "../middleware/auth.middleware";
import {
  getLandlordViewings,
  approveViewing,
  rejectViewing,
  payViewing,
  submitViewingDecision,
} from "./landlord-viewing.controller";

const router = Router();

router.use(authMiddleware, landlordOnly);

router.get("/", getLandlordViewings);
router.patch("/:id/approve", approveViewing);
router.patch("/:id/reject", rejectViewing);
router.post("/:id/pay", payViewing);
router.post("/:id/decision", submitViewingDecision);

export default router;
