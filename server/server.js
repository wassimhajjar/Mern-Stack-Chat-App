import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

//Create express app and http server

const app = express();
const server = http.createServer(app);

//Connect to MongoDB
await connectDB();

//Initialize socket.io server
export const io = new Server(server, {
  cors: { origin: "*" },
});

//Store online users
export const userSocketMap = {}; //{userId:socketId}

//Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected", userId);
  if (userId) {
    userSocketMap[userId] = socket.id;
  }
  //console.log("socketMapConnected", userSocketMap);
  //console.log("length", Object.keys(userSocketMap).length);
  //Emit online users to all connected users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    //console.log("socketMapDisconnected", userSocketMap);
    //console.log("length", Object.keys(userSocketMap).length);

    io.emit("getOnlineUsers"), Object.keys(userSocketMap);
  });
});

//Middleware setup
app.use(cors());
app.use(express.json({ limit: "10gb" }));

//Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log("Server is running on PORT ", PORT);
  });
}

//export server for vercel
export default server;
