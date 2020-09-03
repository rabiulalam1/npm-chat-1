// var app = require("express")();
// var http = require("http").Server(app);
// var io = require("socket.io")(http);
// var port = process.env.PORT || 3000;

// app.get("/", function (req, res) {
//   res.sendFile(__dirname + "/index.html");
// });

// io.on("connection", function (socket) {
//   socket.on("chat message", function (msg) {
//     io.emit("chat message", msg);
//   });
// });

// http.listen(port, function () {
//   console.log("listening on *:" + port);
// });

import { join } from "path";
import { createServer } from "http";
import express, { static } from "express";
import socketio from "socket.io";
import formatMessage from "./utils/messages";
import {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} from "./utils/users";

const app = express();
const server = createServer(app);
const io = socketio(server);

// Set static folder
app.use(static(join(__dirname, "public")));

const botName = "ChatCord Bot";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
