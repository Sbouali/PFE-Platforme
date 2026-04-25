const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {

 console.log("Connected:", socket.id);

 socket.emit("joinTeam", 1);

 socket.emit("sendMessage", {
   teamId: 1,
   senderId: 2,
   message: "Hello from test script"
 });

});
socket.emit("typing",{
 teamId:1,
 userName:"Nour"
});

socket.on("newMessage", (data) => {
 console.log("New message received:", data);
});