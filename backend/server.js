// Server (fixed version)
import "dotenv/config.js";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import connectDB from "./config/db.js";
import Message from "./models/Message.js";
import uploadRoutes from "./routes/upload.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "backend/uploads"))
);

connectDB();
app.use("/api/upload", uploadRoutes);

const rooms = {};
const algorithm = "aes-256-cbc";

const getKeyFromCode = (code) =>
  crypto.createHash("sha256").update(String(code)).digest();

const encrypt = (text, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString("hex"), encryptedData: encrypted.toString("hex") };
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create-room", (roomCode) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = { users: [socket.id] };
      socket.join(roomCode);
      socket.emit("room-created", { roomCode });
    } else {
      socket.emit("error", "Room already exists");
    }
  });

  socket.on("join-room", async (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return socket.emit("error", "Room does not exist");

    room.users.push(socket.id);
    socket.join(roomCode);

    const messages = await Message.find({ roomCode }).sort({ createdAt: 1 });
    socket.emit("message-history", messages);

    socket.emit("room-joined", { roomCode });
    io.to(roomCode).emit("user-joined", socket.id);
  });

  // NEW: Leave room handler
  socket.on("leaveRoom", (roomCode) => {
    console.log("User leaving room:", socket.id, roomCode);

    if (rooms[roomCode]) {
      const index = rooms[roomCode].users.indexOf(socket.id);
      if (index !== -1) {
        rooms[roomCode].users.splice(index, 1);
        socket.leave(roomCode);

        // Confirm to client
        socket.emit("room-left", { roomCode });

        // Notify other users
        socket.to(roomCode).emit("user-left", { userId: socket.id });

        if (rooms[roomCode].users.length === 0) {
          delete rooms[roomCode];
          console.log(`Room ${roomCode} deleted (empty)`);
        }
      }
    }
  });

  socket.on("sendMessage", async (data) => {
    const { roomCode, message, sender, type } = data;
    const room = rooms[roomCode];
    if (!room || !room.users.includes(socket.id))
      return socket.emit("error", "You are not a member of this room.");

    let finalMessage = message;

    if (type === "text") {
      const key = getKeyFromCode(roomCode);
      const encryptedMessage = encrypt(message, key);
      finalMessage = JSON.stringify(encryptedMessage);
    }

    const newMsg = await Message.create({
      sender,
      message: finalMessage,
      type,
      roomCode,
      timestamp: new Date(),
    });

    io.to(roomCode).emit("receiveMessage", newMsg);
  });

  socket.on("deleteMessage", async (messageId) => {
    try {
      await Message.findByIdAndDelete(messageId);
      io.emit("messageDeleted", messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const roomCode in rooms) {
      const index = rooms[roomCode].users.indexOf(socket.id);
      if (index !== -1) {
        rooms[roomCode].users.splice(index, 1);
        if (rooms[roomCode].users.length === 0) {
          delete rooms[roomCode];
        }
        break;
      }
    }
  });
});

server.listen(5000, () => console.log("✅ Server running on port 5000"));
