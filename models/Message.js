class Message {
  constructor(author, text) {
    this.id = Date.now() + Math.floor(Math.random() * 100000);
    this.author = author || "Friend";
    this.text = text || "";
    this.date = new Date().toLocaleDateString();
  }
}

export default Message;