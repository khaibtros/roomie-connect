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

    // Fetch payments for these viewings in one query
    const viewingIds = viewings.map((v) => v._id);
    const payments = await Payment.find({ viewingId: { $in: viewingIds } });
    const paymentMap = new Map<string, IPayment>(
      payments.map((p) => [p.viewingId.toString(), p]),
    );

    return viewings.map((v) => {
      const extra = roomExtraMap.get(v.roomId.toString());
      const payment = paymentMap.get(v._id.toString()) || null;
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
  ): Promise<IViewingRequest> {
    const viewing = await ViewingRequest.findById(viewingId);
    if (!viewing) throw new ServiceError(404, "Viewing request not found");
    if (viewing.landlordId.toString() !== landlordId)
      throw new ServiceError(403, "Forbidden");
    if (viewing.status !== "pending")
      throw new ServiceError(400, "Only pending viewings can be rejected");

    viewing.status = "failed";
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
   * - confirmed → completed
   * - rejected  → failed + RefundRequest created
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
    if (viewing.status !== "confirmed")
      throw new ServiceError(
        400,
        "Can only submit decision for confirmed viewings",
      );

    let refund: IRefundRequest | null = null;

    // Track landlord decision
    const viewingDecision = await ViewingDecision.findOneAndUpdate(
      { viewingId: viewing._id },
      { landlordDecision: decision },
      { upsert: true, new: true },
    );

    if (decision === "confirmed") {
      // Only mark completed if tenant also confirmed
      if (viewingDecision.tenantDecision === "confirmed") {
        viewing.status = "completed";
      }
      // else stay "confirmed" until tenant decides
    } else {
      viewing.status = "failed";

      // Find the associated payment and create a refund request
      const payment = await Payment.findOne({ viewingId: viewing._id, status: "success" });
      if (payment) {
        refund = await RefundRequest.create({
          viewingId: viewing._id,
          paymentId: payment._id,
          status: "pending",
          reason: "Landlord rejected after viewing",
        });
      }
    }

    await viewing.save();
    return { viewing, refund };
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

    const confirmedViewings = viewings.filter((v) => v.status === "confirmed");
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
      const landlordContact =
        v.status === "confirmed"
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
        status: v.status,
        tenantDecision: decisionMap.get(v._id.toString()) ?? null,
        landlordContact,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };
    });
  },

  /**
   * Tenant submits a decision after the viewing takes place.
   * Updates ViewingDecision.tenantDecision.
   * If both parties confirmed → completed.
   * If tenant rejected → failed + RefundRequest created.
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

    // Track tenant decision
    const viewingDecision = await ViewingDecision.findOneAndUpdate(
      { viewingId: viewing._id },
      { tenantDecision: decision },
      { upsert: true, new: true },
    );

    let refund: IRefundRequest | null = null;

    if (decision === "rejected") {
      viewing.status = "failed";

      const payment = await Payment.findOne({ viewingId: viewing._id, status: "success" });
      if (payment) {
        refund = await RefundRequest.create({
          viewingId: viewing._id,
          paymentId: payment._id,
          status: "pending",
          reason: "Tenant rejected after viewing",
        });
      }
    } else if (
      viewingDecision.landlordDecision === "confirmed"
    ) {
      // Both confirmed → completed
      viewing.status = "completed";
    }
    // else tenant confirmed but landlord hasn't decided yet → stay confirmed

    await viewing.save();
    return { viewing, refund };
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
