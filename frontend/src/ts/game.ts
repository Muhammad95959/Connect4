import { io, Socket } from "socket.io-client";

const params = new URLSearchParams(window.location.search);
const name = params.get("name") as string;
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
const playAgainBtn = document.querySelector(".win-card button") as HTMLButtonElement;
const url = "http://localhost:8000";
let socket: Socket;
let turnTimer: number;
let first = true;
let myTurn = true;
const columnClickHandlers: (() => void)[] = [];

if (!name || !roomCode) {
  roomInfoElement.innerHTML = `<div class="error">Bad URL!<br /><a href="/">Go back to main menu</a></div>`;
} else {
  socket = io(url, {
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
    const firstPlayer = params.players.filter((val: any) => val.first)[0];
    const secondPlayer = params.players.filter((val: any) => !val.first)[0];
    roomInfoElement.classList.add("hidden");
    gameContent.classList.remove("hidden");
    firstPlayerCardName.textContent = firstPlayer.name;
    secondPlayerCardName.textContent = secondPlayer.name;
    turnCardName.textContent = firstPlayer.name;
    turnTimer = setInterval(() => {
      let remainingTime = +(turnCardTime.textContent as string);
      turnCardTime.textContent = String(--remainingTime);
      if (remainingTime <= 0) {
        clearInterval(turnTimer);
        turnCardTime.textContent = "0";
      }
    }, 1000);
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
  });

  socket.on("endGame", (params) => {
    myTurn = false;
    boardColumns.forEach((col, index) => col.removeEventListener("click", columnClickHandlers[index]));
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

  socket.on("timeout", (params) => {
    const winner = params.winner;
    boardColumns.forEach((col, index) => col.removeEventListener("click", columnClickHandlers[index]));
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
}

codeElement.textContent = roomCode;
boardColumns.forEach((col, index) => {
  const handler = handleColumnClick(index);
  columnClickHandlers.push(handler);
  col.addEventListener("click", handler);
});

function updateTurnCard() {
  const firstName = firstPlayerCardName.textContent;
  const secondName = secondPlayerCardName.textContent;
  turnCardName.textContent = turnCardName.textContent === firstName ? secondName : firstName;
  turnCardTime.textContent = "30";
}

function handleColumnClick(index: number) {
  return () => {
    if (myTurn) socket.emit("newMove", { colIndex: index, first });
  };
}
