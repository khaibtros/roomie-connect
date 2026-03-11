import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { viewingService, ServiceError } from "../services/viewing.service";
import type { DecisionStatus } from "../models/ViewingRequest";

// POST /api/viewings/request
export const createViewingRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const tenantId = req.userId;
    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { roomId, scheduledTime } = req.body as {
      roomId: string;
      scheduledTime: string;
    };

    if (!roomId) {
      res.status(400).json({ error: "Room ID is required" });
      return;
    }
    if (!scheduledTime) {
      res.status(400).json({ error: "Scheduled time is required" });
      return;
    }

    const viewingRequest = await viewingService.createViewingRequest(
      tenantId,
      roomId,
      scheduledTime,
    );

    res.status(201).json({ message: "Viewing request sent successfully", viewingRequest });
  } catch (err) {
    handleError(res, err);
  }
};

// GET /api/viewings/tenant
export const getTenantViewings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const tenantId = req.userId;
    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const viewings = await viewingService.getTenantViewings(tenantId);
    res.json({ viewings });
  } catch (err) {
    handleError(res, err);
  }
};

// DELETE /api/viewings/:id
export const cancelViewingRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const tenantId = req.userId;
    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await viewingService.cancelViewingRequest(req.params.id, tenantId);
    res.json({ message: "Viewing request cancelled" });
  } catch (err) {
    handleError(res, err);
  }
};

// POST /api/viewings/:id/decision
export const submitTenantDecision = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const tenantId = req.userId;
    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { decision } = req.body as { decision: DecisionStatus };
    if (!decision || (decision !== "confirmed" && decision !== "rejected")) {
      res
        .status(400)
        .json({ error: "Invalid decision. Must be 'confirmed' or 'rejected'" });
      return;
    }

    const { viewing, refund } = await viewingService.submitTenantDecision(
      req.params.id,
      tenantId,
      decision,
    );

    res.json({
      message:
        decision === "confirmed" ? "Decision submitted" : "Viewing rejected",
      viewing: { _id: viewing._id, status: viewing.status },
      refund: refund
        ? { _id: refund._id, status: refund.status, reason: refund.reason }
        : null,
    });
  } catch (err) {
    handleError(res, err);
  }
};

// ---------------------------------------------------------------------------
function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error("Tenant viewing controller error:", err);
  res.status(500).json({ error: "Internal server error" });
}
