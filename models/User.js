import Garden from "./Garden.js";

class User {
  constructor({ id, name, avatar, friends = [] }) {
    this.id = id;
    this.name = name;
    this.avatar = avatar || "🦋";
    this.friends = friends;
    this.garden = new Garden(this.id, this.name);
  }

  addFriend(friendId) {
    if (!this.friends.includes(friendId)) {
      this.friends.push(friendId);
    }
  }

  getFriendIds() {
    return this.friends;
  }

  getGarden() {
    return this.garden;
  }
}

export default User;