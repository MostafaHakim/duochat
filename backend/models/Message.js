import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: String,
  message: String,
  type: { type: String, default: "text" }, // text, image, video
  timestamp: { type: Date, default: Date.now },
  roomCode: String,
});

export default mongoose.model("Message", messageSchema);
