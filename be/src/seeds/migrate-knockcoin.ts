import { connectDatabase } from "../config/database";
import { User } from "../models/User";

/**
 * Migration: Add knockCoin field to all existing users who don't have it yet.
 * Sets knockCoin = 0 for users missing the field.
 *
 * Run: npx ts-node src/seeds/migrate-knockcoin.ts
 */
async function migrate() {
  await connectDatabase();

  // Update all users where knockCoin does not exist
  const result = await User.updateMany(
    { knockCoin: { $exists: false } },
    { $set: { knockCoin: 0 } },
  );

  console.log(`✅ Updated ${result.modifiedCount} users (added knockCoin: 0)`);

  // Also ensure aiFreeChatUsed exists for old users
  const result2 = await User.updateMany(
    { aiFreeChatUsed: { $exists: false } },
    { $set: { aiFreeChatUsed: 0 } },
  );

  console.log(`✅ Updated ${result2.modifiedCount} users (added aiFreeChatUsed: 0)`);

  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
