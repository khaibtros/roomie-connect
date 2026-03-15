import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { viewingService, ServiceError } from "../services/viewing.service";
import type { DecisionStatus } from "../models/ViewingRequest";
import { PayOS } from "@payos/node";
import { Request } from "express";

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || "CLIENT_ID",
  apiKey: process.env.PAYOS_API_KEY || "API_KEY",
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || "CHECKSUM_KEY",
});

// GET /api/landlord/viewings
export const getLandlordViewings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const landlordId = req.userId;
    if (!landlordId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const viewings = await viewingService.getLandlordViewings(landlordId);
    res.json({ viewings });
  } catch (err) {
    handleError(res, err);
  }
};

// PATCH /api/landlord/viewings/:id/approve
export const approveViewing = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const landlordId = req.userId;
    if (!landlordId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const viewing = await viewingService.approveViewing(
      req.params.id,
      landlordId,
    );
    res.json({
      message: "Viewing approved",
      viewing: { _id: viewing._id, status: viewing.status },
    });
  } catch (err) {
    handleError(res, err);
  }
};

// PATCH /api/landlord/viewings/:id/reject
export const rejectViewing = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const landlordId = req.userId;
    if (!landlordId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { reason } = req.body as { reason?: string };
    const viewing = await viewingService.rejectViewing(
      req.params.id,
      landlordId,
      reason,
    );
    res.json({
      message: "Viewing rejected",
      viewing: { _id: viewing._id, status: viewing.status },
    });
  } catch (err) {
    handleError(res, err);
  }
};

// POST /api/landlord/viewings/:id/pay
export const payViewing = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const landlordId = req.userId;
    if (!landlordId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { viewing, payment } = await viewingService.payViewing(
      req.params.id,
      landlordId,
    );

    // Generate PayOS checkout link
    const cancelUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/landlord/viewings?payment=cancel`;
    const returnUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/landlord/viewings?payment=success`;

    let checkoutUrl = "";
    try {
      const paymentLinkResponse = await payos.paymentRequests.create({
        orderCode: payment.orderCode!,
        amount: payment.amount,
        description: `Phi xem phong`.substring(0, 25),
        returnUrl,
        cancelUrl,
      });
      checkoutUrl = paymentLinkResponse.checkoutUrl;
    } catch (payosError) {
      console.error("PayOS create link error:", payosError);
      res.status(500).json({ error: "Failed to generate payment link" });
      return;
    }

    res.json({
      message: "Payment link generated",
      viewing: { _id: viewing._id, status: viewing.status },
      payment: {
        _id: payment._id,
        amount: payment.amount,
        status: payment.status,
      },
      checkoutUrl,
    });
  } catch (err) {
    handleError(res, err);
  }
};

// POST /api/landlord/viewings/payos-webhook - Handle PayOS webhook for viewing payments
export const handleViewingPayOSWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const webhookData = await payos.webhooks.verify(req.body);

    if (webhookData.code === "00") {
      const result = await viewingService.confirmViewingPayment(
        webhookData.orderCode,
      );
      if (result) {
        console.log(
          `✅ Viewing payment confirmed for viewing: ${result.viewing._id}`,
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Viewing PayOS webhook error:", err);
    res.json({ success: true });
  }
};

// POST /api/landlord/viewings/:id/decision
export const submitViewingDecision = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const landlordId = req.userId;
    if (!landlordId) {
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

    const { viewing, refund } = await viewingService.submitDecision(
      req.params.id,
      landlordId,
      decision,
    );

    res.json({
      message:
        decision === "confirmed" ? "Viewing completed" : "Viewing rejected",
      viewing: { _id: viewing._id, status: viewing.status },
      refund: refund
        ? { _id: refund._id, status: refund.status, reason: refund.reason }
        : null,
    });
  } catch (err) {
    handleError(res, err);
  }
};

// POST /api/landlord/viewings/:id/refund
export const requestRefund = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const landlordId = req.userId;
    if (!landlordId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const refund = await viewingService.requestLandlordRefund(
      req.params.id,
      landlordId,
    );

    res.json({
      message: "Refund request submitted",
      refund: { _id: refund._id, status: refund.status, reason: refund.reason },
    });
  } catch (err) {
    handleError(res, err);
  }
};

// ---------------------------------------------------------------------------
// Shared error handler
// ---------------------------------------------------------------------------
function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error("Viewing controller error:", err);
  res.status(500).json({ error: "Internal server error" });
}
