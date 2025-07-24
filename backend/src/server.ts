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

const games: { [roomCode: string]: { boardData: number[][] } } = {};

io.on("connect", (socket) => {
  console.log(`A new user connected at ${new Date().toString().split(" ")[4]}`);

  socket.on("join", (params, callback) => {
    players.removePlayer(socket.id);
    if (players.getPlayersNames(params.roomCode).length >= 2) return callback("This room already has two players.");
    socket.join(params.roomCode);
    players.addPlayer(socket.id, params.name, params.roomCode);
    if (players.getPlayersNames(params.roomCode).length === 2) {
      games[params.roomCode] = { boardData: Array.from({ length: 7 }, () => Array(6).fill(0)) };
      socket.emit("playerTurn", false);
      io.to(params.roomCode).emit("startGame");
    } else {
      socket.emit("playerTurn", true);
    }
  });

  socket.on("disconnect", () => {
    const player = players.removePlayer(socket.id);
    if (player) {
      delete games[player.roomCode];
      io.to(player.roomCode).emit("opponentDisconnected");
    }
  });

  socket.on("newMove", (params) => {
    const player = players.getPlayer(socket.id);
    if (!player) return;
    const { roomCode } = player;
    const game = games[player.roomCode];
    if (!game) return;
    for (let i = 0; i < game.boardData[params.colIndex].length; i++) {
      if (game.boardData[params.colIndex][i] !== 0) continue;
      game.boardData[params.colIndex][i] = params.first ? 1 : 2;
      break;
    }
    io.to(roomCode).emit("boardUpdated", game.boardData);
  });
});

server.listen(port, () => console.log(`Server started at http://localhost:${port}`));
