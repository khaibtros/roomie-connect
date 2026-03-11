import { Router, Response } from "express";
import {
  authMiddleware,
  adminOnly,
  AuthRequest,
} from "../middleware/auth.middleware";
import {
  adminViewingService,
  AdminServiceError,
} from "../services/admin-viewing.service";

const router = Router();

router.use(authMiddleware, adminOnly);

// GET /api/admin/viewings
router.get("/viewings", async (req: AuthRequest, res: Response) => {
  try {
    const viewings = await adminViewingService.getAllViewings();
    res.json({ viewings });
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/admin/viewings/:id
router.get("/viewings/:id", async (req: AuthRequest, res: Response) => {
  try {
    const viewing = await adminViewingService.getViewingById(req.params.id);
    res.json({ viewing });
  } catch (err) {
    handleError(res, err);
  }
});

// PATCH /api/admin/refunds/:id/approve
router.patch("/refunds/:id/approve", async (req: AuthRequest, res: Response) => {
  try {
    await adminViewingService.approveRefund(req.params.id);
    res.json({ message: "Refund approved" });
  } catch (err) {
    handleError(res, err);
  }
});

// PATCH /api/admin/refunds/:id/reject
router.patch("/refunds/:id/reject", async (req: AuthRequest, res: Response) => {
  try {
    await adminViewingService.rejectRefund(req.params.id);
    res.json({ message: "Refund rejected" });
  } catch (err) {
    handleError(res, err);
  }
});

function handleError(res: Response, err: unknown): void {
  if (err instanceof AdminServiceError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error("Admin viewing error:", err);
  res.status(500).json({ error: "Internal server error" });
}

export default router;
