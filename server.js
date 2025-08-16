import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  /* in prod, terminate TLS upstream */
});

app.use(express.static("public")); // serves index.html

io.on("connection", (socket) => {
  socket.on("join", (room) => socket.join(room));

  
  socket.on("chat:ciphertext", ({ room, from, payload }) => {
    io.to(room).emit("chat:ciphertext", { from, payload });
  });
});

server.listen(3000, () => console.log("listening on http://localhost:3000"));
