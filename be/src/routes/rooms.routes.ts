import { Router, Request, Response } from "express";
import { Room } from "../models";
import {
  authMiddleware,
  landlordOnly,
  AuthRequest,
} from "../middleware/auth.middleware";
import { checkSubscriptionMiddleware } from "../middleware/subscription.middleware";

const router = Router();

// GET /api/rooms - List all active rooms (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      district,
      minPrice,
      maxPrice,
      status = "active",
      page = 1,
      limit = 20,
    } = req.query;

    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (district) query.district = district;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [rooms, total] = await Promise.all([
      Room.find(query)
        .populate("landlordId", "fullName avatarUrl phone isVerified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Room.countDocuments(query),
    ]);

    res.json({
      rooms,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ error: "Failed to get rooms" });
  }
});

// GET /api/rooms/:id - Get single room (public)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const room = await Room.findById(req.params.id).populate(
      "landlordId",
      "fullName avatarUrl phone isVerified",
    );

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    res.json({ room });
  } catch (error) {
    console.error("Get room error:", error);
    res.status(500).json({ error: "Failed to get room" });
  }
});

// POST /api/rooms - Create room (landlord only)
router.post(
  "/",
  authMiddleware,
  landlordOnly,
  checkSubscriptionMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const roomData = {
        ...req.body,
        landlordId: req.userId,
        status: "pending", // Needs admin approval
      };

      const room = new Room(roomData);
      await room.save();

      res.status(201).json({
        message: "Room created, waiting for approval",
        room,
      });
    } catch (error) {
      console.error("Create room error:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  },
);

// PUT /api/rooms/:id - Update room (landlord owner only)
router.put(
  "/:id",
  authMiddleware,
  landlordOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const room = await Room.findById(req.params.id);

      if (!room) {
        res.status(404).json({ error: "Room not found" });
        return;
      }

      // Check ownership
      if (
        room.landlordId.toString() !== req.userId &&
        req.userRole !== "admin"
      ) {
        res.status(403).json({ error: "Not authorized to update this room" });
        return;
      }

      // Don't allow changing landlordId
      delete req.body.landlordId;

      const updatedRoom = await Room.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true },
      ).populate("landlordId", "fullName avatarUrl phone isVerified");

      res.json({ message: "Room updated", room: updatedRoom });
    } catch (error) {
      console.error("Update room error:", error);
      res.status(500).json({ error: "Failed to update room" });
    }
  },
);

// DELETE /api/rooms/:id - Delete room (landlord owner only)
router.delete(
  "/:id",
  authMiddleware,
  landlordOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const room = await Room.findById(req.params.id);

      if (!room) {
        res.status(404).json({ error: "Room not found" });
        return;
      }

      // Check ownership
      if (
        room.landlordId.toString() !== req.userId &&
        req.userRole !== "admin"
      ) {
        res.status(403).json({ error: "Not authorized to delete this room" });
        return;
      }

      await Room.findByIdAndDelete(req.params.id);

      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("Delete room error:", error);
      res.status(500).json({ error: "Failed to delete room" });
    }
  },
);

// GET /api/rooms/my/listings - Get landlord's own rooms
router.get(
  "/my/listings",
  authMiddleware,
  landlordOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const rooms = await Room.find({ landlordId: req.userId }).sort({
        createdAt: -1,
      });

      res.json({ rooms });
    } catch (error) {
      console.error("Get my rooms error:", error);
      res.status(500).json({ error: "Failed to get your rooms" });
    }
  },
);

export default router;
