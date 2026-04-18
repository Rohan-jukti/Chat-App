const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let users = {};

io.on("connection", (socket) => {

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

  // ✅ FIXED seen (only sender ko bhejna)
  socket.on("seen", ({ msgId, sender }) => {
    for (let id in users) {
      if (users[id] === sender) {
        io.to(id).emit("seen_update", msgId);
      }
    }
  });

  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("stop_typing", () => {
    socket.broadcast.emit("stop_typing");
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("online_users", Object.values(users));
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log("Server running");
});