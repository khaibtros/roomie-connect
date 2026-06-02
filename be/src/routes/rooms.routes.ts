import { Router, Request, Response } from "express";
import { Room } from "../models";
import path from "path";
import fs from "fs";
import multer from "multer";
import {
  authMiddleware,
  landlordOnly,
  AuthRequest,
} from "../middleware/auth.middleware";
import { checkSubscriptionMiddleware } from "../middleware/subscription.middleware";

const router = Router();

// ── Room images upload – multer configuration ───────────────────────────
const MAX_ROOM_IMAGES = 10;
const MAX_ROOM_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_ROOM_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ROOM_UPLOADS_DIR = path.resolve(__dirname, "../../uploads/rooms");

// Create uploads dir on startup if it doesn't exist
if (!fs.existsSync(ROOM_UPLOADS_DIR)) {
  fs.mkdirSync(ROOM_UPLOADS_DIR, { recursive: true });
}

const roomImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ROOM_UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webp";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, uniqueName);
  },
});

const roomImageUploadMiddleware = multer({
  storage: roomImageStorage,
  limits: { fileSize: MAX_ROOM_IMAGE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_ROOM_IMAGE_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, WebP and GIF are allowed."));
    }
  },
}).array("images", MAX_ROOM_IMAGES);

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

// POST /api/rooms/upload-images - Upload multiple room images
router.post(
  "/upload-images",
  authMiddleware,
  landlordOnly,
  (req: AuthRequest, res: Response) => {
    roomImageUploadMiddleware(req as Request, res, async (err) => {
      if (err instanceof multer.MulterError) {
        const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        res.status(status).json({
          error:
            err.code === "LIMIT_FILE_SIZE"
              ? `File too large. Maximum allowed size is ${MAX_ROOM_IMAGE_SIZE_BYTES / (1024 * 1024)} MB.`
              : `Upload error: ${err.message}`,
        });
        return;
      }
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }

      const files = (req as Request).files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: "No files received." });
        return;
      }

      try {
        const host = `${req.protocol}://${req.get("host")}`;
        const imageURLs = files.map(
          (file) => `${host}/uploads/rooms/${file.filename}`,
        );

        res.json({ imageURLs });
      } catch (uploadErr) {
        console.error("Room images upload error:", uploadErr);
        res.status(500).json({ error: "Failed to upload images." });
      }
    });
  },
);

export default router;
