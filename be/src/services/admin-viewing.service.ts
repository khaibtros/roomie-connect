import { Types } from "mongoose";
import {
  ViewingRequest,
  Payment,
  RefundRequest,
  ViewingDecision,
  type ViewingStatus,
  type DecisionStatus,
  type PaymentStatus,
  type RefundStatus,
} from "../models/ViewingRequest";
import { Room } from "../models/Room";
import { User } from "../models/User";

// ---------------------------------------------------------------------------
// Admin Viewing DTO
// ---------------------------------------------------------------------------
interface AdminViewingRoomDTO {
  id: string;
  title: string;
  price: number;
  address: string;
  imageUrl: string;
}

interface AdminViewingUserDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface AdminViewingDTO {
  id: string;
  room: AdminViewingRoomDTO;
  landlord: AdminViewingUserDTO;
  tenant: AdminViewingUserDTO;
  scheduledTime: Date;
  status: ViewingStatus;
  paymentStatus: PaymentStatus | "none";
  landlordDecision: DecisionStatus | null;
  tenantDecision: DecisionStatus | null;
  refundStatus: RefundStatus | "none";
  refundId: string | null;
  rejectionReason: string | null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export const adminViewingService = {
  async getAllViewings(): Promise<AdminViewingDTO[]> {
    const viewings = await ViewingRequest.find().sort({ createdAt: -1 });
    if (viewings.length === 0) return [];

    // Collect IDs
    const viewingIds = viewings.map((v) => v._id as Types.ObjectId);
    const roomIds = [...new Set(viewings.map((v) => v.roomId.toString()))];
    const userIds = [
      ...new Set([
        ...viewings.map((v) => v.landlordId.toString()),
        ...viewings.map((v) => v.tenantId.toString()),
      ]),
    ];

    // Batch queries
    const [rooms, users, payments, refunds, decisions] = await Promise.all([
      Room.find({ _id: { $in: roomIds } }).select(
        "_id title price address images",
      ),
      User.find({ _id: { $in: userIds } }).select(
        "_id fullName email phone",
      ),
      Payment.find({ viewingId: { $in: viewingIds } }),
      RefundRequest.find({ viewingId: { $in: viewingIds } }),
      ViewingDecision.find({ viewingId: { $in: viewingIds } }),
    ]);

    const roomMap = new Map(rooms.map((r) => [r._id.toString(), r]));
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const paymentMap = new Map(
      payments.map((p) => [p.viewingId.toString(), p]),
    );
    const refundMap = new Map(
      refunds.map((r) => [r.viewingId.toString(), r]),
    );
    const decisionMap = new Map(
      decisions.map((d) => [d.viewingId.toString(), d]),
    );

    return viewings.map((v) => {
      const id = (v._id as Types.ObjectId).toString();
      const room = roomMap.get(v.roomId.toString());
      const landlord = userMap.get(v.landlordId.toString());
      const tenant = userMap.get(v.tenantId.toString());
      const payment = paymentMap.get(id);
      const refund = refundMap.get(id);
      const decision = decisionMap.get(id);

      return {
        id,
        room: {
          id: v.roomId.toString(),
          title: room?.title || v.roomInfo?.title || "",
          price: room?.price ?? v.roomInfo?.price ?? 0,
          address: room?.address || v.roomInfo?.address || "",
          imageUrl: (room?.images || [])[0] || "",
        },
        landlord: {
          id: v.landlordId.toString(),
          fullName: landlord?.fullName || "",
          email: landlord?.email || "",
          phone: landlord?.phone || "",
        },
        tenant: {
          id: v.tenantId.toString(),
          fullName: tenant?.fullName || "",
          email: tenant?.email || "",
          phone: tenant?.phone || "",
        },
        scheduledTime: v.scheduledTime,
        status: v.status,
        paymentStatus: payment ? payment.status : "none",
        landlordDecision: decision?.landlordDecision ?? null,
        tenantDecision: decision?.tenantDecision ?? null,
        refundStatus: refund ? refund.status : "none",
        refundId: refund ? (refund._id as Types.ObjectId).toString() : null,
        rejectionReason: v.rejectionReason || null,
      };
    });
  },

  async getViewingById(viewingId: string): Promise<AdminViewingDTO> {
    const v = await ViewingRequest.findById(viewingId);
    if (!v) throw new AdminServiceError(404, "Viewing request not found");

    const id = (v._id as Types.ObjectId).toString();

    const [room, landlord, tenant, payment, refund, decision] =
      await Promise.all([
        Room.findById(v.roomId).select("_id title price address images"),
        User.findById(v.landlordId).select("_id fullName email phone"),
        User.findById(v.tenantId).select("_id fullName email phone"),
        Payment.findOne({ viewingId: v._id }),
        RefundRequest.findOne({ viewingId: v._id }),
        ViewingDecision.findOne({ viewingId: v._id }),
      ]);

    return {
      id,
      room: {
        id: v.roomId.toString(),
        title: room?.title || v.roomInfo?.title || "",
        price: room?.price ?? v.roomInfo?.price ?? 0,
        address: room?.address || v.roomInfo?.address || "",
        imageUrl: (room?.images || [])[0] || "",
      },
      landlord: {
        id: v.landlordId.toString(),
        fullName: landlord?.fullName || "",
        email: landlord?.email || "",
        phone: landlord?.phone || "",
      },
      tenant: {
        id: v.tenantId.toString(),
        fullName: tenant?.fullName || "",
        email: tenant?.email || "",
        phone: tenant?.phone || "",
      },
      scheduledTime: v.scheduledTime,
      status: v.status,
      paymentStatus: payment ? payment.status : "none",
      landlordDecision: decision?.landlordDecision ?? null,
      tenantDecision: decision?.tenantDecision ?? null,
      refundStatus: refund ? refund.status : "none",
      refundId: refund ? (refund._id as Types.ObjectId).toString() : null,
      rejectionReason: v.rejectionReason || null,
    };
  },

  async approveRefund(refundId: string): Promise<void> {
    const refund = await RefundRequest.findById(refundId);
    if (!refund) throw new AdminServiceError(404, "Refund request not found");
    if (refund.status !== "pending")
      throw new AdminServiceError(400, "Only pending refunds can be approved");

    const payment = await Payment.findById(refund.paymentId);
    if (!payment) throw new AdminServiceError(404, "Associated payment not found");

    payment.status = "refunded";
    await payment.save();

    refund.status = "approved";
    await refund.save();
  },

  async rejectRefund(refundId: string): Promise<void> {
    const refund = await RefundRequest.findById(refundId);
    if (!refund) throw new AdminServiceError(404, "Refund request not found");
    if (refund.status !== "pending")
      throw new AdminServiceError(400, "Only pending refunds can be rejected");

    refund.status = "rejected";
    await refund.save();
  },
};

export class AdminServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminServiceError";
  }
}
