import { io } from "socket.io-client";

const params = new URLSearchParams(window.location.search);
const name = params.get("name");
const roomCode = params.get("roomCode");
const roomInfoElement = document.querySelector(".room-info") as HTMLDivElement;
const codeElement = document.querySelector(".room-info .code") as HTMLSpanElement;
const gameContent = document.querySelector(".content") as HTMLDivElement;
const boardElement = document.querySelector(".board") as HTMLDivElement;
const boardColumns = [...(document.getElementsByClassName("board-col") as HTMLCollectionOf<HTMLDivElement>)];
const firstPlayerCardName = document.querySelector(".first-player .name") as HTMLDivElement;
const firstPlayerCardScore = document.querySelector(".first-player .score") as HTMLDivElement;
const secondPlayerCardName = document.querySelector(".second-player .name") as HTMLDivElement;
const secondPlayerCardScore = document.querySelector(".second-player .score") as HTMLDivElement;
const turnCardName = document.querySelector(".turn-card .name span") as HTMLSpanElement;
const turnCardTime = document.querySelector(".turn-card .time span") as HTMLSpanElement;
const winCardName = document.querySelector(".win-card .name") as HTMLDivElement;
const playAgainBtn = document.querySelector(".win-card button") as HTMLButtonElement;
const url = "http://localhost:8000";
let first = true;
let myTurn = true;
let turnTimer: number;

const socket = io(url, {
  transports: ["websocket"],
  withCredentials: true,
  reconnectionAttempts: 5,
});

socket.on("connect", () => {
  socket.emit("join", { name, roomCode }, (errorMessage: string) => {
    roomInfoElement.innerHTML = `<div class="error">${errorMessage}</div>`;
  });
});

socket.on("firstTurn", (frst) => {
  myTurn = frst;
  first = frst;
  frst ? boardElement.classList.add("hoverable") : boardElement.classList.remove("hoverable");
});

socket.on("startGame", (params) => {
  roomInfoElement.classList.add("hidden");
  gameContent.classList.remove("hidden");
  firstPlayerCardName.textContent = params.firstPlayer;
  secondPlayerCardName.textContent = params.secondPlayer;
  turnCardName.textContent = params.firstPlayer;
  turnTimer = setInterval(() => {
    let remainingTime = +(turnCardTime.textContent as string);
    turnCardTime.textContent = String(--remainingTime);
    if (remainingTime === 0) clearInterval(turnTimer);
  }, 1000);
});

// TODO: handle this disaster
socket.on("opponentDisconnected", () => {
  gameContent.classList.add("hidden");
  roomInfoElement.classList.remove("hidden");
  roomInfoElement.innerHTML = `<div class="error">Your opponent has disconnected.<br /><a href="/">Go back to main menu</a></div>`;
  socket.emit("removeRoom", roomCode);
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
  updateTurnCard();
  myTurn = !myTurn;
  myTurn ? boardElement.classList.add("hoverable") : boardElement.classList.remove("hoverable");
});

codeElement.textContent = roomCode;
boardColumns.forEach((col, index) => {
  col.addEventListener("click", () => {
    if (myTurn) socket.emit("newMove", { colIndex: index, first });
  });
});

function updateTurnCard() {
  const firstName = firstPlayerCardName.textContent;
  const secondName = secondPlayerCardName.textContent;
  turnCardName.textContent = turnCardName.textContent === firstName ? secondName : firstName;
  turnCardTime.textContent = "30";
}
