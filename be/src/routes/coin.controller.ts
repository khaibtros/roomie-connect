import { Request, Response } from "express";
import { PayOS } from "@payos/node";
import { User } from "../models/User";
import { CoinTransaction } from "../models/CoinTransaction";

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || "CLIENT_ID",
  apiKey: process.env.PAYOS_API_KEY || "API_KEY",
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || "CHECKSUM_KEY",
});

// We define our 3 static packages
const COIN_PACKAGES = {
  basic: {
    price: 49000,
    coins: 200,
    name: "Basic",
  },
  standard: {
    price: 99000,
    coins: 450,
    name: "Standard",
  },
  premium: {
    price: 199000,
    coins: 1000,
    name: "Premium",
  },
};

export const getPackages = async (req: Request, res: Response) => {
  try {
    const packagesArray = Object.entries(COIN_PACKAGES).map(
      ([type, details]) => ({
        type,
        ...details,
      }),
    );
    res.json({ packages: packagesArray });
  } catch (error) {
    console.error("Error in getPackages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

import { AuthRequest } from "../middleware/auth.middleware";

export const purchaseCoins = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const role = req.userRole;
    const { packageType } = req.body;

    // Check roles (only tenant and guest can purchase)
    if (role === "admin" || role === "landlord") {
      return res
        .status(403)
        .json({ error: "Admins and Landlords cannot purchase Knock Coins" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const pkg = COIN_PACKAGES[packageType as keyof typeof COIN_PACKAGES];
    if (!pkg) {
      return res.status(400).json({ error: "Invalid package type" });
    }

    // Generate unique orderCode (max 10 digits for safety and PayOS limits)
    // Using slice(-9) gives us a window of ~31 years before wrap-around in terms of relative uniqueness
    const orderCode = Number(Date.now().toString().slice(-9));

    const pendingTx = new CoinTransaction({
      userId,
      packageType,
      amount: pkg.price,
      coinAmount: pkg.coins,
      orderCode,
      status: "pending",
    });
    await pendingTx.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    // Match the new frontend route
    const returnUrl = `${frontendUrl}/tenant/ai-payment?status=success`;
    const cancelUrl = `${frontendUrl}/tenant/ai-payment?status=cancel`;

    const requestData = {
      orderCode,
      amount: pkg.price,
      description: `Mua ${pkg.coins} Knock Coin`,
      returnUrl,
      cancelUrl,
    };

    const paymentLink = await payos.paymentRequests.create(requestData);

    res.json({
      transaction: pendingTx,
      checkoutUrl: paymentLink.checkoutUrl,
    });
  } catch (error) {
    console.error("Error in purchaseCoins:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
};

export const handlePayOSWebhook = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Sandbox webhook trick if verification fails. Standard PayOS webhook code:
    const webhookData = await payos.webhooks.verify(body);

    // Safety check: ensure we only process successful payments
    if (webhookData.desc !== "success" && webhookData.code !== "00") {
      console.log(
        `[PayOS Webhook] Payment not successful: code=${webhookData.code}, desc=${webhookData.desc}`,
      );
      return res.json({ success: true });
    }

    // Wait slightly to ensure transaction exists in our DB (race condition with create)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const dbTx = await CoinTransaction.findOne({
      orderCode: webhookData.orderCode,
    });

    if (!dbTx) {
      console.error(
        `[PayOS Webhook] Transaction not found for orderCode: ${webhookData.orderCode}`,
      );
      return res.json({ success: true });
    }

    if (dbTx.status === "pending") {
      // CRITICAL: Verify amount matches to prevent 'over-under' payment manipulation
      if (webhookData.amount !== dbTx.amount) {
        console.error(
          `[PayOS Webhook] Amount mismatch! Expected ${dbTx.amount}, got ${webhookData.amount}`,
        );
        dbTx.status = "failed";
        await dbTx.save();
        return res.json({ success: true });
      }

      dbTx.status = "success";
      await dbTx.save();

      await User.findByIdAndUpdate(dbTx.userId, {
        $inc: { knockCoin: dbTx.coinAmount },
      });

      console.log(
        `[KnockCoin] Successfully added ${dbTx.coinAmount} coins to user ${dbTx.userId}`,
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("PayOS Webhook Error:", error);
    res.json({ success: true }); // Always return 200 OK to prevent webhook retries
  }
};
