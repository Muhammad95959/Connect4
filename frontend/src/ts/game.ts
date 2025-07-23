import { io } from "socket.io-client";

const roomInfoElement = document.querySelector(".room-info") as HTMLDivElement;
const codeElement = document.querySelector(".room-info .code") as HTMLSpanElement;
const boardElement = document.querySelector(".board") as HTMLDivElement;
const boardColumns = document.querySelectorAll('[class*="board-col-"]');
const url = "http://localhost:8000";
let myFirstTurn = 1;
let opponentFirstTurn = 2;
let myTurn = true;

const socket = io(url, {
  transports: ["websocket"],
  withCredentials: true,
  reconnectionAttempts: 5,
});

socket.on("connect", () => {
  let params = new URLSearchParams(window.location.search);
  socket.emit("join", { name: params.get("name"), roomCode: params.get("roomCode") }, (errorMessage: string) => {
    roomInfoElement.innerHTML = `<div class="error">${errorMessage}</div>`;
  });
});

socket.on("playerTurn", (first) => {
  myTurn = first;
  myFirstTurn = first ? 1 : 2;
  opponentFirstTurn = first ? 2 : 1;
});

socket.on("startGame", () => {
  roomInfoElement.style.display = "none";
  boardElement.style.display = "flex";
});

socket.on("playerDisconnected", () => {
  boardElement.style.display = "none";
  roomInfoElement.style.display = "block";
});

socket.on("opponentMove", (params) => {
  const cells = boardColumns[params.colIndex].getElementsByClassName("cell") as HTMLCollectionOf<HTMLDivElement>;
  for (const cell of cells) {
    if (!/player-[12]/.test(cell.className)) {
      cell.classList.add(`player-${opponentFirstTurn}`);
      myTurn = !myTurn;
      break;
    }
  }
});

codeElement.textContent = new URLSearchParams(window.location.search).get("roomCode");
boardColumns.forEach((col, index) => {
  const cells = col.getElementsByClassName("cell") as HTMLCollectionOf<HTMLDivElement>;
  col.addEventListener("click", () => {
    if (myTurn) {
      for (const cell of cells) {
        if (!/player-[12]/.test(cell.className)) {
          cell.classList.add(`player-${myFirstTurn}`);
          socket.emit("play", { colIndex: index, cellClass: `player-${myFirstTurn}` });
          myTurn = !myTurn;
          break;
        }
      }
    }
  });
});
