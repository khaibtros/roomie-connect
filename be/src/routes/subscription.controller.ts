import { Request, Response } from "express";
import { Subscription, SubscriptionPackage } from "../models";
import { Types } from "mongoose";
import { PayOS } from "@payos/node";

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || "CLIENT_ID",
  apiKey: process.env.PAYOS_API_KEY || "API_KEY",
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || "CHECKSUM_KEY",
});

// Subscription package prices (Maintenance fees)
const PACKAGE_PRICES: Record<
  SubscriptionPackage,
  { maintenance: number; commission: number }
> = {
  three_month: {
    maintenance: 1050000,
    commission: 200000,
  },
  six_month: {
    maintenance: 1920000,
    commission: 200000,
  },
  yearly: {
    maintenance: 3360000,
    commission: 200000,
  },
};

// Calculate end date based on package type
const calculateEndDate = (
  startDate: Date,
  packageType: SubscriptionPackage,
): Date => {
  const end = new Date(startDate);
  switch (packageType) {
    case "three_month":
      end.setMonth(end.getMonth() + 3);
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
        maintenanceFee: subscription.maintenanceFee,
        commissionPerContract: subscription.commissionPerContract,
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

    if (
      !packageType ||
      !["three_month", "six_month", "yearly"].includes(packageType)
    ) {
      res.status(400).json({ error: "Invalid package type" });
      return;
    }

    console.log(
      `💳 Processing subscription for landlord: ${landlordId}, Package: ${packageType}`,
    );

    const packageInfo = PACKAGE_PRICES[packageType as SubscriptionPackage];
    const orderCode = Number(
      String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000),
    );
    const startDate = new Date();
    const endDate = calculateEndDate(
      startDate,
      packageType as SubscriptionPackage,
    );

    const subscription = new Subscription({
      landlordId: new Types.ObjectId(landlordId),
      packageType,
      startDate,
      endDate,
      status: "pending",
      maintenanceFee: packageInfo.maintenance,
      commissionPerContract: packageInfo.commission,
      orderCode,
    });

    await subscription.save();

    // Generate PayOS link
    const cancelUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/landlord/subscription?status=cancel`;
    const returnUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/landlord/subscription?status=success`;

    let checkoutUrl = "";
    try {
      const paymentLinkResponse = await payos.paymentRequests.create({
        orderCode,
        amount: packageInfo.maintenance,
        description: `Goi ${packageType}`.substring(0, 25),
        returnUrl,
        cancelUrl,
      });
      checkoutUrl = paymentLinkResponse.checkoutUrl;
    } catch (payosError) {
      console.error("PayOS create link error:", payosError);
      res.status(500).json({ error: "Failed to generate payment link" });
      return;
    }

    console.log(`✅ Subscription created: ${subscription._id}`);
    console.log(`   Package: ${packageType}`);
    console.log(`   Maintenance: ${packageInfo.maintenance}`);
    console.log(`   Checkout URL generated`);

    res.status(201).json({
      message: "Subscription pending, please checkout",
      subscription: {
        id: subscription._id,
        packageType: subscription.packageType,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        maintenanceFee: subscription.maintenanceFee,
        commissionPerContract: subscription.commissionPerContract,
        status: subscription.status,
      },
      checkoutUrl,
    });
  } catch (error) {
    console.error("❌ Subscribe error:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
};

// POST /api/subscription/payos-webhook - Handle PayOS webhook
export const handlePayOSWebhook = async (req: Request, res: Response) => {
  try {
    const webhookData = await payos.webhooks.verify(req.body);

    if (webhookData.code === "00") {
      const subscription = await Subscription.findOne({
        orderCode: webhookData.orderCode,
      });
      if (subscription && subscription.status === "pending") {
        subscription.status = "active";
        subscription.paymentId =
          webhookData.reference || String(webhookData.orderCode);
        subscription.startDate = new Date();
        subscription.endDate = calculateEndDate(
          subscription.startDate,
          subscription.packageType as SubscriptionPackage,
        );
        await subscription.save();
        console.log(`✅ Webhook: Subscription ${subscription._id} activated.`);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("PayOS webhook error:", error);
    res.status(400).json({ error: "Invalid webhook payload" });
  }
};

// GET /api/subscription/packages - Get all subscription packages
export const getPackages = async (req: Request, res: Response) => {
  try {
    const packages = [
      {
        type: "three_month",
        name: "Gói 3 Tháng",
        duration: "3 months",
        maintenanceFee: 1050000,
        commissionPerContract: 200000,
        description: "Phù hợp với người mới bắt đầu",
        recommended: false,
        features: {
          maintenanceDisplay: "1.050.000 VNĐ",
          commission: "200.000 VNĐ",
          postsPerRoom: "1 tin / phòng",
          continuousDisplay: true,
          freeEdit: true,
          verificationBadge: true,
          basicPriority: true,
          aiSuggestions: true,
          analytics: "Cơ bản",
        },
      },
      {
        type: "six_month",
        name: "Gói 6 Tháng",
        duration: "6 months",
        maintenanceFee: 1920000,
        commissionPerContract: 200000,
        description: "Phổ biến nhất - Tiết kiệm 17%",
        recommended: true,
        features: {
          maintenanceDisplay: "1.920.000 VNĐ",
          commission: "200.000 VNĐ",
          postsPerRoom: "1 tin / phòng",
          continuousDisplay: true,
          freeEdit: true,
          verificationBadge: true,
          basicPriority: true,
          aiSuggestions: true,
          analytics: "Nâng cao",
        },
      },
      {
        type: "yearly",
        name: "Gói 1 Năm",
        duration: "12 months",
        maintenanceFee: 3360000,
        commissionPerContract: 200000,
        description: "Tiết kiệm tối đa - Ưu tiên cao nhất",
        recommended: false,
        features: {
          maintenanceDisplay: "3.360.000 VNĐ",
          commission: "200.000 VNĐ",
          postsPerRoom: "1 tin / phòng",
          continuousDisplay: true,
          freeEdit: true,
          verificationBadge: true,
          basicPriority: "✔ (ưu tiên cao nhất)",
          aiSuggestions: "✔ (ưu tiên ghép nối)",
          analytics: "Full dashboard",
        },
      },
    ];

    res.json({ packages });
  } catch (error) {
    console.error("❌ Get packages error:", error);
    res.status(500).json({ error: "Failed to get packages" });
  }
};

// Helper: Check if landlord has active subscription
export const hasActiveSubscription = async (
  landlordId: string,
): Promise<boolean> => {
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
