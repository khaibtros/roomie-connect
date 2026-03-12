import { Types } from "mongoose";
import {
  ViewingRequest,
  IViewingRequest,
  Payment,
  IPayment,
  RefundRequest,
  IRefundRequest,
  ViewingStatus,
  DecisionStatus,
  ViewingDecision,
} from "../models/ViewingRequest";
import { Room } from "../models/Room";
import { User } from "../models/User";

const VIEWING_FEE = 400_000;

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------
interface RoomExtra {
  image: string | null;
  area: number;
  capacity: number;
}

interface LandlordViewingDTO {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
  tenantId: Types.ObjectId;
  landlordId: Types.ObjectId;
  scheduledTime: Date;
  roomInfo: {
    roomId: Types.ObjectId;
    title: string;
    address: string;
    district: string;
    price: number;
    deposit?: number;
  };
  roomImage: string | null;
  roomArea: number;
  roomCapacity: number;
  status: ViewingStatus;
  landlordDecision: DecisionStatus | null;
  tenantContact?: { fullName: string; phone?: string };
  refund: { id: string; status: string } | null;
  payment: PaymentDTO | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentDTO {
  _id: Types.ObjectId;
  viewingId: Types.ObjectId;
  amount: number;
  status: string;
  createdAt: Date;
}

interface TenantContact {
  fullName: string;
  phone?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export const viewingService = {
  /**
   * Fetch all viewings for a given landlord, enriched with room extras
   * and associated payment info.
   */
  async getLandlordViewings(landlordId: string): Promise<LandlordViewingDTO[]> {
    const viewings = await ViewingRequest.find({ landlordId }).sort({
      createdAt: -1,
    });

    const roomIds = viewings.map((v) => v.roomId);
    const rooms = await Room.find({ _id: { $in: roomIds } }).select(
      "_id images area capacity",
    );
    const roomExtraMap = new Map<string, RoomExtra>(
      rooms.map((r) => [
        r._id.toString(),
        {
          image: (r.images || [])[0] || null,
          area: r.area || 0,
          capacity: r.capacity || 1,
        },
      ]),
    );

    // Fetch payments and decisions for these viewings in one query
    const viewingIds = viewings.map((v) => v._id);
    const [payments, decisions, refunds] = await Promise.all([
      Payment.find({ viewingId: { $in: viewingIds } }),
      ViewingDecision.find({ viewingId: { $in: viewingIds } }).select("viewingId landlordDecision"),
      RefundRequest.find({ viewingId: { $in: viewingIds } }).select("viewingId status"),
    ]);
    const paymentMap = new Map<string, IPayment>(
      payments.map((p) => [p.viewingId.toString(), p]),
    );
    const decisionMap = new Map<string, DecisionStatus | null>(
      decisions.map((d) => [d.viewingId.toString(), d.landlordDecision ?? null]),
    );
    const refundMap = new Map<string, IRefundRequest>(
      refunds.map((r) => [r.viewingId.toString(), r]),
    );

    // Fetch tenant contact info for confirmed/completed viewings
    const confirmedViewings = viewings.filter(
      (v) => v.status === "confirmed" || v.status === "completed" || v.status === "failed",
    );
    const tenantIds = [
      ...new Set(confirmedViewings.map((v) => v.tenantId.toString())),
    ];
    const tenants = await User.find({ _id: { $in: tenantIds } }).select(
      "_id fullName phone",
    );
    const tenantMap = new Map<string, { fullName: string; phone?: string }>(
      tenants.map((t) => [
        t._id.toString(),
        { fullName: t.fullName, phone: t.phone },
      ]),
    );

    return viewings.map((v) => {
      const extra = roomExtraMap.get(v.roomId.toString());
      const payment = paymentMap.get(v._id.toString()) || null;
      const refund = refundMap.get(v._id.toString()) || null;
      const tenantContact =
        v.status === "confirmed" || v.status === "completed" || v.status === "failed"
          ? tenantMap.get(v.tenantId.toString()) || undefined
          : undefined;
      return {
        _id: v._id as Types.ObjectId,
        roomId: v.roomInfo?.roomId || v.roomId,
        tenantId: v.tenantId,
        landlordId: v.landlordId,
        scheduledTime: v.scheduledTime,
        roomInfo: {
          roomId: v.roomInfo?.roomId || v.roomId,
          title: v.roomInfo?.title || "",
          address: v.roomInfo?.address || "",
          district: v.roomInfo?.district || "",
          price: v.roomInfo?.price || 0,
          deposit: v.roomInfo?.deposit,
        },
        roomImage: extra?.image || null,
        roomArea: extra?.area || 0,
        roomCapacity: extra?.capacity || 1,
        status: v.status,
        landlordDecision: decisionMap.get(v._id.toString()) ?? null,
        tenantContact,
        refund: refund
          ? { id: (refund._id as Types.ObjectId).toString(), status: refund.status }
          : null,
        payment: payment
          ? {
              _id: payment._id as Types.ObjectId,
              viewingId: payment.viewingId,
              amount: payment.amount,
              status: payment.status,
              createdAt: payment.createdAt,
            }
          : null,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };
    });
  },

  /**
   * Landlord requests a refund after rejecting the viewing.
   * Creates a RefundRequest linked to the payment for admin review.
   */
  async requestLandlordRefund(
    viewingId: string,
    landlordId: string,
  ): Promise<IRefundRequest> {
    const viewing = await ViewingRequest.findById(viewingId);
    if (!viewing) throw new ServiceError(404, "Viewing request not found");
    if (viewing.landlordId.toString() !== landlordId)
      throw new ServiceError(403, "Forbidden");
    if (!["confirmed", "completed", "failed"].includes(viewing.status))
      throw new ServiceError(400, "Can only request refund for confirmed, completed, or failed viewings");

    const viewingDecision = await ViewingDecision.findOne({ viewingId: viewing._id });
    if (!viewingDecision || viewingDecision.landlordDecision !== "rejected")
      throw new ServiceError(400, "Can only request refund after submitting a rejection decision");

    const existing = await RefundRequest.findOne({ viewingId: viewing._id });
    if (existing) throw new ServiceError(400, "Refund request already submitted");

    const payment = await Payment.findOne({ viewingId: viewing._id, status: "success" });
    if (!payment) throw new ServiceError(404, "No payment found for this viewing");

    const refund = await RefundRequest.create({
      viewingId: viewing._id,
      paymentId: payment._id,
      status: "pending",
      reason: "Landlord requested refund after not confirming the viewing",
    });

    return refund;
  },

  /**
   * Landlord approves a pending viewing → awaiting_payment.
   */
  async approveViewing(
    viewingId: string,
    landlordId: string,
  ): Promise<IViewingRequest> {
    const viewing = await ViewingRequest.findById(viewingId);
    if (!viewing) throw new ServiceError(404, "Viewing request not found");
    if (viewing.landlordId.toString() !== landlordId)
      throw new ServiceError(403, "Forbidden");
    if (viewing.status !== "pending")
      throw new ServiceError(400, "Only pending viewings can be approved");

    viewing.status = "awaiting_payment";
    await viewing.save();
    return viewing;
  },

  /**
   * Landlord rejects a pending viewing → failed.
   */
  async rejectViewing(
    viewingId: string,
    landlordId: string,
    reason?: string,
  ): Promise<IViewingRequest> {
    const viewing = await ViewingRequest.findById(viewingId);
    if (!viewing) throw new ServiceError(404, "Viewing request not found");
    if (viewing.landlordId.toString() !== landlordId)
      throw new ServiceError(403, "Forbidden");
    if (viewing.status !== "pending")
      throw new ServiceError(400, "Only pending viewings can be rejected");

    viewing.status = "failed";
    if (reason) viewing.rejectionReason = reason;
    await viewing.save();
    return viewing;
  },

  /**
   * Landlord pays the viewing fee (400 000 VND).
   * Creates a Payment record and transitions status → confirmed.
   */
  async payViewing(
    viewingId: string,
    landlordId: string,
  ): Promise<{ viewing: IViewingRequest; payment: IPayment }> {
    const viewing = await ViewingRequest.findById(viewingId);
    if (!viewing) throw new ServiceError(404, "Viewing request not found");
    if (viewing.landlordId.toString() !== landlordId)
      throw new ServiceError(403, "Forbidden");
    if (viewing.status !== "awaiting_payment")
      throw new ServiceError(
        400,
        "Viewing must be in awaiting_payment status to pay",
      );

    const payment = await Payment.create({
      viewingId: viewing._id,
      amount: VIEWING_FEE,
      status: "success",
    });

    viewing.status = "confirmed";
    await viewing.save();

    return { viewing, payment };
  },

  /**
   * Landlord submits a decision after the viewing takes place.
   * Decision is recorded as a signal for admin; it does NOT change
   * the viewing status or affect the tenant's side.
   */
  async submitDecision(
    viewingId: string,
    landlordId: string,
    decision: DecisionStatus,
  ): Promise<{
    viewing: IViewingRequest;
    refund: IRefundRequest | null;
  }> {
    const viewing = await ViewingRequest.findById(viewingId);
    if (!viewing) throw new ServiceError(404, "Viewing request not found");
    if (viewing.landlordId.toString() !== landlordId)
      throw new ServiceError(403, "Forbidden");
    if (!["confirmed", "completed", "failed"].includes(viewing.status))
      throw new ServiceError(
        400,
        "Can only submit decision for confirmed/completed/failed viewings",
      );

    // Track landlord decision (informational only – no status change)
    await ViewingDecision.findOneAndUpdate(
      { viewingId: viewing._id },
      { landlordDecision: decision },
      { upsert: true, new: true },
    );

    return { viewing, refund: null };
  },

  // =========================================================================
  // Tenant-side helpers (kept so tenant routes keep working)
  // =========================================================================

  /**
   * Tenant creates a viewing request for a room.
   */
  async createViewingRequest(
    tenantId: string,
    roomId: string,
    scheduledTime: string,
  ): Promise<IViewingRequest> {
    const room = await Room.findById(roomId);
    if (!room) throw new ServiceError(404, "Room not found");

    const existing = await ViewingRequest.findOne({
      tenantId,
      roomId,
      status: "pending",
    });
    if (existing)
      throw new ServiceError(
        400,
        "You already have a pending request for this room",
      );

    const viewingRequest = new ViewingRequest({
      tenantId: new Types.ObjectId(tenantId),
      landlordId: room.landlordId,
      roomId: new Types.ObjectId(roomId),
      scheduledTime: new Date(scheduledTime),
      roomInfo: {
        roomId: new Types.ObjectId(roomId),
        title: room.title,
        address: room.address,
        district: room.district,
        price: room.price,
        deposit: room.deposit,
      },
      status: "pending",
    });

    await viewingRequest.save();
    return viewingRequest;
  },

  /**
   * Fetch all viewings for a given tenant, with room extras and landlord contact
   * info for confirmed viewings.
   */
  async getTenantViewings(tenantId: string) {
    const viewings = await ViewingRequest.find({ tenantId }).sort({
      createdAt: -1,
    });

    const roomIds = viewings.map((v) => v.roomId);
    const rooms = await Room.find({ _id: { $in: roomIds } }).select(
      "_id images area capacity",
    );
    const roomExtraMap = new Map<string, RoomExtra>(
      rooms.map((r) => [
        r._id.toString(),
        {
          image: (r.images || [])[0] || null,
          area: r.area || 0,
          capacity: r.capacity || 1,
        },
      ]),
    );

    const confirmedViewings = viewings.filter(
      (v) => v.status === "confirmed" || v.status === "completed",
    );
    const landlordIds = [
      ...new Set(confirmedViewings.map((v) => v.landlordId.toString())),
    ];
    const landlords = await User.find({ _id: { $in: landlordIds } }).select(
      "_id fullName phone",
    );
    const landlordMap = new Map<string, TenantContact>(
      landlords.map((l) => [
        l._id.toString(),
        { fullName: l.fullName, zalo: l.phone },
      ]),
    );

    // Fetch tenant decisions for confirmed viewings
    const viewingIds = viewings.map((v) => v._id);
    const decisions = await ViewingDecision.find({
      viewingId: { $in: viewingIds },
    }).select("viewingId tenantDecision");
    const decisionMap = new Map<string, DecisionStatus | null>(
      decisions.map((d) => [d.viewingId.toString(), d.tenantDecision ?? null]),
    );

    return viewings.map((v) => {
      const extra = roomExtraMap.get(v.roomId.toString());
      const tenantDecision = decisionMap.get(v._id.toString()) ?? null;
      // If tenant has already submitted a decision but status wasn't updated
      // (handles legacy records created before status transition was implemented)
      let effectiveStatus = v.status;
      if (v.status === "confirmed" && tenantDecision != null) {
        effectiveStatus = tenantDecision === "confirmed" ? "completed" : "failed";
      }
      const landlordContact =
        effectiveStatus === "confirmed" || effectiveStatus === "completed" || effectiveStatus === "failed"
          ? landlordMap.get(v.landlordId.toString()) || undefined
          : undefined;

      return {
        _id: v._id as Types.ObjectId,
        roomId: v.roomInfo?.roomId || v.roomId,
        tenantId: v.tenantId,
        landlordId: v.landlordId,
        scheduledTime: v.scheduledTime,
        roomInfo: {
          roomId: v.roomInfo?.roomId || v.roomId,
          title: v.roomInfo?.title || "",
          address: v.roomInfo?.address || "",
          district: v.roomInfo?.district || "",
          price: v.roomInfo?.price || 0,
          deposit: v.roomInfo?.deposit,
        },
        roomImage: extra?.image || null,
        roomArea: extra?.area || 0,
        roomCapacity: extra?.capacity || 1,
        status: effectiveStatus,
        tenantDecision,
        landlordContact,
        rejectionReason: v.rejectionReason || null,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };
    });
  },

  /**
   * Tenant submits a decision after the viewing takes place.
   * Decision is recorded as a signal for admin; it does NOT change
   * the viewing status or affect the landlord's side.
   */
  async submitTenantDecision(
    viewingId: string,
    tenantId: string,
    decision: DecisionStatus,
  ): Promise<{
    viewing: IViewingRequest;
    refund: IRefundRequest | null;
  }> {
    const viewing = await ViewingRequest.findById(viewingId);
    if (!viewing) throw new ServiceError(404, "Viewing request not found");
    if (viewing.tenantId.toString() !== tenantId)
      throw new ServiceError(403, "Forbidden");
    if (viewing.status !== "confirmed")
      throw new ServiceError(
        400,
        "Can only submit decision for confirmed viewings",
      );

    // Record tenant decision and update viewing status accordingly
    await ViewingDecision.findOneAndUpdate(
      { viewingId: viewing._id },
      { tenantDecision: decision },
      { upsert: true, new: true },
    );

    viewing.status = decision === "confirmed" ? "completed" : "failed";
    await viewing.save();

    return { viewing, refund: null };
  },

  /**
   * Tenant cancels a pending viewing request.
   */
  async cancelViewingRequest(
    viewingId: string,
    tenantId: string,
  ): Promise<void> {
    const viewing = await ViewingRequest.findById(viewingId);
    if (!viewing) throw new ServiceError(404, "Viewing request not found");
    if (viewing.tenantId.toString() !== tenantId)
      throw new ServiceError(403, "Forbidden");
    if (viewing.status !== "pending")
      throw new ServiceError(400, "Only pending requests can be cancelled");

    await ViewingRequest.findByIdAndDelete(viewingId);
  },
};

// ---------------------------------------------------------------------------
// Custom error with status code for clean controller handling
// ---------------------------------------------------------------------------
export class ServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
