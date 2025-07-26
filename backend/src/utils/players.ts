export interface IPlayer {
  id: string;
  name: string;
  roomCode: string;
  first: boolean;
  score: number;
}

export default class Players {
  playersArray: IPlayer[];
  constructor() {
    this.playersArray = [];
  }

  addPlayer(id: string, name: string, roomCode: string, first: boolean, score = 0) {
    const player = { id, name, roomCode, first, score };
    this.playersArray.push(player);
    return player;
  }

  getPlayers(roomCode: string) {
    return this.playersArray.filter((p) => roomCode === p.roomCode);
  }

  getPlayer(id: string) {
    return this.playersArray.find((p) => id === p.id);
  }

  removePlayer(id: string) {
    const player = this.getPlayer(id);
    if (player) this.playersArray = this.playersArray.filter((player) => player.id !== id);
    return player;
  }

  increasePlayerScore(id: string) {
    const player = this.getPlayer(id);
    if (player) player.score++;
    return player;
  }
}
