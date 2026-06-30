import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { User } from "../models";
import { Notification } from "../models/Notification";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { avatarStorage } from "../config/cloudinary";

const router = Router();

// In-memory OTP storage (key: email, value: { otp, expiresAt })
const otpStore: Record<string, { otp: string; expiresAt: number }> = {};

// ── Avatar upload – multer configuration ─────────────────────────────────
const MAX_AVATAR_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB (canvas already resized)

// Upload to Cloudinary
const avatarUploadMiddleware = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_AVATAR_SIZE_BYTES },
}).single("avatar");

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role = "tenant" } = req.body;

    console.log(`\n📝 REGISTER REQUEST: ${email}`);

    // Validation
    if (!email || !password || !fullName) {
      res
        .status(400)
        .json({ error: "Email, password, and fullName are required" });
      return;
    }

    // Check if user exists
    console.log(`🔍 Checking if user exists: ${email}`);
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`⚠️ User already exists: ${email}`);
      res.status(400).json({ error: "User already exists with this email" });
      return;
    }

    // Hash password
    console.log(`🔐 Hashing password...`);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log(`👤 Creating user object for: ${email}`);
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      role: ["admin", "landlord", "tenant"].includes(role) ? role : "tenant",
    });

    console.log(`💾 Saving user to database...`);
    const savedUser = await user.save();
    console.log(`✅ USER SAVED SUCCESSFULLY!`);
    console.log(`   ID: ${savedUser._id}`);
    console.log(`   Email: ${savedUser.email}`);
    console.log(`   Database: ${(savedUser.constructor as any).collection.name}\n`);

    // Create welcome notification
    await Notification.create({
      userId: savedUser._id,
      title: "Chào mừng đến Roomie Connect!",
      message: "Cảm ơn bạn đã đăng ký. Hãy hoàn thành quiz để tìm bạn ở phù hợp nhất!",
      type: "ROOM_UPDATE",
    });

    // Generate token
    const token = jwt.sign(
      { userId: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET || "default-secret",
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: savedUser._id,
        email: savedUser.email,
        fullName: savedUser.fullName,
        role: savedUser.role,
        knockCoin: savedUser.knockCoin ?? 0,
        aiTokens: savedUser.aiTokens,
      },
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password, expectedRole } = req.body;

    console.log(`\n🔓 LOGIN REQUEST: ${email} (expectedRole: ${expectedRole ?? "none"})`);

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Find user
    console.log(`🔍 Looking up user: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`⚠️ User not found: ${email}`);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    console.log(`✅ User found: ${user.email} (ID: ${user._id}, role: ${user.role})`);

    // Check if banned
    if (user.isBanned) {
      console.log(`🚫 User is banned: ${email}`);
      res.status(403).json({ error: "Account is banned" });
      return;
    }

    // Verify password
    console.log(`🔐 Verifying password...`);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`❌ Password mismatch for: ${email}`);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    console.log(`✅ Password verified for: ${email}`);

    // ── Role-portal enforcement ────────────────────────────────────────────
    // If the client specifies which portal they are logging in from,
    // make sure the account role matches exactly. This prevents an admin
    // or landlord account from logging in through the tenant portal (and
    // vice-versa). We only apply this check when expectedRole is provided
    // so that existing non-portal callers (e.g. internal tools) are unaffected.
    const validRoles = ["admin", "landlord", "tenant"] as const;
    if (expectedRole && validRoles.includes(expectedRole)) {
      if (user.role !== expectedRole) {
        console.log(
          `🚫 Role mismatch for ${email}: account is "${user.role}", portal requires "${expectedRole}"`,
        );
        res.status(403).json({
          error: "Tài khoản này không có quyền đăng nhập tại cổng này.",
        });
        return;
      }
    }

    console.log(`✅ Role check passed for: ${email}\n`);

    // Generate token — only reached when role is valid
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "default-secret",
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        university: user.university,
        workplace: user.workplace,
        bankName: user.bankName,
        bankAccount: user.bankAccount,
        role: user.role,
        isVerified: user.isVerified,
        knockCoin: user.knockCoin ?? 0,
        aiTokens: user.aiTokens,
        aiFreeChatUsed: user.aiFreeChatUsed ?? 0,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// GET /api/auth/profile
router.get(
  "/profile",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User.findById(req.userId).select("-password");
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ user });
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  },
);

// PUT /api/auth/profile
router.put(
  "/profile",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const allowedUpdates = [
        "fullName",
        "avatarUrl",
        "phone",
        "university",
        "workplace",
        "bankName",
        "bankAccount",
      ];

      const updates: Record<string, any> = {};
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { $set: updates },
        { new: true },
      ).select("-password");

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ message: "Profile updated", user });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  },
);

// POST /api/auth/upload-avatar
// Content-Type must be multipart/form-data — never application/json.
// This route intentionally bypasses express.json(); multer reads the stream
// directly, so no PayloadTooLargeError from the JSON body-parser.
router.post(
  "/upload-avatar",
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    avatarUploadMiddleware(req as Request, res, async (err) => {
      // multer-specific errors (file too large, wrong field name, etc.)
      if (err instanceof multer.MulterError) {
        const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        res.status(status).json({
          error:
            err.code === "LIMIT_FILE_SIZE"
              ? `File too large. Maximum allowed size is ${MAX_AVATAR_SIZE_BYTES / (1024 * 1024)} MB.`
              : `Upload error: ${err.message}`,
        });
        return;
      }
      // Application-level errors (wrong MIME type, etc.)
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }

      const file = (req as Request).file;
      if (!file) {
        res.status(400).json({ error: "No file received." });
        return;
      }

      try {
        const avatarUrl = file.path;

        // Persist new avatarUrl to MongoDB
        const user = await User.findByIdAndUpdate(
          req.userId,
          { $set: { avatarUrl } },
          { new: true },
        ).select("-password");

        if (!user) {
          res.status(404).json({ error: "User not found." });
          return;
        }

        res.json({ avatarUrl });
      } catch (dbErr) {
        console.error("upload-avatar DB error:", dbErr);
        res.status(500).json({ error: "Failed to save avatar URL." });
      }
    });
  },
);

// Helper function to generate OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-otp
router.post("/send-otp", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({ error: "User not found with this email" });
      return;
    }

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore[email.toLowerCase()] = { otp, expiresAt };

    // In production, send OTP via email service (SendGrid, Nodemailer, etc.)
    // For now, just log it
    console.log(`OTP for ${email}: ${otp}`);

    // Simulate sending email
    setTimeout(() => {
      console.log(`[Email sent] OTP: ${otp} to ${email}`);
    }, 100);

    res.json({
      message: "OTP sent to your email",
      // Remove this in production - only for testing
      devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ error: "Email, OTP, and new password are required" });
      return;
    }

    // Validate OTP
    const storedOtp = otpStore[email.toLowerCase()];
    if (!storedOtp) {
      res.status(400).json({ error: "OTP not found. Please request a new one" });
      return;
    }

    if (storedOtp.otp !== otp) {
      res.status(400).json({ error: "Invalid OTP" });
      return;
    }

    if (Date.now() > storedOtp.expiresAt) {
      delete otpStore[email.toLowerCase()];
      res.status(400).json({ error: "OTP has expired" });
      return;
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Delete OTP
    delete otpStore[email.toLowerCase()];

    res.json({ message: "Password reset successfully. You can now login." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// POST /api/auth/change-password (for authenticated users)
router.post("/change-password", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current password and new password are required" });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ error: "New password must be different from current password" });
      return;
    }

    // Find user
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
