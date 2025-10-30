import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/chatApp");
    console.log("MongoDB Connected ✅");
  } catch (err) {
    console.error("DB Connection Failed:", err.message);
  }
};

export default connectDB;
