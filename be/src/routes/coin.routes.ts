import { Router } from 'express';
import { getPackages, purchaseCoins, handlePayOSWebhook } from './coin.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Retrieve available packages
router.get('/packages', getPackages);

// Initiate purchase (needs auth)
router.post('/purchase', authMiddleware, purchaseCoins);

// PayOS Webhook (public)
router.post('/webhook', handlePayOSWebhook);

export default router;
