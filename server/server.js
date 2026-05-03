const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// health check route (important for Railway)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const server = http.createServer(app);

// socket setup
const io = new Server(server, {
  cors: {
    origin: "https://chat-app-two-theta-84.vercel.app",
    methods: ["GET", "POST"],
  },
});

let users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // join
  socket.on("join", (username) => {
    users[socket.id] = username;
    io.emit("online_users", Object.values(users));
  });

  // send message
  socket.on("send_message", (data) => {
    io.emit("receive_message", {
      ...data,
      status: "delivered",
    });
  });

  // seen
  socket.on("seen", ({ msgId, sender }) => {
    for (let id in users) {
      if (users[id] === sender) {
        io.to(id).emit("seen_update", msgId);
      }
    }
  });

  // typing
  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("stop_typing", () => {
    socket.broadcast.emit("stop_typing");
  });

  // disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete users[socket.id];
    io.emit("online_users", Object.values(users));
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});