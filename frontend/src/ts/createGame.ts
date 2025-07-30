const url = "https://connect4-production-1af4.up.railway.app";

(async () => {
  const roomCode = await generateRoomCode();
  (document.querySelector(".room-code-input") as HTMLInputElement).value = roomCode;
})();

async function generateRoomCode(length = 6) {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  const response = await fetch(`${url}/check-room/${result}`);
  const { isAvailable } = await response.json();
  if (isAvailable) {
    return result;
  } else {
    return await generateRoomCode(length);
  }
}
