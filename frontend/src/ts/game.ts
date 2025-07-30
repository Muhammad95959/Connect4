import { io, Socket } from "socket.io-client";
import { Notyf } from "notyf";

const params = new URLSearchParams(window.location.search);
const name = (params.get("name") as string) || "Player";
const roomCode = params.get("roomCode") as string;
const roomInfoElement = document.querySelector(".room-info") as HTMLDivElement;
const codeElement = document.querySelector(".room-info .code") as HTMLSpanElement;
const gameContent = document.querySelector(".content") as HTMLDivElement;
const boardElement = document.querySelector(".board") as HTMLDivElement;
const boardColumns = [...(document.getElementsByClassName("board-col") as HTMLCollectionOf<HTMLDivElement>)];
const firstPlayerCardName = document.querySelector(".first-player .name") as HTMLDivElement;
const firstPlayerCardScore = document.querySelector(".first-player .score") as HTMLDivElement;
const secondPlayerCardName = document.querySelector(".second-player .name") as HTMLDivElement;
const secondPlayerCardScore = document.querySelector(".second-player .score") as HTMLDivElement;
const turnCard = document.querySelector(".turn-card") as HTMLDivElement;
const turnCardName = document.querySelector(".turn-card .name span") as HTMLSpanElement;
const turnCardTime = document.querySelector(".turn-card .time span") as HTMLSpanElement;
const winCard = document.querySelector(".win-card") as HTMLDivElement;
const winCardName = document.querySelector(".win-card .name") as HTMLDivElement;
const drawCard = document.querySelector(".draw-card") as HTMLDivElement;
const playAgainBtn = document.querySelector(".win-card button") as HTMLButtonElement;
const newGameRequestPendingCard = document.querySelector(".new-game-request-pending") as HTMLDivElement;
const newGameRequestPendingCancelBtn = document.querySelector(
  ".new-game-request-pending .cancel-btn",
) as HTMLButtonElement;
const newGameRequestCard = document.querySelector(".new-game-request") as HTMLDivElement;
const newGameRequestCardDeclineBtn = document.querySelector(".new-game-request .decline") as HTMLButtonElement;
const newGameRequestCardAcceptBtn = document.querySelector(".new-game-request .accept") as HTMLButtonElement;
const menuBtn = document.querySelector(".top-btns .menu-btn") as HTMLButtonElement;
const url = "http://localhost:8000";
const timerTime = "30";
let socket: Socket;
let opponentName = "player";
let first = true;
let originalFirst = true;
let myTurn = true;
let isMoveInProgress = false;
let columnClickHandlers: (() => void)[] = [];

if (!roomCode) {
  roomInfoElement.innerHTML = `<div class="error">Bad URL!<br /><a href="/">Go back to main menu</a></div>`;
  throw new Error("No room code provided");
}

socket = io(url, {
  transports: ["websocket"],
  withCredentials: true,
  reconnectionAttempts: 5,
});

socket.on("connect", () => {
  socket.emit("join", { name, roomCode }, (errorMessage: string) => {
    roomInfoElement.innerHTML = `<div class="error">${errorMessage}<br /><a href="/">Go back to main menu</a></div>`;
  });
});

socket.on("firstTurn", (frst) => {
  myTurn = frst;
  first = frst;
  originalFirst = frst;
  frst ? boardElement.classList.add("hoverable") : boardElement.classList.remove("hoverable");
});

socket.on("startGame", (params) => {
  const firstPlayer = params.players.find((val: any) => val.first);
  const secondPlayer = params.players.find((val: any) => !val.first);
  opponentName = first ? secondPlayer.name : firstPlayer.name;
  roomInfoElement.classList.add("hidden");
  gameContent.classList.remove("hidden");
  firstPlayerCardName.textContent = firstPlayer.name;
  secondPlayerCardName.textContent = secondPlayer.name;
  turnCardName.textContent = firstPlayer.name;
});

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
  isMoveInProgress = false;
});

socket.on("endGame", (params) => {
  console.log("endGame");
  myTurn = false;
  boardColumns.forEach((col, index) => col.removeEventListener("click", columnClickHandlers[index]));
  columnClickHandlers = [];
  boardElement.classList.remove("hoverable");
  turnCard.classList.add("hidden");
  winCard.classList.remove("hidden");
  if (params.winnerNumber === 1) {
    winCardName.textContent = firstPlayerCardName.textContent;
    firstPlayerCardScore.textContent = String(+(firstPlayerCardScore.textContent as string) + 1);
  } else {
    winCardName.textContent = secondPlayerCardName.textContent;
    secondPlayerCardScore.textContent = String(+(secondPlayerCardScore.textContent as string) + 1);
  }
  for (let vector of params.winningCells) {
    const col = vector[0];
    const row = vector[1];
    [...boardColumns[col].getElementsByClassName("cell")][row].classList.add("winning-cell");
  }
});

socket.on("draw", () => {
  console.log("draw");
  myTurn = false;
  boardColumns.forEach((col, index) => col.removeEventListener("click", columnClickHandlers[index]));
  columnClickHandlers = [];
  boardElement.classList.remove("hoverable");
  turnCard.classList.add("hidden");
  drawCard.classList.remove("hidden");
});

socket.on("timeout", (params) => {
  console.log("timeout");
  const winner = params.winner;
  boardColumns.forEach((col, index) => col.removeEventListener("click", columnClickHandlers[index]));
  columnClickHandlers = [];
  boardElement.classList.remove("hoverable");
  turnCard.classList.add("hidden");
  winCard.classList.remove("hidden");
  winCardName.textContent = winner.name;
  myTurn = false;
  if (winner.first) {
    firstPlayerCardScore.textContent = String(+(firstPlayerCardScore.textContent as string) + 1);
  } else {
    secondPlayerCardScore.textContent = String(+(secondPlayerCardScore.textContent as string) + 1);
  }
});

playAgainBtn.addEventListener("click", () => {
  socket.emit("playAgain", roomCode);
  newGameRequestPendingCard.classList.remove("hidden");
});

newGameRequestPendingCancelBtn.addEventListener("click", () => {
  socket.emit("cancelPlayAgain", roomCode);
});

socket.on("playAgainRequest", () => {
  newGameRequestCard.classList.remove("hidden");
});

newGameRequestCardDeclineBtn.addEventListener("click", () => {
  socket.emit("cancelPlayAgain", roomCode);
});

socket.on("cancelPlayAgain", () => {
  newGameRequestPendingCard.classList.add("hidden");
  newGameRequestCard.classList.add("hidden");
});

newGameRequestCardAcceptBtn.addEventListener("click", () => {
  socket.emit("acceptPlayAgain", roomCode);
});

socket.on("acceptPlayAgain", (params) => {
  const oddGame = params.oddGame;
  first = originalFirst === oddGame;
  myTurn = first;
  first ? boardElement.classList.add("hoverable") : boardElement.classList.remove("hoverable");
  makeTheColumnsClickable();
  newGameRequestPendingCard.classList.add("hidden");
  newGameRequestCard.classList.add("hidden");
  const cells = [...(document.getElementsByClassName("cell") as HTMLCollectionOf<HTMLDivElement>)];
  cells.forEach((cell) => cell.classList.remove("winning-cell", "player-1", "player-2"));
  winCard.classList.add("hidden");
  turnCard.classList.remove("hidden");
  turnCardName.textContent = first ? name : opponentName;
});

socket.on("timerTick", (remainingTime: number) => {
  turnCardTime.textContent = String(remainingTime);
});

codeElement.textContent = roomCode;
turnCardTime.textContent = timerTime;
menuBtn.addEventListener("click", () => new Notyf({ duration: 5000 }).error("Not Implemented Yet."));
makeTheColumnsClickable();

function makeTheColumnsClickable() {
  boardColumns.forEach((col, index) => {
    const handler = handleColumnClick(index);
    columnClickHandlers.push(handler);
    col.addEventListener("click", handler);
  });
}

function updateTurnCard() {
  const firstName = firstPlayerCardName.textContent;
  const secondName = secondPlayerCardName.textContent;
  turnCardName.textContent = turnCardName.textContent === firstName ? secondName : firstName;
  turnCardTime.textContent = timerTime;
}

function handleColumnClick(index: number) {
  return () => {
    const colCells = [...(boardColumns[index].getElementsByClassName("cell") as HTMLCollectionOf<HTMLDivElement>)];
    const colHasEmptyCells = colCells.some((cell) => !/player/.test(cell.className));
    if (myTurn && !isMoveInProgress && colHasEmptyCells) {
      isMoveInProgress = true;
      socket.emit("newMove", { colIndex: index, first: originalFirst });
    }
  };
}
