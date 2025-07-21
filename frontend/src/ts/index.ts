const menu = document.querySelector(".menu") as HTMLDivElement;
const createGameBtn = document.querySelector(".create-btn") as HTMLButtonElement;
const joinGameBtn = document.querySelector(".join-btn") as HTMLButtonElement;

createGameBtn.addEventListener("click", () => showStartGameForm(true));
joinGameBtn.addEventListener("click", () => showStartGameForm(false));

function showStartGameForm(newGame: Boolean) {
  menu.style.visibility = "hidden";
  const form = document.createElement("form");
  document.body.appendChild(form);
  form.action = "game.html";
  form.classList.add("start-game-form");
  form.innerHTML = `
    <h1>${newGame ? "Create" : "Join"} Game</h1>
    <div>
      <label>Player Name</label>
      <input required type="text" name="name" placeholder="Enter your name" />
    </div>
    <div>
      <label>Game Password</label>
      <input required type="text" name="password" placeholder="Enter game password" />
    </div>
    <button type="submit">${newGame ? "Create" : "Join"}</button>
  `;
}
