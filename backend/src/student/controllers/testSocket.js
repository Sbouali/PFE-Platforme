const io = require("socket.io-client");

const socket = io("http://localhost:3000"); // your server port

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // join team 1
  socket.emit("joinTeam", 1);

  // send message
  socket.emit("sendMessage", {
    teamId: 1,
    senderId: 2,
    message: "Hello from test client"
  });

  // typing
  socket.emit("typing", {
    teamId: 1,
    userName: "yakine"
  });

  setTimeout(() => {
    socket.emit("stopTyping", 1);
  }, 2000);
});

socket.on("newMessage", (data) => {
  console.log("NEW MESSAGE:", data);
});

socket.on("userTyping", (name) => {
  console.log(name, "is typing...");
});

socket.on("stopTyping", () => {
  console.log("stop typing");
});

socket.on("messageSeen", (data) => {
  console.log("Seen:", data);
});