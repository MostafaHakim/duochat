import { useEffect, useState, useRef } from "react";
import axios from "axios";

// Helper: hex string → Uint8Array
const hexToU8A = (hex) =>
  new Uint8Array(hex.match(/.{1,2}/g).map((b) => parseInt(b, 16)));

// Decrypt function
const decryptMessage = async (encryptedObj, roomCode) => {
  try {
    const { encryptedData, iv } = JSON.parse(encryptedObj);

    const keyData = new TextEncoder().encode(roomCode);
    const hashedKey = await window.crypto.subtle.digest("SHA-256", keyData);

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      hashedKey,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-CBC", iv: hexToU8A(iv) },
      cryptoKey,
      hexToU8A(encryptedData)
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed:", e);
    return "[Decryption Failed]";
  }
};

export default function MobileColorfulChat({ socket, user, room, setUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [decryptCode, setDecryptCode] = useState("");
  const [decryptedMessages, setDecryptedMessages] = useState({});
  const [previewMedia, setPreviewMedia] = useState(null);
  const [sending, setSending] = useState(false);

  const messageEndRef = useRef(null);

  // Socket listeners
  useEffect(() => {
    socket.on("message-history", (history) => setMessages(history));
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("messageDeleted", (id) =>
      setMessages((prev) => prev.filter((m) => m._id !== id))
    );

    return () => {
      socket.off("message-history");
      socket.off("receiveMessage");
      socket.off("messageDeleted");
    };
  }, [socket]);

  // Scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!text.trim() && !file) return;
    setSending(true);

    let messageData = {
      sender: user,
      message: text,
      type: "text",
      roomCode: room,
    };

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/upload`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        messageData = {
          ...messageData,
          message: res.data.fileUrl,
          type: file.type.startsWith("video") ? "video" : "image",
        };
        setFile(null);
      } catch (err) {
        console.error("File upload error:", err);
        setSending(false);
        return;
      }
    }

    socket.emit("sendMessage", messageData);
    setText("");
    setSending(false);
  };

  // Decrypt message
  const handleDecrypt = async (msg) => {
    if (decryptCode !== room) {
      alert("Wrong room code! Enter correct code to decrypt.");
      return;
    }
    const decrypted = await decryptMessage(msg.message, decryptCode);
    setDecryptedMessages((prev) => ({ ...prev, [msg._id]: decrypted }));
  };

  // Delete message
  const handleDelete = (id) => {
    if (window.confirm("Delete this message?")) {
      socket.emit("deleteMessage", id);
    }
  };

  // Leave room
  const handleLeaveRoom = () => {
    if (window.confirm("Leave this room?")) {
      socket.emit("leaveRoom", room);
      setUser(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-2">
      {/* Mobile Frame */}
      <div className="w-full max-w-sm h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex justify-between items-center rounded-t-3xl">
          <div className="flex flex-col overflow-hidden">
            <h1 className="text-white font-bold text-lg truncate">
              Room: {`202556${room}15226`}
            </h1>
            <span className="text-white text-xs opacity-80 truncate">
              User: {user}
            </span>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="ml-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg transition-all text-sm"
          >
            Leave
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-t from-purple-50 to-pink-50">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-20 text-sm">
              No messages yet
            </p>
          )}
          {messages.map((m) => {
            const isOwn = m.sender === user;
            const decrypted = decryptedMessages[m._id];
            const canShowMedia = decryptCode === room;

            return (
              <div
                key={m._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[80%] p-3 rounded-2xl text-sm break-words shadow-lg transition-all duration-200
                    ${
                      isOwn
                        ? "bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-br-none"
                        : "bg-gradient-to-r from-green-400 to-green-600 text-white rounded-bl-none"
                    }`}
                  onClick={() => m.type === "text" && handleDecrypt(m)}
                >
                  {m.type === "image" && canShowMedia ? (
                    <img
                      src={m.message}
                      alt="sent"
                      className="rounded-xl max-w-full cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewMedia({ type: "image", src: m.message });
                      }}
                    />
                  ) : m.type === "video" && canShowMedia ? (
                    <video
                      src={m.message}
                      controls
                      className="rounded-xl max-w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : m.type === "text" && decrypted ? (
                    <p className="whitespace-pre-wrap">{decrypted}</p>
                  ) : (
                    <p className="italic text-yellow-100 text-sm">
                      [Encrypted - click to decrypt]
                    </p>
                  )}

                  {/* Time & Delete */}
                  <div className="flex justify-between items-center mt-1 text-xs opacity-80">
                    <span>
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isOwn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(m._id);
                        }}
                        className="ml-2 text-red-300 hover:text-red-500 transition"
                        title="Delete message"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messageEndRef} />
        </div>

        {/* Decrypt Input */}
        <div className="p-3 border-t bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder="Demo"
            value={decryptCode}
            onChange={(e) => setDecryptCode(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
          />
        </div>

        {/* Send Input */}
        <div className="p-3 border-t bg-white flex items-center gap-2 rounded-b-3xl shadow-inner">
          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-3 rounded-full transition shadow">
            📎
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>
          <input
            type="text"
            placeholder="Type a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={sending}
            className={`bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-xl font-semibold shadow-lg transition text-sm ${
              sending ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {/* Fullscreen Media Preview */}
      {previewMedia && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewMedia(null)}
        >
          {previewMedia.type === "image" ? (
            <img
              src={previewMedia.src}
              alt="preview"
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-lg"
            />
          ) : (
            <video
              src={previewMedia.src}
              controls
              autoPlay
              className="max-h-[90vh] max-w-[90vw] rounded-xl"
            />
          )}
          <button
            onClick={() => setPreviewMedia(null)}
            className="absolute top-4 right-4 bg-white text-black w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
