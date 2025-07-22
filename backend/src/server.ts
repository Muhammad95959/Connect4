import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import Players from "./utils/players";

const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);
const players = new Players();

app.use(cors());

app.get("/check-room/:roomCode", (req, res) => {
  const roomCode = req.params.roomCode;
  const playersInRoom = players.getPlayersNames(roomCode).length;
  res.json({ isAvailable: playersInRoom < 2, isCreated: playersInRoom === 1 });
});

io.on("connect", (socket) => {
  console.log(`A new user connected at ${new Date().toString().split(" ")[4]}`);

  socket.on("join", (params, callback) => {
    players.removePlayer(socket.id);
    if (players.getPlayersNames(params.roomCode).length >= 2) return callback("This room already has two players.");
    socket.join(params.roomCode);
    players.addPlayer(socket.id, params.name, params.roomCode);
    if (players.getPlayersNames(params.roomCode).length === 2) io.to(params.roomCode).emit("startGame");
  });

  socket.on("disconnect", () => {
    const player = players.removePlayer(socket.id);
    if (player) io.to(player.roomCode).emit("playerDisconnected");
  });
});

server.listen(port, () => console.log(`Server started at http://localhost:${port}`));
