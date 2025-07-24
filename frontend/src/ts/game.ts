import { io } from "socket.io-client";

const roomInfoElement = document.querySelector(".room-info") as HTMLDivElement;
const codeElement = document.querySelector(".room-info .code") as HTMLSpanElement;
const boardElement = document.querySelector(".board") as HTMLDivElement;
const boardColumns = [...(document.getElementsByClassName("board-col") as HTMLCollectionOf<HTMLDivElement>)];
const url = "http://localhost:8000";
let first = true;
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

socket.on("playerTurn", (frst) => {
  myTurn = frst;
  first = frst;
});

socket.on("startGame", () => {
  roomInfoElement.style.display = "none";
  boardElement.style.display = "flex";
});

socket.on("opponentDisconnected", () => {
  boardElement.style.display = "none";
  roomInfoElement.style.display = "block";
  roomInfoElement.innerHTML = `<div class="error">Your opponent has disconnected. <a href="/">Go back to main menu</a></div>`;
});

socket.on("boardUpdated", (boardData: number[][]) => {
  boardColumns.forEach((col, index) => {
    const cells = col.getElementsByClassName("cell") as HTMLCollectionOf<HTMLDivElement>;
    for (let i = 0; i < boardData[index].length; i++) {
      const val = boardData[index][i];
      cells[i].classList.remove("player-1", "player-2");
      if (val !== 0) {
        cells[i].classList.add(`player-${val}`);
      }
    }
  });
  myTurn = !myTurn;
});

codeElement.textContent = new URLSearchParams(window.location.search).get("roomCode");
boardColumns.forEach((col, index) => {
  col.addEventListener("click", () => {
    if (myTurn) socket.emit("newMove", { colIndex: index, first });
  });
});
