import { Request, Response } from "express";
import { Subscription, SubscriptionPackage } from "../models";
import { Types } from "mongoose";

// Subscription package prices
const PACKAGE_PRICES: Record<SubscriptionPackage, number> = {
  monthly: 300000,
  six_month: 1500000,
  yearly: 3000000,
};

// Calculate end date based on package type
const calculateEndDate = (startDate: Date, packageType: SubscriptionPackage): Date => {
  const end = new Date(startDate);
  switch (packageType) {
    case "monthly":
      end.setMonth(end.getMonth() + 1);
      break;
    case "six_month":
      end.setMonth(end.getMonth() + 6);
      break;
    case "yearly":
      end.setFullYear(end.getFullYear() + 1);
      break;
  }
  return end;
};

// GET /api/subscription/current - Get current active subscription
export const getCurrentSubscription = async (req: Request, res: Response) => {
  try {
    const landlordId = (req as any).userId;

    if (!landlordId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    console.log(`📋 Getting current subscription for landlord: ${landlordId}`);

    const subscription = await Subscription.findOne({
      landlordId,
      status: "active",
      endDate: { $gt: new Date() },
    }).sort({ endDate: -1 });

    if (!subscription) {
      console.log(`⚠️ No active subscription found for: ${landlordId}`);
      res.status(404).json({ subscription: null });
      return;
    }

    console.log(`✅ Found active subscription: ${subscription._id}`);
    res.json({
      subscription: {
        id: subscription._id,
        packageType: subscription.packageType,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        amount: subscription.amount,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error("❌ Get subscription error:", error);
    res.status(500).json({ error: "Failed to get subscription" });
  }
};

// POST /api/subscription/subscribe - Create new subscription
export const subscribe = async (req: Request, res: Response) => {
  try {
    const landlordId = (req as any).userId;
    const { packageType } = req.body;

    if (!landlordId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!packageType || !["monthly", "six_month", "yearly"].includes(packageType)) {
      res.status(400).json({ error: "Invalid package type" });
      return;
    }

    console.log(`💳 Processing subscription for landlord: ${landlordId}, Package: ${packageType}`);

    const amount = PACKAGE_PRICES[packageType as SubscriptionPackage];
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, packageType as SubscriptionPackage);

    // In real app, process payment here
    // For now, directly create subscription record

    const subscription = new Subscription({
      landlordId: new Types.ObjectId(landlordId),
      packageType,
      startDate,
      endDate,
      status: "active",
      amount,
      paymentId: `PAY_${Date.now()}`, // Mock payment ID
    });

    await subscription.save();

    console.log(`✅ Subscription created: ${subscription._id}`);
    console.log(`   End date: ${endDate}`);

    res.status(201).json({
      message: "Subscription created successfully",
      subscription: {
        id: subscription._id,
        packageType: subscription.packageType,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        amount: subscription.amount,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error("❌ Subscribe error:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
};

// GET /api/subscription/packages - Get all subscription packages
export const getPackages = async (req: Request, res: Response) => {
  try {
    const packages = [
      {
        type: "monthly",
        name: "Gói 1 tháng",
        price: 300000,
        duration: "1 month",
        description: "Phù hợp với người mới bắt đầu",
        recommended: false,
      },
      {
        type: "six_month",
        name: "Gói 6 tháng",
        price: 1500000,
        duration: "6 months",
        description: "Phổ biến nhất",
        recommended: true,
      },
      {
        type: "yearly",
        name: "Gói 1 năm",
        price: 3000000,
        duration: "12 months",
        description: "Tiết kiệm nhất",
        recommended: false,
      },
    ];

    res.json({ packages });
  } catch (error) {
    console.error("❌ Get packages error:", error);
    res.status(500).json({ error: "Failed to get packages" });
  }
};

// Helper: Check if landlord has active subscription
export const hasActiveSubscription = async (landlordId: string): Promise<boolean> => {
  try {
    const subscription = await Subscription.findOne({
      landlordId: new Types.ObjectId(landlordId),
      status: "active",
      endDate: { $gt: new Date() },
    });

    return !!subscription;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
};
