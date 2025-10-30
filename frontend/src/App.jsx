// import { useState, useEffect } from "react";
// import io from "socket.io-client";
// import ChatBox from "./components/ChatBox";
// import Room from "./components/Room";

// const socket = io("http://localhost:5000");

// function App() {
//   const [room, setRoom] = useState(
//     () => sessionStorage.getItem("room") || null
//   );
//   const [user, setUser] = useState(
//     () => sessionStorage.getItem("user") || null
//   );

//   useEffect(() => {
//     const handleRoomJoined = (data) => {
//       console.log("Room joined:", data.roomCode);
//       setRoom(data.roomCode);
//       sessionStorage.setItem("room", data.roomCode);
//     };

//     const handleRoomCreated = (data) => {
//       console.log("Room created:", data.roomCode);
//       setRoom(data.roomCode);
//       sessionStorage.setItem("room", data.roomCode);
//     };

//     const handleError = (errorMessage) => {
//       alert(errorMessage);
//       setRoom(null);
//       setUser(null);
//       sessionStorage.removeItem("room");
//       sessionStorage.removeItem("user");
//     };

//     socket.on("room-joined", handleRoomJoined);
//     socket.on("room-created", handleRoomCreated);
//     socket.on("error", handleError);

//     // Re-join room if session exists
//     if (room && user) {
//       socket.emit("join-room", room);
//     }

//     return () => {
//       socket.off("room-joined", handleRoomJoined);
//       socket.off("room-created", handleRoomCreated);
//       socket.off("error", handleError);
//     };
//   }, [room, user]);

//   const handleSetUser = (newUser) => {
//     setUser(newUser);
//     sessionStorage.setItem("user", newUser);
//   };

//   return (
//     <div className="flex justify-center items-center h-screen bg-gray-100 w-full">
//       {!room ? (
//         <Room socket={socket} setUser={handleSetUser} />
//       ) : (
//         <ChatBox socket={socket} room={room} user={user} />
//       )}
//     </div>
//   );
// }

// export default App;

import { useState, useEffect } from "react";
import io from "socket.io-client";
import ChatBox from "./components/ChatBox";
import Room from "./components/Room";

const socket = io("http://localhost:5000");

function App() {
  const [room, setRoom] = useState(
    () => sessionStorage.getItem("room") || null
  );
  const [user, setUser] = useState(
    () => sessionStorage.getItem("user") || null
  );

  useEffect(() => {
    const handleRoomJoined = (data) => {
      console.log("Room joined:", data.roomCode);
      setRoom(data.roomCode);
      sessionStorage.setItem("room", data.roomCode);
    };

    const handleRoomCreated = (data) => {
      console.log("Room created:", data.roomCode);
      setRoom(data.roomCode);
      sessionStorage.setItem("room", data.roomCode);
    };

    const handleError = (errorMessage) => {
      alert(errorMessage);
      setRoom(null);
      setUser(null);
      sessionStorage.removeItem("room");
      sessionStorage.removeItem("user");
    };

    // নতুন ইভেন্ট হ্যান্ডলার যোগ করুন
    const handleRoomLeft = (data) => {
      console.log("Room left:", data.roomCode);
      setRoom(null);
      setUser(null);
      sessionStorage.removeItem("room");
      sessionStorage.removeItem("user");
    };

    socket.on("room-joined", handleRoomJoined);
    socket.on("room-created", handleRoomCreated);
    socket.on("error", handleError);
    socket.on("room-left", handleRoomLeft); // নতুন লাইন

    // Re-join room if session exists
    if (room && user) {
      socket.emit("join-room", room);
    }

    return () => {
      socket.off("room-joined", handleRoomJoined);
      socket.off("room-created", handleRoomCreated);
      socket.off("error", handleError);
      socket.off("room-left", handleRoomLeft); // নতুন লাইন
    };
  }, [room, user]);

  const handleSetUser = (newUser) => {
    setUser(newUser);
    sessionStorage.setItem("user", newUser);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 w-full">
      {!room ? (
        <Room socket={socket} setUser={handleSetUser} />
      ) : (
        <ChatBox socket={socket} room={room} user={user} setUser={setUser} />
      )}
    </div>
  );
}

export default App;
