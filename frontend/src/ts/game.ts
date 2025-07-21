const boardColumns = document.querySelectorAll('[class*="board-col-"]');
let player = 1;

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
  player === 1 ? player = 2 : player = 1;
}
