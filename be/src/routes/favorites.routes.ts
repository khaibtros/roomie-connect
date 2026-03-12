import { Router, Request, Response } from "express";
import { Favorite, Room } from "../models";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// GET /api/favorites - Get all favorites for current user
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await Favorite.find({ userId: req.userId })
      .populate("roomId", "title price images address district area capacity")
      .sort({ createdAt: -1 });

    res.json({ favorites });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ error: "Failed to get favorites" });
  }
});

// POST /api/favorites/:roomId - Save/Add a room to favorites
router.post("/:roomId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    // Check if already favorited (prevent duplicates)
    const existing = await Favorite.findOne({
      userId: req.userId,
      roomId,
    });

    if (existing) {
      res.status(400).json({ error: "Room is already in favorites" });
      return;
    }

    // Create favorite
    const favorite = await Favorite.create({
      userId: req.userId,
      roomId,
    });

    res.status(201).json({
      message: "Room added to favorites",
      favorite,
    });
  } catch (error: any) {
    console.error("Add favorite error:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      res.status(400).json({ error: "Room is already in favorites" });
    } else {
      res.status(500).json({ error: "Failed to add favorite" });
    }
  }
});

// DELETE /api/favorites/:roomId - Remove a room from favorites
router.delete("/:roomId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      userId: req.userId,
      roomId,
    });

    if (!favorite) {
      res.status(404).json({ error: "Favorite not found" });
      return;
    }

    res.json({ message: "Room removed from favorites" });
  } catch (error) {
    console.error("Delete favorite error:", error);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

// GET /api/favorites/:roomId - Check if a room is favorited by current user
router.get("/check/:roomId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;

    const favorite = await Favorite.findOne({
      userId: req.userId,
      roomId,
    });

    res.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error("Check favorite error:", error);
    res.status(500).json({ error: "Failed to check favorite" });
  }
});

export default router;
