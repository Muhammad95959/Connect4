import { io } from "socket.io-client";

const roomInfoElement = document.querySelector(".room-info") as HTMLDivElement;
const codeElement = document.querySelector(".room-info .code") as HTMLSpanElement;
const boardElement = document.querySelector(".board") as HTMLDivElement;
const boardColumns = document.querySelectorAll('[class*="board-col-"]');
const url = "http://localhost:8000";
let player = 1;

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

socket.on("startGame", () => {
  roomInfoElement.style.display = "none";
  boardElement.style.display = "flex";
});

socket.on("playerDisconnected", () => {
  boardElement.style.display = "none";
  roomInfoElement.style.display = "block";
});

codeElement.textContent = new URLSearchParams(window.location.search).get("roomCode");
boardColumns.forEach((col) => {
  const cells = col.getElementsByClassName("cell") as HTMLCollectionOf<HTMLDivElement>;
  col.addEventListener("click", () => {
    for (const cell of cells) {
      if (!/player-[12]/.test(cell.className)) {
        cell.classList.add(`player-${player}`);
        nextPlayer();
        break;
      }
    }
  });
});

function nextPlayer() {
  player === 1 ? (player = 2) : (player = 1);
}
