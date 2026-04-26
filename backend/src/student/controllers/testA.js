const io = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {

  console.log("A connected");

  socket.emit("joinTeam", 1);

  setTimeout(() => {
    socket.emit("sendMessage", {
      teamId: 1,
      senderId: 1,
      message: "Hello from A"
    });
  }, 2000);
});

socket.on("newMessage", (msg) => {
  console.log("A received:", msg);
});