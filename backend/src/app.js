const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const http = require("http");

const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);


//Routes 

const importUsersRoute = require("./dashboard/Routes/importUsers");
const auth =require('./User/Routes/authentication/auth')
const chatRoutes =require('./User/Routes/chat')
const teamRoutes = require("./student/Routes/teamRoutes");
const getRoutes = require("./student/Routes/getRoutes");
const getUsersRoute = require("./dashboard/Routes/getUsers");
const topicAdminRoutes = require("./dashboard/Routes/topicAdminRoutes");
const teacherTopicRoutes = require("./teacher/Routes/topicRoutes");
const groupSoutenanceRoutes = require("./dashboard/Routes/groupeSoutenanceRoutes");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/dashboard", importUsersRoute);
app.use("/dashboard", getUsersRoute);
app.use("/auth",auth);
app.use("/chat", chatRoutes);
app.use("/team",teamRoutes);
app.use("/student",getRoutes);
app.use("/teacher",teacherTopicRoutes);
app.use("/dashboard/topic", topicAdminRoutes);
app.use("/dashboard/group_soutenance", groupSoutenanceRoutes);

const io = new Server(server,{
 cors:{origin:"*"}
});
require("./config/chatSocket")(io);


const PORT = 5000;

server.listen(5000,()=>{
  console.log(`Server running on port ${PORT}`);
});