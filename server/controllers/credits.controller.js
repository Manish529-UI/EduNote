import Razorpay from "razorpay";
import crypto from "crypto";
import UserModel from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay KEY_ID or KEY_SECRET missing in .env");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const CREDIT_MAP = {
  100: 50,
  200: 120,
  500: 300,
};

/**
 * POST /api/credit/order
 * Creates a Razorpay order and returns the details needed by the frontend checkout.
 */
export const createCreditsOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { amount } = req.body;

    if (!CREDIT_MAP[amount]) {
      return res.status(400).json({ message: "Invalid credit plan" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects paise
      currency: "INR",
      receipt: `credits_${userId}_${Date.now()}`,
      notes: {
        userId,
        credits: String(CREDIT_MAP[amount]),
      },
    });

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      credits: CREDIT_MAP[amount],
    });
  } catch (error) {
    console.error("Razorpay order error:", error.message);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

/**
 * POST /api/credit/verify
 * Verifies the Razorpay payment signature and credits the user.
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const userId = req.userId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Signature valid — credit the user
    const creditsToAdd = CREDIT_MAP[amount];

    if (!creditsToAdd) {
      return res.status(400).json({ message: "Invalid credit amount" });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        $inc: { credits: creditsToAdd },
        $set: { isCreditAvailable: true },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified & credits added",
      credits: user.credits,
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);
    res.status(500).json({ message: "Payment verification failed" });
  }
};