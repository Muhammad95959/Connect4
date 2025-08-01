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
const timerTime = 30000;

app.use(cors());

app.get("/check-room/:roomCode", (req, res) => {
  const roomCode = req.params.roomCode;
  const playersInRoom = players.getPlayers(roomCode).length;
  res.json({ isAvailable: playersInRoom < 2, isCreated: playersInRoom === 1 });
});

const games: { [roomCode: string]: { boardData: number[][] } } = {};
const oddGame: { [roomCode: string]: boolean } = {};
const timers: { [roomCode: string]: NodeJS.Timeout } = {};

io.on("connect", (socket) => {
  console.log(`A new user connected at ${new Date().toString().split(" ")[4]}`);

  socket.on("join", (params, callback) => {
    players.removePlayer(socket.id);
    let playersInRoom = players.getPlayers(params.roomCode).length;
    if (playersInRoom >= 2) return callback("This room already has two players.");
    socket.join(params.roomCode);
    const first = playersInRoom === 0 ? true : false;
    players.addPlayer(socket.id, params.name, params.roomCode, first);
    if (players.getPlayers(params.roomCode).length === 2) {
      oddGame[params.roomCode] = true;
      socket.emit("firstTurn", false);
      games[params.roomCode] = { boardData: Array.from({ length: 7 }, () => Array(6).fill(0)) };
      io.to(params.roomCode).emit("startGame", { players: players.getPlayers(params.roomCode) });
      startTimer(params.roomCode, false);
    } else {
      socket.emit("firstTurn", true);
    }
  });

  socket.on("disconnect", () => {
    const player = players.removePlayer(socket.id);
    if (player) {
      delete games[player.roomCode];
      io.to(player.roomCode).emit("opponentDisconnected");
      clearInterval(timers[player.roomCode]);
    }
  });

  socket.on("newMove", (params) => {
    const player = players.getPlayer(socket.id);
    if (!player) return;
    const { roomCode } = player;
    const game = games[player.roomCode];
    if (!game) return;
    let row = 0;
    for (let i = 0; i < game.boardData[params.colIndex].length; i++) {
      if (game.boardData[params.colIndex][i] !== 0) continue;
      game.boardData[params.colIndex][i] = params.first ? 1 : 2;
      row = i;
      break;
    }
    io.to(roomCode).emit("boardUpdated", { boardData: game.boardData, lastCell: { col: params.colIndex, row } });
    clearInterval(timers[roomCode]);
    startTimer(roomCode, player.first);
    checkForWin(game.boardData, params.first ? 1 : 2, roomCode);
  });

  socket.on("removeRoom", (roomCode) => {
    io.in(roomCode).disconnectSockets();
  });

  socket.on("playAgain", (roomCode) => {
    socket.broadcast.to(roomCode).emit("playAgainRequest");
  });

  socket.on("cancelPlayAgain", (roomCode) => {
    io.to(roomCode).emit("cancelPlayAgain");
  });

  socket.on("acceptPlayAgain", (roomCode) => {
    oddGame[roomCode] = !oddGame[roomCode];
    games[roomCode] = { boardData: Array.from({ length: 7 }, () => Array(6).fill(0)) };
    io.to(roomCode).emit("acceptPlayAgain", { oddGame: oddGame[roomCode] });
    startTimer(roomCode, !oddGame[roomCode]);
  });
});

server.listen(port, () => console.log(`Server started at http://localhost:${port}`));

function startTimer(roomCode: string, winnerFirst: boolean) {
  let remainingTime = timerTime / 1000;
  io.to(roomCode).emit("timerTick", remainingTime);
  timers[roomCode] = setInterval(() => {
    remainingTime--;
    io.to(roomCode).emit("timerTick", remainingTime);
    if (remainingTime === 0) {
      const winner = players.getPlayers(roomCode).find((p) => p.first === winnerFirst);
      io.to(roomCode).emit("timeout", { winner, players: players.getPlayers(roomCode) });
      clearInterval(timers[roomCode]);
    }
  }, 1000);
}

function checkForWin(boardData: number[][], playerNumber: number, roomCode: string) {
  let winningCells: number[][] = [];
  // check vertical
  for (let i = 0; i < boardData.length; i++) {
    let count = 0;
    for (let j = 0; j < boardData[i].length; j++) {
      if (boardData[i][j] === playerNumber) {
        count++;
        winningCells.push([i, j]);
      } else {
        count = 0;
        winningCells = [];
      }
      if (count === 4) {
        clearInterval(timers[roomCode]);
        return io
          .to(roomCode)
          .emit("endGame", { winnerNumber: playerNumber, players: players.getPlayers(roomCode), winningCells });
      }
    }
  }
  // check horizontal
  for (let i = 0; i < boardData[0].length; i++) {
    let count = 0;
    for (let j = 0; j < boardData.length; j++) {
      if (boardData[j][i] === playerNumber) {
        count++;
        winningCells.push([j, i]);
      } else {
        count = 0;
        winningCells = [];
      }
      if (count === 4) {
        clearInterval(timers[roomCode]);
        return io
          .to(roomCode)
          .emit("endGame", { winnerNumber: playerNumber, players: players.getPlayers(roomCode), winningCells });
      }
    }
  }
  // check diagonal (ltr)
  for (let i = 0; i <= boardData.length - 4; i++) {
    for (let j = 0; j <= boardData[0].length - 4; j++) {
      let count = 0;
      let row = i;
      let col = j;
      while (row < boardData.length && col < boardData[0].length) {
        if (boardData[row][col] === playerNumber) {
          count++;
          winningCells.push([row, col]);
        } else {
          count = 0;
          winningCells = [];
        }
        if (count === 4) {
          clearInterval(timers[roomCode]);
          return io
            .to(roomCode)
            .emit("endGame", { winnerNumber: playerNumber, players: players.getPlayers(roomCode), winningCells });
        }
        row++;
        col++;
      }
    }
  }
  // check diagonal (rtl)
  for (let i = boardData.length - 1; i >= 3; i--) {
    for (let j = 0; j <= boardData[0].length - 4; j++) {
      let count = 0;
      let row = i;
      let col = j;
      while (row >= 0 && col < boardData[0].length) {
        if (boardData[row][col] === playerNumber) {
          count++;
          winningCells.push([row, col]);
        } else {
          count = 0;
          winningCells = [];
        }
        if (count === 4) {
          clearInterval(timers[roomCode]);
          return io
            .to(roomCode)
            .emit("endGame", { winnerNumber: playerNumber, players: players.getPlayers(roomCode), winningCells });
        }
        row--;
        col++;
      }
    }
  }
  // check draw
  for (let i = 0; i < boardData.length; i++) {
    for (let j = 0; j < boardData[0].length; j++) {
      if (boardData[i][j] === 0) return;
    }
    if (i === boardData.length - 1) {
      clearInterval(timers[roomCode]);
      io.to(roomCode).emit("draw");
    }
  }
}
