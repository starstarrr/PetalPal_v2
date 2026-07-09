class Flower {
  constructor({ mood, event, chosen, position }) {
    this.id = Date.now() + Math.floor(Math.random() * 100000);

    this.mood = mood;
    this.event = event || "";

    this.name = chosen.name;
    this.meaning = chosen.meaning;
    this.img = chosen.img;

    this.date = new Date().toLocaleDateString();

    this.left = position.left;
    this.top = position.top;

    this.supportCount = 0;
    this.messages = [];
  }

  addSupport() {
    this.supportCount += 1;
  }

  addMessage(message) {
    this.messages.push(message);
  }
}

export default Flower;