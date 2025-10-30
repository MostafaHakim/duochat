// // import "dotenv/config.js";
// // import express from "express";
// // import http from "http";
// // import { Server } from "socket.io";
// // import cors from "cors";
// // import path from "path";
// // import crypto from "crypto";
// // import connectDB from "./config/db.js";
// // import Message from "./models/Message.js";
// // import uploadRoutes from "./routes/upload.js";

// // const app = express();
// // const server = http.createServer(app);
// // const io = new Server(server, {
// //   cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
// // });

// // app.use(cors());
// // app.use(express.json());
// // app.use("/uploads", express.static(path.join(process.cwd(), "backend/uploads")));

// // connectDB();

// // // API Routes
// // app.use("/api/upload", uploadRoutes);

// // const rooms = {};
// // const algorithm = "aes-256-cbc";

// // // Function to derive a key from the room code
// // const getKeyFromCode = (code) => {
// //   return crypto.createHash('sha256').update(String(code)).digest();
// // }

// // const encrypt = (text, key) => {
// //   const iv = crypto.randomBytes(16);
// //   const cipher = crypto.createCipheriv(algorithm, key, iv);
// //   let encrypted = cipher.update(text);
// //   encrypted = Buffer.concat([encrypted, cipher.final()]);
// //   return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
// // };

// // // Socket.io real-time chat
// // io.on("connection", (socket) => {
// //   console.log("User connected:", socket.id);

// //   socket.on("create-room", (roomCode) => {
// //     if (!rooms[roomCode]) {
// //       rooms[roomCode] = { users: [socket.id] };
// //       socket.join(roomCode);
// //       socket.emit("room-created", { roomCode });
// //     } else {
// //       socket.emit("error", "Room already exists");
// //     }
// //   });

// //   socket.on("join-room", (roomCode) => {
// //     if (rooms[roomCode]) {
// //       if (rooms[roomCode].users.length < 2) {
// //         rooms[roomCode].users.push(socket.id);
// //         socket.join(roomCode);

// //         // Fetch message history and send to the user
// //         Message.find({ roomCode })
// //           .sort({ createdAt: 1 })
// //           .then((messages) => {
// //             socket.emit("message-history", messages);
// //           });

// //         socket.emit("room-joined", { roomCode });
// //         io.to(roomCode).emit("user-joined", socket.id);
// //       } else {
// //         socket.emit("error", "Room is full");
// //       }
// //     } else {
// //       socket.emit("error", "Room does not exist");
// //     }
// //   });

// //   socket.on("sendMessage", async (data) => {
// //     const { roomCode, message, sender, type } = data;
// //     // Verify the user is in the room before sending the message
// //     if (rooms[roomCode] && rooms[roomCode].users.includes(socket.id)) {
// //       const key = getKeyFromCode(roomCode);
// //       const encryptedMessage = encrypt(message, key);
// //       const newMsg = await Message.create({
// //         sender,
// //         message: JSON.stringify(encryptedMessage),
// //         type,
// //         roomCode,
// //       });
// //       io.to(roomCode).emit("receiveMessage", newMsg);
// //     } else {
// //       // Optional: Send an error back to the sender if they are not in the room
// //       socket.emit("error", "You are not a member of this room.");
// //     }
// //   });

// //   socket.on("deleteMessage", async (messageId) => {
// //     try {
// //       await Message.findByIdAndDelete(messageId);
// //       // Assuming you have room info in the message object to broadcast to the correct room
// //       // For now, this will do
// //       io.emit("messageDeleted", messageId);
// //     } catch (error) {
// //       console.error("Error deleting message:", error);
// //     }
// //   });

// //   socket.on("disconnect", () => {
// //     console.log("User disconnected:", socket.id);
// //     for (const roomCode in rooms) {
// //       const index = rooms[roomCode].users.indexOf(socket.id);
// //       if (index !== -1) {
// //         rooms[roomCode].users.splice(index, 1);
// //         if (rooms[roomCode].users.length === 0) {
// //           delete rooms[roomCode];
// //         }
// //         break;
// //       }
// //     }
// //   });
// // });

// // server.listen(5000, () => console.log("✅ Server running on port 5000"));

// import "dotenv/config.js";
// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import cors from "cors";
// import path from "path";
// import crypto from "crypto";
// import connectDB from "./config/db.js";
// import Message from "./models/Message.js";
// import uploadRoutes from "./routes/upload.js";

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
// });

// app.use(cors());
// app.use(express.json());
// app.use(
//   "/uploads",
//   express.static(path.join(process.cwd(), "backend/uploads"))
// );

// connectDB();

// // API Routes
// app.use("/api/upload", uploadRoutes);

// // Rooms object
// const rooms = {};
// const algorithm = "aes-256-cbc";

// // Encryption helpers
// const getKeyFromCode = (code) =>
//   crypto.createHash("sha256").update(String(code)).digest();

// const encrypt = (text, key) => {
//   const iv = crypto.randomBytes(16);
//   const cipher = crypto.createCipheriv(algorithm, key, iv);
//   let encrypted = cipher.update(text);
//   encrypted = Buffer.concat([encrypted, cipher.final()]);
//   return { iv: iv.toString("hex"), encryptedData: encrypted.toString("hex") };
// };

// // Socket.io connection
// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

//   // Create room
//   socket.on("create-room", (roomCode) => {
//     if (!rooms[roomCode]) {
//       rooms[roomCode] = { users: [socket.id] };
//       socket.join(roomCode);
//       socket.emit("room-created", { roomCode });
//     } else {
//       socket.emit("error", "Room already exists");
//     }
//   });

//   // Join room
//   socket.on("join-room", async (roomCode) => {
//     const room = rooms[roomCode];
//     if (!room) return socket.emit("error", "Room does not exist");

//     // if (room.users.length >= 3) return socket.emit("error", "Room is full");

//     room.users.push(socket.id);
//     socket.join(roomCode);

//     // Send previous messages
//     const messages = await Message.find({ roomCode }).sort({ createdAt: 1 });
//     socket.emit("message-history", messages);

//     // Notify users
//     socket.emit("room-joined", { roomCode });
//     io.to(roomCode).emit("user-joined", socket.id);
//   });

//   // Send message
//   // socket.on("sendMessage", async (data) => {
//   //   const { roomCode, message, sender, type } = data;
//   //   const room = rooms[roomCode];
//   //   if (!room || !room.users.includes(socket.id))
//   //     return socket.emit("error", "You are not a member of this room.");

//   //   let finalMessage = message;

//   //   // Encrypt text messages only
//   //   if (type === "text") {
//   //     const key = getKeyFromCode(roomCode);
//   //     const encryptedMessage = encrypt(message, key);
//   //     finalMessage = JSON.stringify(encryptedMessage);
//   //   }

//   //   // Save to database
//   //   const newMsg = await Message.create({
//   //     sender,
//   //     message: finalMessage,
//   //     type,
//   //     roomCode,
//   //     timestamp: new Date(),
//   //   });

//   //   // Broadcast to all users in the room
//   //   io.to(roomCode).emit("receiveMessage", newMsg);
//   // });

//   socket.on("sendMessage", async (data) => {
//     const { roomCode, message, sender, type } = data;
//     console.log("📩 Received message from client:", { type, message });

//     const room = rooms[roomCode];
//     if (!room || !room.users.includes(socket.id))
//       return socket.emit("error", "You are not a member of this room.");

//     let finalMessage = message;

//     if (type === "text") {
//       const key = getKeyFromCode(roomCode);
//       const encryptedMessage = encrypt(message, key);
//       finalMessage = JSON.stringify(encryptedMessage);
//       console.log("🔐 Encrypted text message:", finalMessage);
//     }

//     const newMsg = await Message.create({
//       sender,
//       message: finalMessage,
//       type,
//       roomCode,
//       timestamp: new Date(),
//     });

//     console.log("💾 Saved message in DB:", {
//       id: newMsg._id,
//       type: newMsg.type,
//       message: newMsg.message,
//     });

//     io.to(roomCode).emit("receiveMessage", newMsg);
//   });

//   // Delete message
//   socket.on("deleteMessage", async (messageId) => {
//     try {
//       await Message.findByIdAndDelete(messageId);
//       io.emit("messageDeleted", messageId);
//     } catch (error) {
//       console.error("Error deleting message:", error);
//     }
//   });

//   // Disconnect
//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//     for (const roomCode in rooms) {
//       const index = rooms[roomCode].users.indexOf(socket.id);
//       if (index !== -1) {
//         rooms[roomCode].users.splice(index, 1);
//         if (rooms[roomCode].users.length === 0) {
//           delete rooms[roomCode];
//         }
//         break;
//       }
//     }
//   });
// });

// server.listen(5000, () => console.log("✅ Server running on port 5000"));

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
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
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
