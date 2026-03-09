import { Router } from "express";
import {
  getLandlordContracts,
  getContractDetail,
  approveContract,
  rejectContract,
  createContractRequest,
  getTenantContracts,
  cancelContractRequest,
} from "./contracts.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Landlord routes
router.get("/landlord", authMiddleware, getLandlordContracts);
router.post("/:id/approve", authMiddleware, approveContract);
router.post("/:id/reject", authMiddleware, rejectContract);

// Tenant routes
router.get("/tenant", authMiddleware, getTenantContracts);
router.post("/request", authMiddleware, createContractRequest);
router.delete("/:id", authMiddleware, cancelContractRequest);

// Generic (must be last to avoid catching /landlord, /tenant, /request)
router.get("/:id", authMiddleware, getContractDetail);

export default router;
