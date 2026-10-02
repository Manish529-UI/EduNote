import mongoose from "mongoose";

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("✅ DB Connected")
    } catch (error) {
        console.log("❌ DB Connection Error:", error.message)
        throw error
    }
}
export default connectDb