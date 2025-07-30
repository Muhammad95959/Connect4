import { Notyf } from "notyf";

const form = document.querySelector(".start-game-form") as HTMLFormElement;
const joinBtn = document.querySelector("button.join") as HTMLButtonElement;
const spinner = document.querySelector(".spinner") as HTMLDivElement;
const url = "https://connect4-production-1af4.up.railway.app";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  joinBtn.disabled = true;
  spinner.classList.remove("hidden");

  const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement;
  const roomCodeInput = form.querySelector('input[name="roomCode"]') as HTMLInputElement;

  const name = nameInput.value.trim();
  const roomCode = roomCodeInput?.value.trim().toLowerCase();

  try {
    const response = await fetch(`${url}/check-room/${roomCode}`);
    if (!response.ok) throw new Error("Server error");
    const { isAvailable, isCreated } = await response.json();
    if (!isCreated) {
      new Notyf({ duration: 5000 }).error("The room doesn't exist.");
    } else if (!isAvailable) {
      new Notyf({ duration: 5000 }).error("This room already has two players.");
    } else {
      const params = new URLSearchParams({ name, roomCode });
      window.location.href = `game.html?${params.toString()}`;
    }
  } catch (err) {
    console.error("Failed to check room:", err);
    new Notyf({ duration: 5000 }).error("Failed to connect to the server.");
  }
  joinBtn.disabled = false;
  spinner.classList.add("hidden");
});
