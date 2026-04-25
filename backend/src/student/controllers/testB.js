const io = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {

  console.log("B connected");

  socket.emit("joinTeam", 1);

  setTimeout(() => {
    socket.emit("sendMessage", {
      teamId: 1,
      senderId: 2,
      message: "Hello from B"
    });
  }, 4000);
});

socket.on("newMessage", (msg) => {
  console.log("B received:", msg);
});