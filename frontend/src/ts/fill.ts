const url = "http://localhost:8000";

(async () => {
  const newGame = new URLSearchParams(window.location.search).get("newGame") === "true";
  const form = document.createElement("form");
  document.body.appendChild(form);
  form.action = "game.html";
  form.classList.add("start-game-form");
  const roomCode = newGame ? await generateRoomCode() : "";
  form.innerHTML = `
    <h1>${newGame ? "Create" : "Join"} Game</h1>
    <div>
      <label>Player Name</label>
      <input required type="text" name="name" placeholder="Enter your name" />
    </div>
    <div ${newGame ? "style='display: none'" : ""}>
      <label>Room Code</label>
      <input ${newGame ? `value='${roomCode}'` : ""} required type="text" name="roomCode" placeholder="Enter Room Code" />
    </div>
    <button type="submit">${newGame ? "Create" : "Join"}</button>
  `;
})();

async function generateRoomCode(length = 6) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  const response = await fetch(`${url}/check-room/${result}`);
  const { isAvailable } = await response.json();
  console.log(isAvailable);
  if (isAvailable) {
    return result;
  } else {
    return await generateRoomCode(length);
  }
}
