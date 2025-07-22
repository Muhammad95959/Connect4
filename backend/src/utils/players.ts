export interface IPlayer {
  id: string;
  name: string;
  roomCode: string;
}

export default class Players {
  playersArray: IPlayer[];
  constructor() {
    this.playersArray = [];
  }

  addPlayer(id: string, name: string, roomCode: string) {
    const player = { id, name, roomCode };
    this.playersArray.push(player);
    return player;
  }

  getPlayersNames(roomCode: string) {
    const players = this.playersArray.filter((player) => player.roomCode === roomCode);
    const namesArray = players.map((player) => player.name);
    return namesArray;
  }

  getPlayer(id: string) {
    return this.playersArray.filter((player) => id === player.id)[0];
  }

  removePlayer(id: string) {
    const player = this.getPlayer(id);
    if (player) this.playersArray = this.playersArray.filter((player) => player.id !== id);
    return player;
  }
}
