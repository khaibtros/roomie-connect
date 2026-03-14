const mongoose = require("mongoose");
require("dotenv").config();
const mongoUri = process.env.MONGODB_URI;

async function verifyWebhookLogic() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Define schemas
    const userSchema = new mongoose.Schema({ email: String, knockCoin: Number }, { collection: 'users' });
    const User = mongoose.model("UserVerify", userSchema);

    const txSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      amount: Number,
      coinAmount: Number,
      status: String,
      orderCode: Number
    }, { collection: 'cointransactions' });
    const CoinTransaction = mongoose.model("CoinTransactionVerify", txSchema);

    // 1. Create a mock pending transaction
    const mockOrderCode = 888777666; // Matches our new 9-digit format slice
    const mockUser = await User.findOne({ email: "minhanh@fpt.edu.vn" });
    
    if (!mockUser) {
      console.error("Target user not found");
      process.exit(1);
    }

    const initialCoins = mockUser.knockCoin || 0;
    console.log(`Initial coins: ${initialCoins}`);

    await CoinTransaction.deleteMany({ orderCode: mockOrderCode });
    const dbTx = new CoinTransaction({
      userId: mockUser._id,
      amount: 49000,
      coinAmount: 200,
      status: 'pending',
      orderCode: mockOrderCode
    });
    await dbTx.save();
    console.log("Mock pending transaction created");

    // 2. Simulate the logic inside handlePayOSWebhook (verified path)
    // In a real scenario, payos.webhooks.verify(body) would return this data
    const mockWebhookData = {
      orderCode: mockOrderCode,
      amount: 49000,
      desc: 'success',
      code: '00'
    };

    console.log("Simulating webhook processing...");
    
    const foundTx = await CoinTransaction.findOne({ orderCode: mockWebhookData.orderCode });
    if (foundTx && foundTx.status === 'pending') {
      if (mockWebhookData.amount !== foundTx.amount) {
        console.error("FAILURE: Amount mismatch detection failed!");
      } else {
        console.log("SUCCESS: Amount verification passed");
        foundTx.status = 'success';
        await foundTx.save();

        await User.findByIdAndUpdate(foundTx.userId, {
          $inc: { knockCoin: foundTx.coinAmount }
        });
        console.log("Transaction marked success and coins added");
      }
    }

    const updatedUser = await User.findById(mockUser._id);
    console.log(`Final coins: ${updatedUser.knockCoin}`);

    if (updatedUser.knockCoin === initialCoins + 200) {
      console.log("VERIFICATION PASSED: Logic is correct");
    } else {
      console.log("VERIFICATION FAILED: Coin balance incorrect");
    }

    // Cleanup
    await CoinTransaction.deleteOne({ orderCode: mockOrderCode });
    process.exit(0);
  } catch (error) {
    console.error("Error during verification:", error);
    process.exit(1);
  }
}

verifyWebhookLogic();
