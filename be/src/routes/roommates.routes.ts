import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { RoommateProfile, User } from "../models";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

const UNLOCK_COST_KNOCK_COIN = 50;

// GET /api/roommates - List public roommate profiles
router.get("/", async (req: Request, res: Response) => {
  try {
    const { university, page = 1, limit = 20 } = req.query;

    const query: Record<string, any> = { isPublic: true };
    if (university) query.university = university;

    const skip = (Number(page) - 1) * Number(limit);

    const [profiles, total] = await Promise.all([
      RoommateProfile.find(query)
        .populate("userId", "fullName avatarUrl isVerified university")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      RoommateProfile.countDocuments(query),
    ]);

    res.json({
      profiles,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get roommates error:", error);
    res.status(500).json({ error: "Failed to get roommate profiles" });
  }
});

// GET /api/roommates/unlocks - Get unlocked roommate userIds
router.get(
  "/unlocks",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User.findById(req.userId).select("unlockedRoommateUserIds knockCoin");
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        unlockedUserIds: (user.unlockedRoommateUserIds || []).map((id) => id.toString()),
        knockCoin: user.knockCoin ?? 0,
      });
    } catch (error) {
      console.error("Get roommate unlocks error:", error);
      res.status(500).json({ error: "Failed to get unlocks" });
    }
  },
);

// POST /api/roommates/unlock - Purchase unlock for a roommate userId
router.post(
  "/unlock",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { targetUserId } = req.body as { targetUserId?: string };

      if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
        res.status(400).json({ error: "Invalid targetUserId" });
        return;
      }
      if (targetUserId === req.userId?.toString()) {
        res.status(400).json({ error: "Cannot unlock yourself" });
        return;
      }

      const targetExists = await User.exists({ _id: targetUserId });
      if (!targetExists) {
        res.status(404).json({ error: "Target user not found" });
        return;
      }

      const updated = await User.findOneAndUpdate(
        {
          _id: req.userId,
          knockCoin: { $gte: UNLOCK_COST_KNOCK_COIN },
          unlockedRoommateUserIds: { $ne: targetUserId },
        },
        {
          $inc: { knockCoin: -UNLOCK_COST_KNOCK_COIN },
          $addToSet: { unlockedRoommateUserIds: targetUserId },
        },
        { new: true },
      ).select("knockCoin unlockedRoommateUserIds");

      if (!updated) {
        res.status(402).json({ error: "Not enough Knock Coin" });
        return;
      }

      res.json({
        message: "Unlocked",
        knockCoin: updated.knockCoin ?? 0,
        unlockedUserIds: (updated.unlockedRoommateUserIds || []).map((id) => id.toString()),
        cost: UNLOCK_COST_KNOCK_COIN,
      });
    } catch (error) {
      console.error("Unlock roommate error:", error);
      res.status(500).json({ error: "Failed to unlock" });
    }
  },
);

// GET /api/roommates/my - Get current user's profile
router.get("/my", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let profile = await RoommateProfile.findOne({ userId: req.userId });

    if (!profile) {
      // Create empty profile if not exists
      profile = new RoommateProfile({ userId: req.userId });
      await profile.save();
    }

    res.json({ profile });
  } catch (error) {
    console.error("Get my profile error:", error);
    res.status(500).json({ error: "Failed to get your profile" });
  }
});

// PUT /api/roommates/my - Update current user's profile
router.put("/my", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await RoommateProfile.findOneAndUpdate(
      { userId: req.userId },
      { $set: req.body },
      { new: true, upsert: true },
    );

    res.json({ message: "Profile updated", profile });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// POST /api/roommates/match - Find matching roommates
router.post(
  "/match",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const myProfile = await RoommateProfile.findOne({ userId: req.userId });
      if (!myProfile || !myProfile.preferences) {
        res.status(400).json({ error: "Please complete your quiz first" });
        return;
      }

      // Get all public profiles except current user
      const profiles = await RoommateProfile.find({
        userId: { $ne: req.userId },
        isPublic: true,
      }).populate("userId", "fullName avatarUrl isVerified university");

      // Calculate match scores
      const matches = profiles.map((profile) => {
        let score = 0;
        let matchingTraits: string[] = [];

        const myPrefs = myProfile.preferences as any;
        const theirPrefs = profile.preferences as any;

        // Ensure preferences exist
        if (!myPrefs?.personalityType || !theirPrefs?.personalityType) {
           return { profile, score: 0, matchingTraits: [] };
        }

        // 1. Personality Match (max 60 points)
        // Compare MBTI characters (e.g. "INTJ" vs "ENTP")
        let personalityScore = 0;
        const myType = myPrefs.personalityType as string;
        const theirType = theirPrefs.personalityType as string;
        
        for (let i = 0; i < 4; i++) {
          if (myType[i] && theirType[i] && myType[i] === theirType[i]) {
            personalityScore += 15; // 15 points per matching character
            matchingTraits.push(`Cùng tính cách ${myType[i]}`);
          }
        }
        score += personalityScore;

        // 2. Lifestyle Match (max 40 points)
        let lifestyleScore = 0;
        const myTags = (myPrefs.lifestyleTags || []) as string[];
        const theirTags = (theirPrefs.lifestyleTags || []) as string[];

        if (myTags.length > 0 && theirTags.length > 0) {
          const sharedTags = myTags.filter(tag => theirTags.includes(tag));
          lifestyleScore = Math.round((sharedTags.length / myTags.length) * 40);
          score += lifestyleScore;
          // Add some shared tags to matchingTraits
          sharedTags.slice(0, 3).forEach(tag => matchingTraits.push(tag));
        }

        return {
          profile,
          score,
          matchingTraits: Array.from(new Set(matchingTraits)),
        };
      });

      // Sort by score descending
      matches.sort((a, b) => b.score - a.score);

      res.json({ matches: matches.slice(0, 20) });
    } catch (error) {
      console.error("Match error:", error);
      res.status(500).json({ error: "Failed to find matches" });
    }
  },
);

// GET /api/roommates/:id - Get specific profile
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const profile = await RoommateProfile.findById(req.params.id).populate(
      "userId",
      "fullName avatarUrl isVerified university",
    );

    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    if (!profile.isPublic) {
      res.status(403).json({ error: "Profile is private" });
      return;
    }

    res.json({ profile });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// POST /api/roommates/pay-retake - Pay 50 coins to retake quiz
router.post(
  "/pay-retake",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User.findOneAndUpdate(
        { _id: req.userId, knockCoin: { $gte: UNLOCK_COST_KNOCK_COIN } },
        { $inc: { knockCoin: -UNLOCK_COST_KNOCK_COIN } },
        { new: true },
      ).select("knockCoin");

      if (!user) {
        res.status(402).json({ error: "Not enough Knock Coin" });
        return;
      }

      res.json({
        message: "Payment successful",
        knockCoin: user.knockCoin ?? 0,
        cost: UNLOCK_COST_KNOCK_COIN,
      });
    } catch (error) {
      console.error("Pay retake error:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  },
);

export default router;
