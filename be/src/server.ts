import path from "path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import routes from "./routes";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middleware/error.middleware";

// Load environment variables first so process.env is populated before use
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// cors() with no arguments allows all origins — safe for local development.
// Tighten this in production via the FRONTEND_URL environment variable.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: false,
  }),
);

// JSON body limit: 1 MB is generous for all normal API payloads.
// File uploads (avatars) bypass this entirely because they use
// multipart/form-data handled by multer — they never touch express.json().
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Serve uploaded files (avatars, etc.) as static assets
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// API Routes
app.use("/api", routes);

// 404 handler
app.use(notFoundMiddleware);

// Error handler
app.use(errorMiddleware);

// Start server
const startServer = async () => {
  try {
    console.log(`\n🚀 Starting Roomie Connect API Server...\n`);

    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Roomie Connect API Ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server: http://localhost:${PORT}
🔗 API: http://localhost:${PORT}/api
📊 Health: http://localhost:${PORT}/api/health
🔐 JWT Secret: ${process.env.JWT_SECRET ? "✓ Configured" : "⚠️ Using default"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
  } catch (error) {
    console.error("\n❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
