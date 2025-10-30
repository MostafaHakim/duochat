// import { useState, useEffect, useRef } from "react";
// import CryptoJS from "crypto-js";

// export default function RoomChatWithDecrypt({ socket, setUser }) {
//   const [roomCode, setRoomCode] = useState("");
//   const [joined, setJoined] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [decryptInput, setDecryptInput] = useState("");
//   const messagesEndRef = useRef(null);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   useEffect(() => {
//     socket.on("error", (msg) => alert(msg));
//     socket.on("room-created", ({ roomCode }) => {
//       alert(`Room ${roomCode} created`);
//       setJoined(true);
//     });
//     socket.on("room-joined", ({ roomCode }) => {
//       alert(`Joined room ${roomCode}`);
//       setJoined(true);
//     });
//     socket.on("message-history", (msgs) => setMessages(msgs));
//     socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));

//     return () => {
//       socket.off("error");
//       socket.off("room-created");
//       socket.off("room-joined");
//       socket.off("message-history");
//       socket.off("receiveMessage");
//     };
//   }, [socket]);

//   const decryptMessage = (encryptedObj, key) => {
//     try {
//       const { encryptedData, iv } = JSON.parse(encryptedObj);
//       const bytes = CryptoJS.AES.decrypt(
//         encryptedData,
//         CryptoJS.enc.Utf8.parse(key),
//         { iv: CryptoJS.enc.Hex.parse(iv) }
//       );
//       const text = bytes.toString(CryptoJS.enc.Utf8);
//       return text || "[Cannot decrypt]";
//     } catch {
//       return "[Cannot decrypt]";
//     }
//   };

//   const handleCreateRoom = () => {
//     if (!roomCode.trim()) return alert("Enter room code");
//     setUser("user1");
//     socket.emit("create-room", roomCode.trim());
//   };

//   const handleJoinRoom = () => {
//     if (!roomCode.trim()) return alert("Enter room code");
//     setUser("user2");
//     socket.emit("join-room", roomCode.trim());
//   };

//   const handleSendMessage = () => {
//     if (!newMessage.trim()) return;
//     socket.emit("sendMessage", {
//       roomCode,
//       message: newMessage,
//       sender: "Me",
//       type: "text",
//     });
//     setNewMessage("");
//   };

//   const canDecrypt = decryptInput === roomCode;

//   return (
//     <div className="max-w-lg mx-auto mt-10 p-6 bg-gradient-to-tr from-purple-50 via-pink-50 to-yellow-50 shadow-2xl rounded-2xl border border-purple-200">
//       <h2 className="text-3xl font-bold text-center text-purple-700 mb-6">
//         🌈 Colorful Secure Chat
//       </h2>

//       {/* Room join/create */}
//       {!joined && (
//         <div className="space-y-4 mb-6">
//           <input
//             type="text"
//             placeholder="Enter Room Code"
//             value={roomCode}
//             onChange={(e) => setRoomCode(e.target.value)}
//             className="w-full px-4 py-3 border-2 border-pink-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-pink-200 shadow-md placeholder-pink-400"
//           />
//           <div className="flex gap-4">
//             <button
//               onClick={handleCreateRoom}
//               className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl hover:scale-105 transform transition"
//             >
//               Create Room
//             </button>
//             <button
//               onClick={handleJoinRoom}
//               className="flex-1 bg-gradient-to-r from-green-400 to-teal-400 text-white py-3 rounded-xl hover:scale-105 transform transition"
//             >
//               Join Room
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Decrypt code input */}
//       {joined && (
//         <div className="mb-4">
//           <input
//             type="text"
//             placeholder="Enter Room Code to decrypt messages"
//             value={decryptInput}
//             onChange={(e) => setDecryptInput(e.target.value)}
//             className="w-full px-4 py-2 border-2 border-yellow-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-200 shadow-md placeholder-yellow-400"
//           />
//         </div>
//       )}

//       {/* Messages */}
//       {joined && (
//         <div className="flex flex-col h-[400px] border-2 border-pink-200 rounded-2xl p-4 bg-white overflow-y-auto space-y-3 shadow-inner">
//           {messages.length === 0 ? (
//             <p className="text-gray-400 text-center mt-20">No messages yet</p>
//           ) : (
//             messages.map((msg) => (
//               <div
//                 key={msg._id}
//                 className={`max-w-[75%] px-4 py-3 rounded-2xl break-words cursor-pointer shadow-md transition-transform transform hover:scale-105 ${
//                   msg.sender === "Me"
//                     ? "bg-gradient-to-r from-purple-200 to-purple-400 self-end text-purple-900"
//                     : "bg-gradient-to-r from-yellow-200 to-yellow-400 self-start text-yellow-900"
//                 }`}
//                 onClick={() => {
//                   if (canDecrypt) {
//                     alert(
//                       `Decrypted: ${decryptMessage(msg.message, roomCode)}`
//                     );
//                   } else {
//                     alert("Wrong code! Enter correct room code to decrypt.");
//                   }
//                 }}
//               >
//                 <span className="text-xs font-semibold mb-1 block opacity-70">
//                   {msg.sender}
//                 </span>
//                 <span className="text-base font-medium">
//                   [Encrypted message - click to decrypt]
//                 </span>
//               </div>
//             ))
//           )}
//           <div ref={messagesEndRef} />
//         </div>
//       )}

//       {/* Send message */}
//       {joined && (
//         <div className="mt-4 flex gap-2">
//           <input
//             type="text"
//             value={newMessage}
//             onChange={(e) => setNewMessage(e.target.value)}
//             placeholder="Type a message..."
//             className="flex-1 px-4 py-2 border-2 border-purple-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 shadow-md placeholder-purple-400"
//           />
//           <button
//             onClick={handleSendMessage}
//             className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-2xl hover:scale-105 transform transition"
//           >
//             Send
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect, useRef } from "react";
import CryptoJS from "crypto-js";

export default function Room({ socket, setUser }) {
  const [roomCode, setRoomCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [decryptInput, setDecryptInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socket.on("error", (msg) => alert(msg));
    socket.on("room-created", ({ roomCode }) => {
      alert(`Room ${roomCode} created`);
      setJoined(true);
    });
    socket.on("room-joined", ({ roomCode }) => {
      alert(`Joined room ${roomCode}`);
      setJoined(true);
    });
    socket.on("message-history", (msgs) => setMessages(msgs));
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.off("error");
      socket.off("room-created");
      socket.off("room-joined");
      socket.off("message-history");
      socket.off("receiveMessage");
    };
  }, [socket]);

  const decryptMessage = (encryptedObj, key) => {
    try {
      const { encryptedData, iv } = JSON.parse(encryptedObj);
      const bytes = CryptoJS.AES.decrypt(
        encryptedData,
        CryptoJS.enc.Utf8.parse(key),
        { iv: CryptoJS.enc.Hex.parse(iv) }
      );
      const text = bytes.toString(CryptoJS.enc.Utf8);
      return text || "[Cannot decrypt]";
    } catch {
      return "[Cannot decrypt]";
    }
  };

  const handleCreateRoom = () => {
    if (!roomCode.trim()) return alert("Enter room code");
    setUser("user1");
    socket.emit("create-room", roomCode.trim());
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return alert("Enter room code");
    setUser("user2");
    socket.emit("join-room", roomCode.trim());
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    socket.emit("sendMessage", {
      roomCode,
      message: newMessage,
      sender: "Me",
      type: "text",
    });
    setNewMessage("");
  };

  const canDecrypt = decryptInput === roomCode;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-gradient-to-tr from-purple-50 via-pink-50 to-yellow-50 shadow-2xl rounded-2xl border border-purple-200">
      <h2 className="text-3xl font-bold text-center text-purple-700 mb-6">
        🌈 Colorful Secure Chat
      </h2>

      {/* Room join/create */}
      {!joined && (
        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="w-full px-4 py-3 border-2 border-pink-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-pink-200 shadow-md placeholder-pink-400"
          />
          <div className="flex gap-4">
            <button
              onClick={handleCreateRoom}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl hover:scale-105 transform transition"
            >
              Create Room
            </button>
            <button
              onClick={handleJoinRoom}
              className="flex-1 bg-gradient-to-r from-green-400 to-teal-400 text-white py-3 rounded-xl hover:scale-105 transform transition"
            >
              Join Room
            </button>
          </div>
        </div>
      )}

      {/* Decrypt code input */}
      {joined && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter Room Code to decrypt messages"
            value={decryptInput}
            onChange={(e) => setDecryptInput(e.target.value)}
            className="w-full px-4 py-2 border-2 border-yellow-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-200 shadow-md placeholder-yellow-400"
          />
        </div>
      )}

      {/* Messages */}
      {joined && (
        <div className="flex flex-col h-[400px] border-2 border-pink-200 rounded-2xl p-4 bg-white overflow-y-auto space-y-3 shadow-inner">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center mt-20">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`max-w-[75%] px-4 py-3 rounded-2xl break-words cursor-pointer shadow-md transition-transform transform hover:scale-105 ${
                  msg.sender === "Me"
                    ? "bg-gradient-to-r from-purple-200 to-purple-400 self-end text-purple-900"
                    : "bg-gradient-to-r from-yellow-200 to-yellow-400 self-start text-yellow-900"
                }`}
                onClick={() => {
                  if (canDecrypt) {
                    alert(
                      `Decrypted: ${decryptMessage(msg.message, roomCode)}`
                    );
                  } else {
                    alert("Wrong code! Enter correct room code to decrypt.");
                  }
                }}
              >
                <span className="text-xs font-semibold mb-1 block opacity-70">
                  {msg.sender}
                </span>
                <span className="text-base font-medium">
                  [Encrypted message - click to decrypt]
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Send message */}
      {joined && (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border-2 border-purple-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 shadow-md placeholder-purple-400"
          />
          <button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-2xl hover:scale-105 transform transition"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
