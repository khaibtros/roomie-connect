import { Router, Response, NextFunction } from "express";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth.middleware";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
} from "./service.controller";

const router = Router();

const tenantOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== "tenant" && req.userRole !== "admin") {
    res.status(403).json({ error: "Tenant access required" });
    return;
  }
  next();
};

// Tenant routes
router.post("/bookings", authMiddleware, tenantOnly, createBooking);
router.get("/my-bookings", authMiddleware, tenantOnly, getMyBookings);
router.patch("/bookings/:id/cancel", authMiddleware, tenantOnly, cancelBooking);

// Admin routes
router.get("/admin/bookings", authMiddleware, adminOnly, getAllBookings);
router.patch("/admin/bookings/:id/status", authMiddleware, adminOnly, updateBookingStatus);

export default router;
