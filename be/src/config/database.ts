import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/roomie-connect";

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log(`\n🔗 Attempting MongoDB connection...`);
    console.log(`📍 Database URI: ${MONGODB_URI.split('//')[1]?.split('@')[0]}@.../${MONGODB_URI.split('/').pop()}`);
    
    await mongoose.connect(MONGODB_URI);
    
    const dbName = mongoose.connection.name || 'unknown';
    console.log(`✅ MongoDB connected successfully`);
    console.log(`📦 Database: ${dbName}`);
    console.log(`🔌 Connection state: ${mongoose.connection.readyState}\n`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err);
});

export default mongoose;
