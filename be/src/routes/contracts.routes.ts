import { Router } from "express";
import {
  getLandlordContracts,
  getContractDetail,
  approveContract,
  rejectContract,
  createContractRequest,
} from "./contracts.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Landlord routes
router.get("/landlord", authMiddleware, getLandlordContracts);
router.get("/:id", authMiddleware, getContractDetail);
router.post("/:id/approve", authMiddleware, approveContract);
router.post("/:id/reject", authMiddleware, rejectContract);

// Tenant routes
router.post("/request", authMiddleware, createContractRequest);

export default router;
